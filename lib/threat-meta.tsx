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
