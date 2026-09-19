import {
  Bug,
  Fish,
  Network,
  ShieldAlert,
  Skull,
  Waves,
  Radio,
  type LucideIcon,
} from "lucide-react";
import type { ThreatSeverity, ThreatType } from "./types";

export const TYPE_META: Record<ThreatType, { label: string; icon: LucideIcon; color: string }> = {
  ransomware: { label: "Ransomware", icon: Skull, color: "#fb3d4a" },
  phishing: { label: "Phishing", icon: Fish, color: "#f59e0b" },
  botnet: { label: "Botnet", icon: Network, color: "#a78bfa" },
  malware: { label: "Malware", icon: Bug, color: "#fb923c" },
  cve: { label: "CVE Exploit", icon: ShieldAlert, color: "#22d3ee" },
  ddos: { label: "DDoS", icon: Waves, color: "#38bdf8" },
  c2: { label: "C2 Server", icon: Radio, color: "#34d399" },
};

export const SEVERITY_META: Record<
  ThreatSeverity,
  { label: string; badge: "critical" | "high" | "medium" | "low"; color: string }
> = {
  critical: { label: "Critical", badge: "critical", color: "#fb3d4a" },
  high: { label: "High", badge: "high", color: "#fb923c" },
  medium: { label: "Medium", badge: "medium", color: "#f59e0b" },
  low: { label: "Low", badge: "low", color: "#34d399" },
};

export const TYPE_ORDER: ThreatType[] = [
  "ransomware",
  "phishing",
  "botnet",
  "malware",
  "cve",
  "ddos",
  "c2",
];

export const SEVERITY_ORDER: ThreatSeverity[] = ["critical", "high", "medium", "low"];

export interface MitreTactic {
  /** Exact string stored on ThreatEvent.mitreTactics, e.g. "TA0001 Initial Access". */
  id: string;
  code: string;
  name: string;
}

// Full MITRE ATT&CK Enterprise tactic list, in kill-chain order. Feeds/mock
// data currently only assign a subset — the rest render as zero-count rows
// so the heatmap always shows complete tactic coverage, not just what's
// been observed so far.
export const MITRE_TACTIC_ORDER: MitreTactic[] = [
  { id: "TA0043 Reconnaissance", code: "TA0043", name: "Reconnaissance" },
  { id: "TA0042 Resource Development", code: "TA0042", name: "Resource Development" },
  { id: "TA0001 Initial Access", code: "TA0001", name: "Initial Access" },
  { id: "TA0002 Execution", code: "TA0002", name: "Execution" },
  { id: "TA0003 Persistence", code: "TA0003", name: "Persistence" },
  { id: "TA0004 Privilege Escalation", code: "TA0004", name: "Privilege Escalation" },
  { id: "TA0005 Defense Evasion", code: "TA0005", name: "Defense Evasion" },
  { id: "TA0006 Credential Access", code: "TA0006", name: "Credential Access" },
  { id: "TA0007 Discovery", code: "TA0007", name: "Discovery" },
  { id: "TA0008 Lateral Movement", code: "TA0008", name: "Lateral Movement" },
  { id: "TA0009 Collection", code: "TA0009", name: "Collection" },
  { id: "TA0011 Command and Control", code: "TA0011", name: "Command and Control" },
  { id: "TA0010 Exfiltration", code: "TA0010", name: "Exfiltration" },
  { id: "TA0040 Impact", code: "TA0040", name: "Impact" },
];
