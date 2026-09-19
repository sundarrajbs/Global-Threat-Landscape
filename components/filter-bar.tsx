"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TYPE_META, TYPE_ORDER, SEVERITY_META, SEVERITY_ORDER } from "@/lib/threat-meta";
import type { ThreatFilters, ThreatSeverity, ThreatType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  filters: ThreatFilters;
  onChange: (filters: ThreatFilters) => void;
  countries: { country: string; countryCode: string; count: number }[];
  resultCount: number;
}

export function FilterBar({ filters, onChange, countries, resultCount }: FilterBarProps) {
  const toggleType = (type: ThreatType) => {
    const current = filters.types ?? [];
    const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    onChange({ ...filters, types: next });
  };

  const toggleSeverity = (severity: ThreatSeverity) => {
    const current = filters.severities ?? [];
    const next = current.includes(severity)
      ? current.filter((s) => s !== severity)
      : [...current, severity];
    onChange({ ...filters, severities: next });
  };

  const hasActiveFilters =
    (filters.types?.length ?? 0) > 0 ||
    (filters.severities?.length ?? 0) > 0 ||
    !!filters.countryCode ||
    !!filters.search;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-cyber-border bg-cyber-panel/70 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search IOC, IP, domain, CVE, country..."
            className="pl-8"
            value={filters.search ?? ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>

        <Select
          value={filters.countryCode ?? "all"}
          onValueChange={(value) =>
            onChange({ ...filters, countryCode: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.countryCode} value={c.countryCode}>
                {c.country} ({c.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({})}
            className="text-slate-400 hover:text-cyber-red"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] uppercase tracking-widest text-slate-500">Type</span>
        {TYPE_ORDER.map((type) => {
          const meta = TYPE_META[type];
          const active = filters.types?.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "border-transparent text-black"
                  : "border-cyber-border text-slate-400 hover:border-slate-500 hover:text-slate-200"
              )}
              style={active ? { backgroundColor: meta.color } : undefined}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] uppercase tracking-widest text-slate-500">Severity</span>
        {SEVERITY_ORDER.map((severity) => {
          const active = filters.severities?.includes(severity);
          return (
            <Badge
              key={severity}
              variant={active ? SEVERITY_META[severity].badge : "outline"}
              className="cursor-pointer select-none"
              onClick={() => toggleSeverity(severity)}
            >
              {SEVERITY_META[severity].label}
            </Badge>
          );
        })}
        <span className="ml-auto text-[11px] text-slate-500">
          {resultCount} matching event{resultCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
