import { getCountry, randomCountry, jitter } from "./geo";
import type { ThreatEvent, ThreatSeverity } from "./types";
import { generateMockEvent } from "./mockData";

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function randomHex(len: number): string {
  let out = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

/* -------------------------------------------------------------------------- */
/* AbuseIPDB — live reported malicious IPs                                     */
/* -------------------------------------------------------------------------- */

interface AbuseIpDbEntry {
  ipAddress: string;
  countryCode?: string;
  abuseConfidenceScore: number;
  lastReportedAt?: string;
}

export async function fetchAbuseIpDb(): Promise<ThreatEvent[]> {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey) throw new Error("ABUSEIPDB_API_KEY not configured");

  const res = await fetchWithTimeout(
    "https://api.abuseipdb.com/api/v2/blacklist?limit=60&confidenceMinimum=75",
    { headers: { Key: apiKey, Accept: "application/json" }, next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`AbuseIPDB responded ${res.status}`);
  const json = (await res.json()) as { data?: AbuseIpDbEntry[] };
  const entries = json.data ?? [];
  if (entries.length === 0) throw new Error("AbuseIPDB returned no data");

  return entries.map((entry) => {
    const origin = getCountry(entry.countryCode);
    const target = randomCountry();
    const score = entry.abuseConfidenceScore ?? 50;
    const severity: ThreatSeverity =
      score >= 90 ? "critical" : score >= 75 ? "high" : score >= 50 ? "medium" : "low";

    return {
      id: `abuseipdb-${entry.ipAddress}`,
      type: "botnet",
      severity,
      title: `Malicious IP reported: ${entry.ipAddress}`,
      description: `IP address flagged by the AbuseIPDB community with a ${score}% abuse confidence score, most recently reported from ${origin.country}.`,
      origin: {
        country: origin.country,
        countryCode: origin.countryCode,
        lat: jitter(origin.lat),
        lon: jitter(origin.lon),
      },
      target: {
        country: target.country,
        countryCode: target.countryCode,
        lat: jitter(target.lat),
        lon: jitter(target.lon),
      },
      ioc: { ip: entry.ipAddress },
      mitreTactics: ["TA0011 Command and Control"],
      confidence: score,
      timestamp: entry.lastReportedAt ?? new Date().toISOString(),
      source: "AbuseIPDB",
      raw: entry as unknown as Record<string, unknown>,
    } satisfies ThreatEvent;
  });
}

/* -------------------------------------------------------------------------- */
/* URLhaus — real-time malware distribution URLs                               */
/* -------------------------------------------------------------------------- */

interface UrlhausEntry {
  id: string;
  url: string;
  url_status?: string;
  host?: string;
  date_added?: string;
  threat?: string;
  tags?: string[];
  reporter?: string;
}

export async function fetchUrlhaus(): Promise<ThreatEvent[]> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.URLHAUS_API_KEY) headers["Auth-Key"] = process.env.URLHAUS_API_KEY;

  const res = await fetchWithTimeout(
    "https://urlhaus.abuse.ch/downloads/json_recent/",
    { headers, next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`URLhaus responded ${res.status}`);
  const json = (await res.json()) as Record<string, UrlhausEntry[]>;
  const entries = Object.values(json)
    .map((arr) => arr[0])
    .filter(Boolean)
    .slice(0, 60);
  if (entries.length === 0) throw new Error("URLhaus returned no data");

  return entries.map((entry) => {
    const origin = randomCountry();
    const target = randomCountry();
    const threat = entry.threat ?? "malware_download";
    const severity: ThreatSeverity = threat.includes("ransom")
      ? "critical"
      : entry.url_status === "online"
      ? "high"
      : "medium";

    return {
      id: `urlhaus-${entry.id ?? randomHex(8)}`,
      type: "malware",
      severity,
      title: `Malware distribution URL detected (${entry.host ?? "unknown host"})`,
      description: `URLhaus reports an ${entry.url_status ?? "unknown"} malware distribution URL classified as "${threat}"${
        entry.tags?.length ? `, tagged: ${entry.tags.join(", ")}` : ""
      }.`,
      origin: {
        country: origin.country,
        countryCode: origin.countryCode,
        lat: jitter(origin.lat),
        lon: jitter(origin.lon),
      },
      target: {
        country: target.country,
        countryCode: target.countryCode,
        lat: jitter(target.lat),
        lon: jitter(target.lon),
      },
      ioc: { url: entry.url, domain: entry.host },
      mitreTactics: ["TA0001 Initial Access", "TA0002 Execution"],
      confidence: entry.url_status === "online" ? 85 : 60,
      timestamp: entry.date_added
        ? new Date(entry.date_added.replace(" ", "T") + "Z").toISOString()
        : new Date().toISOString(),
      source: "URLhaus",
      raw: entry as unknown as Record<string, unknown>,
    } satisfies ThreatEvent;
  });
}

/* -------------------------------------------------------------------------- */
/* ThreatFox — botnet C2 / IOCs                                                */
/* -------------------------------------------------------------------------- */

interface ThreatFoxEntry {
  id: string;
  ioc: string;
  ioc_type?: string;
  threat_type?: string;
  malware_printable?: string;
  confidence_level?: number;
  first_seen?: string;
  tags?: string[] | null;
}

