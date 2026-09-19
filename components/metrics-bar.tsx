"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, Globe2, ShieldAlert, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ThreatFeedResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MetricsBarProps {
  stats?: ThreatFeedResponse["stats"];
  isLoading: boolean;
}

function MetricTile({
  icon: Icon,
  label,
  value,
  accent,
  suffix,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  accent: string;
  suffix?: string;
}) {
  return (
    <Card className="relative flex flex-1 min-w-[150px] items-center gap-3 overflow-hidden px-4 py-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold tabular-nums text-slate-100">{value}</span>
          {suffix && <span className="text-[10px] text-slate-500">{suffix}</span>}
        </div>
      </div>
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 w-1"
        style={{ backgroundColor: accent }}
        animate={{ opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
    </Card>
  );
}

export function MetricsBar({ stats, isLoading }: MetricsBarProps) {
  const topCountry = stats?.topCountries?.[0];

  return (
    <div className={cn("flex flex-wrap gap-3", isLoading && "animate-pulse")}>
      <MetricTile
        icon={Activity}
        label="Active Threats"
        value={stats?.activeThreats ?? "—"}
        accent="#22d3ee"
      />
      <MetricTile
        icon={Zap}
        label="Attacks / min"
        value={stats?.attacksPerMinute ?? "—"}
        accent="#fb3d4a"
      />
      <MetricTile
        icon={ShieldAlert}
        label="High-Risk CVEs"
        value={stats?.highRiskCves ?? "—"}
        accent="#f59e0b"
      />
      <MetricTile
        icon={Globe2}
        label="Top Origin"
        value={topCountry?.countryCode ?? "—"}
        suffix={topCountry ? `${topCountry.count} events` : undefined}
        accent="#a78bfa"
      />
      <MetricTile
        icon={AlertTriangle}
        label="Critical Alerts"
        value={stats?.bySeverity.critical ?? "—"}
        accent="#fb3d4a"
      />
    </div>
  );
}
