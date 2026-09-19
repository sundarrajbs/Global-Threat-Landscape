"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TYPE_META, SEVERITY_META } from "@/lib/threat-meta";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ThreatEvent } from "@/lib/types";
import { Terminal, Pause, Play } from "lucide-react";

interface FeedLogProps {
  events: ThreatEvent[];
  onSelect: (event: ThreatEvent) => void;
}

export function FeedLog({ events, onSelect }: FeedLogProps) {
  const [paused, setPaused] = useState(false);
  const recent = events.slice(0, 40);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>
          <Terminal className="h-4 w-4 text-cyber-green" />
          Live Feed Log
        </CardTitle>
        <button
          onClick={() => setPaused((p) => !p)}
          className="flex items-center gap-1 rounded-md border border-cyber-border px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400 hover:border-cyber-cyan/50 hover:text-cyber-cyan"
        >
          {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          {paused ? "Resume" : "Pause"}
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className={cn(
            "h-[420px] overflow-y-auto scrollbar-thin px-3 pb-3 font-mono text-[11px] leading-relaxed",
            paused ? "" : ""
          )}
        >
          <AnimatePresence initial={false}>
            {recent.map((event) => {
              const meta = TYPE_META[event.type];
              const sev = SEVERITY_META[event.severity];
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => onSelect(event)}
                  className="group flex cursor-pointer items-start gap-2 border-b border-cyber-border/40 py-1.5 hover:bg-white/[0.02]"
                >
                  <span className="mt-0.5 shrink-0 text-slate-600">
                    [{formatRelativeTime(event.timestamp)}]
                  </span>
                  <span
                    className="shrink-0 font-semibold uppercase"
                    style={{ color: sev.color }}
                  >
                    {event.severity}
                  </span>
                  <span className="shrink-0" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="truncate text-slate-400 group-hover:text-slate-200">
                    {event.origin.countryCode} → {event.target.countryCode} · {event.title}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {recent.length === 0 && (
            <div className="py-10 text-center text-slate-600">Awaiting telemetry…</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