export async function fetchThreatFox(): Promise<ThreatEvent[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (process.env.THREATFOX_API_KEY) headers["Auth-Key"] = process.env.THREATFOX_API_KEY;

  const res = await fetchWithTimeout("https://threatfox-api.abuse.ch/api/v1/", {
    method: "POST",
    headers,
    body: JSON.stringify({ query: "get_iocs", days: 1 }),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`ThreatFox responded ${res.status}`);
  const json = (await res.json()) as { query_status?: string; data?: ThreatFoxEntry[] };
  if (json.query_status !== "ok" || !json.data?.length) {
    throw new Error("ThreatFox returned no data");
  }

  return json.data.slice(0, 60).map((entry) => {
    const origin = randomCountry();
    const target = randomCountry();
    const confidence = entry.confidence_level ?? 60;
    const severity: ThreatSeverity =
      confidence >= 90 ? "critical" : confidence >= 70 ? "high" : confidence >= 40 ? "medium" : "low";
    const isIp = entry.ioc_type?.includes("ip");

    return {
      id: `threatfox-${entry.id}`,
      type: "c2",
      severity,
      title: `${entry.malware_printable ?? "Unknown malware"} C2 indicator`,
      description: `ThreatFox IOC classified as "${entry.threat_type ?? "botnet_cc"}" associated with ${
        entry.malware_printable ?? "an unidentified malware family"
      }.`,
      origin: {
        country: origin.country,
        countryCode: origin.countryCode,
        lat: jitter(origin.lat),
        lon: jitter(origin.lon),
      },
      target: {
        country: target.country,
        countryCode: target.countryCode,
        lat: jitter(target.lat),
        lon: jitter(target.lon),
      },
      ioc: isIp ? { ip: entry.ioc.split(":")[0] } : { domain: entry.ioc, url: entry.ioc },
      mitreTactics: ["TA0011 Command and Control", "TA0005 Defense Evasion"],
      confidence,
      timestamp: entry.first_seen
        ? new Date(entry.first_seen.replace(" ", "T") + "Z").toISOString()
        : new Date().toISOString(),
      source: "ThreatFox",
      raw: entry as unknown as Record<string, unknown>,
    } satisfies ThreatEvent;
  });
}

/* -------------------------------------------------------------------------- */
/* CISA KEV — known exploited vulnerabilities catalog                          */
/* -------------------------------------------------------------------------- */

interface KevEntry {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction?: string;
  dueDate?: string;
  knownRansomwareCampaignUse?: string;
}

export async function fetchCisaKev(): Promise<ThreatEvent[]> {
  const res = await fetchWithTimeout(
    "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
    { headers: { Accept: "application/json" }, next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`CISA KEV responded ${res.status}`);
  const json = (await res.json()) as { vulnerabilities?: KevEntry[] };
  const all = json.vulnerabilities ?? [];
  if (all.length === 0) throw new Error("CISA KEV returned no data");

  // Most recently added entries are the most relevant for a "live" feed.
  const recent = [...all]
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
    .slice(0, 40);

  return recent.map((entry) => {
    const origin = randomCountry();
    const target = randomCountry();
    const ransomware = entry.knownRansomwareCampaignUse === "Known";

    return {
      id: `kev-${entry.cveID}`,
      type: "cve",
      severity: ransomware ? "critical" : "high",
      title: `${entry.cveID}: ${entry.vulnerabilityName}`,
      description: `${entry.shortDescription} Affected: ${entry.vendorProject} ${entry.product}.${
        ransomware ? " Known to be used in ransomware campaigns." : ""
      }`,
      origin: {
        country: origin.country,
        countryCode: origin.countryCode,
        lat: jitter(origin.lat),
        lon: jitter(origin.lon),
      },
      target: {
        country: target.country,
        countryCode: target.countryCode,
        lat: jitter(target.lat),
        lon: jitter(target.lon),
      },
      ioc: { cve: entry.cveID },
      mitreTactics: ["TA0001 Initial Access", "TA0004 Privilege Escalation"],
      confidence: 95,
      timestamp: new Date(entry.dateAdded).toISOString(),
      source: "CISA KEV",
      raw: entry as unknown as Record<string, unknown>,
    } satisfies ThreatEvent;
  });
}

/* -------------------------------------------------------------------------- */
/* Aggregation helper                                                          */
/* -------------------------------------------------------------------------- */

export interface SourceResult {
  name: "AbuseIPDB" | "URLhaus" | "ThreatFox" | "CISA KEV";
  events: ThreatEvent[];
  ok: boolean;
  usedFallback: boolean;
  error?: string;
  mockCount: number;
}

const FALLBACK_COUNTS = {
  AbuseIPDB: 22,
  URLhaus: 22,
  ThreatFox: 20,
  "CISA KEV": 18,
} as const;

const SOURCE_TYPE_HINT = {
  AbuseIPDB: "botnet",
  URLhaus: "malware",
  ThreatFox: "c2",
  "CISA KEV": "cve",
} as const;

export async function fetchAllSources(): Promise<SourceResult[]> {
  const jobs: { name: SourceResult["name"]; run: () => Promise<ThreatEvent[]> }[] = [
    { name: "AbuseIPDB", run: fetchAbuseIpDb },
    { name: "URLhaus", run: fetchUrlhaus },
    { name: "ThreatFox", run: fetchThreatFox },
    { name: "CISA KEV", run: fetchCisaKev },
  ];

  const settled = await Promise.allSettled(jobs.map((j) => j.run()));

  return settled.map((result, i) => {
    const name = jobs[i].name;
    if (result.status === "fulfilled" && result.value.length > 0) {
      return { name, events: result.value, ok: true, usedFallback: false, mockCount: 0 };
    }
    const error =
      result.status === "rejected"
        ? result.reason instanceof Error
          ? result.reason.message
          : String(result.reason)
        : "No data returned";
    const mockCount = FALLBACK_COUNTS[name];
    const events = Array.from({ length: mockCount }, () =>
      generateMockEvent({ type: SOURCE_TYPE_HINT[name] as ThreatEvent["type"], source: "Mock" })
    );
    return { name, events, ok: false, usedFallback: true, error, mockCount };
  });
}
