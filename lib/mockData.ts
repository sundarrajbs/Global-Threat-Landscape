import { COUNTRIES, randomCountry, jitter } from "./geo";
import { MITRE_TACTIC_ORDER } from "./threat-meta";
import type {
  ThreatEvent,
  ThreatSeverity,
  ThreatType,
  IndicatorOfCompromise,
} from "./types";

const THREAT_TYPES: ThreatType[] = [
  "ransomware",
  "phishing",
  "botnet",
  "malware",
  "cve",
  "ddos",
  "c2",
];

const SEVERITIES: ThreatSeverity[] = ["critical", "high", "medium", "low"];
const SEVERITY_WEIGHTS: Record<ThreatSeverity, number> = {
  critical: 0.12,
  high: 0.28,
  medium: 0.38,
  low: 0.22,
};

const MITRE_TACTICS = MITRE_TACTIC_ORDER.map((tactic) => tactic.id);

const MALWARE_FAMILIES = [
  "Emotet",
  "TrickBot",
  "Qakbot",
  "LockBit",
  "BlackCat",
  "Conti",
  "AgentTesla",
  "Cobalt Strike",
  "Redline Stealer",
  "IcedID",
  "Dridex",
  "Gh0stRAT",
  "AsyncRAT",
  "njRAT",
  "Mirai",
];

const RANSOMWARE_GROUPS = [
  "LockBit 3.0",
  "BlackCat/ALPHV",
  "Cl0p",
  "Royal",
  "Akira",
  "Play",
  "Medusa",
  "BianLian",
];

