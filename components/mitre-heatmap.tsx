"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MITRE_TACTIC_ORDER, SEVERITY_META, SEVERITY_ORDER } from "@/lib/threat-meta";
import { cn } from "@/lib/utils";
import type { ThreatEvent, ThreatSeverity } from "@/lib/types";
import { Crosshair } from "lucide-react";

interface MitreHeatmapProps {
  events: ThreatEvent[];
}

// Sequential single-hue (cyber-cyan) ramp, alpha-composited over the card's
// dark surface. Levels 4-5 flip to dark text — both text colors clear a
// >=5.2:1 contrast ratio against every cell at their level (validated against
// the #0a0e17 panel surface), comfortably above the 4.5:1 AA threshold.
const LEVEL_ALPHA = [0, 0.12, 0.25, 0.45, 0.65, 0.85];
const DARK_TEXT_FROM_LEVEL = 4;

function levelForCount(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  return Math.min(5, Math.max(1, Math.ceil((count / max) * 5)));
}

interface HoverInfo {
  tacticName: string;
  severity: ThreatSeverity;
  count: number;
}

export function MitreHeatmap({ events }: MitreHeatmapProps) {
  const [hovered, setHovered] = useState<HoverInfo | null>(null);

  const { matrix, rowTotals, maxCount, totalMapped } = useMemo(() => {
    const matrix = MITRE_TACTIC_ORDER.map(() =>
      Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0])) as Record<ThreatSeverity, number>
    );
    const rowTotals = MITRE_TACTIC_ORDER.map(() => 0);
    let max = 0;
    let mapped = 0;

    events.forEach((event) => {
      event.mitreTactics.forEach((tacticId) => {
        const rowIndex = MITRE_TACTIC_ORDER.findIndex((t) => t.id === tacticId);
        if (rowIndex === -1) return;
        matrix[rowIndex][event.severity] += 1;
        rowTotals[rowIndex] += 1;
        max = Math.max(max, matrix[rowIndex][event.severity]);
        mapped += 1;
      });
    });

    return { matrix, rowTotals, maxCount: max, totalMapped: mapped };
  }, [events]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Crosshair className="h-4 w-4 text-cyber-cyan" />
          MITRE ATT&CK Tactic Heatmap
        </CardTitle>
        <CardDescription>
          Observed tactics × severity across {totalMapped} mapped indicator{totalMapped === 1 ? "" : "s"} — the full Enterprise tactic matrix, so uncovered tactics are visible too.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalMapped === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            No MITRE ATT&CK tactic data available for the current filters.
          </div>
        ) : (
          <>
            <div className="mb-2 h-8 rounded-md border border-cyber-border bg-black/20 px-3 text-[11px] leading-8 text-slate-400">
              {hovered ? (
                <span className="text-slate-200">
                  <span className="font-semibold">{hovered.tacticName}</span> ×{" "}
                  <span style={{ color: SEVERITY_META[hovered.severity].color }}>
                    {SEVERITY_META[hovered.severity].label}
                  </span>
                  {" — "}
                  {hovered.count} event{hovered.count === 1 ? "" : "s"}
                </span>
              ) : (
                "Hover or focus a cell for details"
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-separate border-spacing-1 text-xs">
                <thead>
                  <tr>
                    <th className="w-40 px-2 py-1 text-left text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Tactic
                    </th>
                    {SEVERITY_ORDER.map((severity) => (
                      <th
                        key={severity}
                        scope="col"
                        className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider"
                        style={{ color: SEVERITY_META[severity].color }}
                      >
                        {SEVERITY_META[severity].label}
                      </th>
                    ))}
                    <th className="px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MITRE_TACTIC_ORDER.map((tactic, rowIndex) => (
                    <tr key={tactic.id}>
                      <th
                        scope="row"
                        className="whitespace-nowrap px-2 py-1 text-left text-[11px] font-normal text-slate-400"
                      >
                        <span className="font-mono text-slate-600">{tactic.code}</span>{" "}
                        {tactic.name}
                      </th>
                      {SEVERITY_ORDER.map((severity) => {
                        const count = matrix[rowIndex][severity];
                        const level = levelForCount(count, maxCount);
                        const dark = level >= DARK_TEXT_FROM_LEVEL;
                        return (
                          <td key={severity} className="p-0 text-center">
                            <button
                              type="button"
                              onMouseEnter={() =>
                                setHovered({ tacticName: tactic.name, severity, count })
                              }
                              onFocus={() =>
                                setHovered({ tacticName: tactic.name, severity, count })
                              }
                              onMouseLeave={() => setHovered(null)}
                              onBlur={() => setHovered(null)}
                              className={cn(
                                "h-7 w-full min-w-[44px] rounded-[4px] text-[11px] font-semibold tabular-nums transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-1 focus-visible:outline-cyber-cyan"
                              )}
                              style={{
                                backgroundColor:
                                  level === 0
                                    ? "rgba(255,255,255,0.03)"
                                    : `rgba(34,211,238,${LEVEL_ALPHA[level]})`,
                                color: level === 0 ? "#475569" : dark ? "#05070d" : "#e2e8f0",
                              }}
                            >
                              {count > 0 ? count : ""}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-2 py-1 text-center font-mono text-slate-400">
                        {rowTotals[rowIndex]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
              <span>Fewer</span>
              <div className="flex h-3 flex-1 max-w-[180px] overflow-hidden rounded-full border border-cyber-border">
                {LEVEL_ALPHA.map((alpha, i) => (
                  <div
                    key={i}
                    className="flex-1"
                    style={{
                      backgroundColor:
                        i === 0 ? "rgba(255,255,255,0.03)" : `rgba(34,211,238,${alpha})`,
                    }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
