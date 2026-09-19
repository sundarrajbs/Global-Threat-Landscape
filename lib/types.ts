export type ThreatType =
  | "ransomware"
  | "phishing"
  | "botnet"
  | "malware"
  | "cve"
  | "ddos"
  | "c2";

export type ThreatSeverity = "critical" | "high" | "medium" | "low";

export type ThreatSource =
  | "AbuseIPDB"
  | "URLhaus"
  | "ThreatFox"
  | "CISA KEV"
  | "Mock";

export interface GeoPoint {
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  asn?: string;
  isp?: string;
}

export interface IndicatorOfCompromise {
  ip?: string;
  domain?: string;
  url?: string;
  hash?: string;
  cve?: string;
}

export interface ThreatEvent {
  id: string;
  type: ThreatType;
  severity: ThreatSeverity;
  title: string;
  description: string;
  origin: GeoPoint;
  target: GeoPoint;
  ioc: IndicatorOfCompromise;
  mitreTactics: string[];
  confidence: number;
  timestamp: string;
  source: ThreatSource;
  raw: Record<string, unknown>;
}

export interface SourceStatus {
  name: ThreatSource;
  ok: boolean;
  count: number;
  usedFallback: boolean;
  error?: string;
}

export interface ThreatFeedResponse {
  events: ThreatEvent[];
  stats: {
    total: number;
    bySeverity: Record<ThreatSeverity, number>;
    byType: Record<ThreatType, number>;
    topCountries: { country: string; countryCode: string; count: number }[];
    attacksPerMinute: number;
    activeThreats: number;
    highRiskCves: number;
  };
  sources: SourceStatus[];
  generatedAt: string;
}

export interface ThreatFilters {
  search?: string;
  types?: ThreatType[];
  severities?: ThreatSeverity[];
  countryCode?: string;
}