const TARGET_SECTORS = [
  "Financial Services",
  "Healthcare",
  "Government",
  "Energy & Utilities",
  "Manufacturing",
  "Education",
  "Retail",
  "Telecommunications",
  "Critical Infrastructure",
  "Technology",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedSeverity(): ThreatSeverity {
  const r = Math.random();
  let cumulative = 0;
  for (const sev of SEVERITIES) {
    cumulative += SEVERITY_WEIGHTS[sev];
    if (r <= cumulative) return sev;
  }
  return "low";
}

function randomHex(len: number): string {
  let out = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

function randomIp(): string {
  return `${1 + Math.floor(Math.random() * 223)}.${Math.floor(
    Math.random() * 256
  )}.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`;
}

function randomDomain(): string {
  const words = [
    "secure",
    "update",
    "login",
    "verify",
    "portal",
    "cloud",
    "service",
    "mail",
    "account",
    "billing",
  ];
  const tlds = [".xyz", ".top", ".info", ".ru", ".cn", ".online", ".biz", ".click"];
  return `${pick(words)}-${pick(words)}${Math.floor(Math.random() * 999)}${pick(
    tlds
  )}`;
}

function randomCve(): string {
  const year = 2019 + Math.floor(Math.random() * 7);
  const num = 1000 + Math.floor(Math.random() * 48000);
  return `CVE-${year}-${num}`;
}

function buildIoc(type: ThreatType): IndicatorOfCompromise {
  switch (type) {
    case "phishing":
      return { url: `https://${randomDomain()}/${randomHex(8)}`, domain: randomDomain() };
    case "botnet":
    case "c2":
      return { ip: randomIp(), domain: Math.random() > 0.5 ? randomDomain() : undefined };
    case "malware":
    case "ransomware":
      return { hash: randomHex(64), ip: Math.random() > 0.4 ? randomIp() : undefined };
    case "cve":
      return { cve: randomCve() };
    case "ddos":
      return { ip: randomIp() };
    default:
      return { ip: randomIp() };
  }
}

function buildTitleAndDescription(
  type: ThreatType,
  severity: ThreatSeverity,
  originCountry: string,
  targetCountry: string
): { title: string; description: string } {
  const sector = pick(TARGET_SECTORS);
  switch (type) {
    case "ransomware": {
      const group = pick(RANSOMWARE_GROUPS);
      return {
        title: `${group} ransomware activity targeting ${sector}`,
        description: `Encryption and double-extortion activity attributed to ${group}, originating from infrastructure in ${originCountry} and targeting ${sector.toLowerCase()} organizations in ${targetCountry}.`,
      };
    }
    case "phishing":
      return {
        title: `Credential-harvesting phishing campaign — ${sector}`,
        description: `Large-scale phishing campaign impersonating trusted services to harvest credentials from employees in the ${sector.toLowerCase()} sector, hosted on infrastructure in ${originCountry}.`,
      };
    case "botnet": {
      const family = pick(MALWARE_FAMILIES);
      return {
        title: `${family} botnet node reported`,
        description: `Host identified as an active node in the ${family} botnet, communicating with peers and issuing scans/spam from ${originCountry} toward targets in ${targetCountry}.`,
      };
    }
    case "malware": {
      const family = pick(MALWARE_FAMILIES);
      return {
        title: `${family} payload distribution detected`,
        description: `Malware distribution URL serving ${family} payloads observed delivering to victims in ${targetCountry}, hosted from ${originCountry}.`,
      };
    }
    case "cve":
      return {
        title: `Active exploitation of known vulnerability — ${sector}`,
        description: `CISA KEV catalog entry indicates confirmed active exploitation in the wild, with observed targeting of ${sector.toLowerCase()} systems.`,
      };
    case "ddos":
      return {
        title: `Volumetric DDoS attack against ${sector}`,
        description: `Distributed denial-of-service traffic flooding ${targetCountry} infrastructure, sourced from a botnet cluster concentrated in ${originCountry}.`,
      };
    case "c2":
      return {
        title: `Command & Control server identified`,
        description: `Active C2 server tracked communicating with compromised endpoints in ${targetCountry}; infrastructure hosted in ${originCountry}. Severity: ${severity}.`,
      };
  }
}

let counter = 0;

export function generateMockEvent(overrides?: Partial<ThreatEvent>): ThreatEvent {
  counter += 1;
  const type = overrides?.type ?? pick(THREAT_TYPES);
  const severity = overrides?.severity ?? weightedSeverity();
  const originGeo = randomCountry();
  let targetGeo = randomCountry();
  if (targetGeo.countryCode === originGeo.countryCode) {
    targetGeo = randomCountry();
  }

  const { title, description } = buildTitleAndDescription(
    type,
    severity,
    originGeo.country,
    targetGeo.country
  );

  const now = Date.now();
  // Skew towards recent activity while still spreading events across the
  // last 24h so the attack-frequency timeline reads naturally in fallback mode.
  const skew = Math.pow(Math.random(), 2);
  const timestamp = new Date(now - Math.floor(skew * 1000 * 60 * 60 * 24)).toISOString();

  const asnNum = 1000 + Math.floor(Math.random() * 64000);
  const isps = [
    "DigitalOcean LLC",
    "Amazon.com Inc.",
    "Alibaba Cloud",
    "Hetzner Online GmbH",
    "OVH SAS",
    "China Telecom",
    "Rostelecom",
    "M247 Ltd",
    "Choopa LLC",
    "Tencent Cloud",
  ];

  return {
    id: `mock-${now}-${counter}-${randomHex(6)}`,
    type,
    severity,
    title,
    description,
    origin: {
      country: originGeo.country,
      countryCode: originGeo.countryCode,
      lat: jitter(originGeo.lat),
      lon: jitter(originGeo.lon),
      asn: `AS${asnNum}`,
      isp: pick(isps),
    },
    target: {
      country: targetGeo.country,
      countryCode: targetGeo.countryCode,
      lat: jitter(targetGeo.lat),
      lon: jitter(targetGeo.lon),
    },
    ioc: buildIoc(type),
    mitreTactics: Array.from(
      { length: 1 + Math.floor(Math.random() * 3) },
      () => pick(MITRE_TACTICS)
    ).filter((v, i, arr) => arr.indexOf(v) === i),
    confidence: Math.round(40 + Math.random() * 60),
    timestamp,
    source: "Mock",
    raw: {
      generator: "mockData.ts",
      note: "Synthetic event generated as a fallback when live feeds are unavailable or rate-limited.",
    },
    ...overrides,
  };
}

export function generateMockThreats(count: number): ThreatEvent[] {
  return Array.from({ length: count }, () => generateMockEvent()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function allCountries() {
  return COUNTRIES;
}
