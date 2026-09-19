import type { ThreatSource } from "./types";

export interface FeedDefinition {
  name: Exclude<ThreatSource, "Mock">;
  label: string;
  description: string;
  provides: string;
  homepage: string;
  authRequired: "required" | "optional" | "none";
}

// The canonical list of every feed this dashboard is wired to ingest — shown
// in the UI regardless of whether it's currently live or falling back to
// mock data, so no configured source is ever silently missing from view.
export const FEED_CATALOG: FeedDefinition[] = [
  {
    name: "AbuseIPDB",
    label: "AbuseIPDB",
    description: "Community-reported malicious IP blacklist",
    provides: "Botnet / malicious IP indicators",
    homepage: "https://www.abuseipdb.com/",
    authRequired: "required",
  },
  {
    name: "URLhaus",
    label: "URLhaus",
    description: "abuse.ch — real-time malware distribution URLs",
    provides: "Malware payload delivery URLs",
    homepage: "https://urlhaus.abuse.ch/",
    authRequired: "optional",
  },
  {
    name: "ThreatFox",
    label: "ThreatFox",
    description: "abuse.ch — botnet C2 / IOC feed",
    provides: "Command & control infrastructure",
    homepage: "https://threatfox.abuse.ch/",
    authRequired: "optional",
  },
  {
    name: "CISA KEV",
    label: "CISA KEV Catalog",
    description: "Known Exploited Vulnerabilities catalog",
    provides: "Actively exploited CVEs",
    homepage: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
    authRequired: "none",
  },
];
