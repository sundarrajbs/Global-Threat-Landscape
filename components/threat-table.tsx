"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TYPE_META, SEVERITY_META } from "@/lib/threat-meta";
import { formatRelativeTime, truncateMiddle } from "@/lib/utils";
import type { ThreatEvent } from "@/lib/types";
import { Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreatTableProps {
  events: ThreatEvent[];
  onSelect: (event: ThreatEvent) => void;
  selectedId?: string;
}

function iocLabel(event: ThreatEvent): string {
  const { ioc } = event;
  return ioc.cve ?? ioc.ip ?? ioc.domain ?? ioc.url ?? ioc.hash ?? "—";
}

export function ThreatTable({ events, onSelect, selectedId }: ThreatTableProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>
          <Table2 className="h-4 w-4 text-cyber-cyan" />
          Threat Events
        </CardTitle>
        <span className="text-[11px] text-slate-500">{events.length} results</span>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[420px] scrollbar-thin">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-cyber-panel">
              <tr className="border-b border-cyber-border text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2 font-medium">Severity</th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 font-medium">Title</th>
                <th className="px-2 py-2 font-medium">Origin</th>
                <th className="px-2 py-2 font-medium">Target</th>
                <th className="px-2 py-2 font-medium">IOC</th>
                <th className="px-2 py-2 font-medium">Confidence</th>
                <th className="px-4 py-2 font-medium text-right">Seen</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const meta = TYPE_META[event.type];
                const Icon = meta.icon;
                return (
                  <tr
                    key={event.id}
                    onClick={() => onSelect(event)}
                    className={cn(
                      "cursor-pointer border-b border-cyber-border/60 transition-colors hover:bg-white/[0.03]",
                      selectedId === event.id && "bg-cyber-cyan/5"
                    )}
                  >
                    <td className="px-4 py-2">
                      <Badge variant={SEVERITY_META[event.severity].badge}>
                        {SEVERITY_META[event.severity].label}
                      </Badge>
                    </td>
                    <td className="px-2 py-2">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="max-w-[220px] truncate px-2 py-2 text-slate-300">
                      {event.title}
                    </td>
                    <td className="px-2 py-2 text-slate-400">{event.origin.country}</td>
                    <td className="px-2 py-2 text-slate-400">{event.target.country}</td>
                    <td className="px-2 py-2 font-mono text-slate-500">
                      {truncateMiddle(iocLabel(event), 22)}
                    </td>
                    <td className="px-2 py-2 text-slate-400">{event.confidence}%</td>
                    <td className="px-4 py-2 text-right text-slate-500">
                      {formatRelativeTime(event.timestamp)}
                    </td>
                  </tr>
                );
              })}
              {events.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No events match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
