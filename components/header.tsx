"use client";

import { motion } from "framer-motion";
import { Radar, Wifi, WifiOff, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SourceStatus } from "@/lib/types";

interface HeaderProps {
  sources?: SourceStatus[];
  isFetching: boolean;
  generatedAt?: string;
  onRefresh: () => void;
}

export function Header({ sources, isFetching, generatedAt, onRefresh }: HeaderProps) {
  const liveCount = sources?.filter((s) => s.ok).length ?? 0;
  const totalSources = sources?.length ?? 4;

  return (
    <header className="sticky top-0 z-40 border-b border-cyber-border bg-cyber-bg/85 backdrop-blur-md">
      <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-cyber-cyan/40 bg-cyber-cyan/10">
            <Radar className="h-5 w-5 text-cyber-cyan" />
            <motion.span
              className="absolute inset-0 rounded-lg border border-cyber-cyan/60"
              animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.25, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-slate-100 sm:text-base">
              GLOBAL THREAT LANDSCAPE
            </h1>
            <p className="text-[11px] text-slate-500">
              Cyber Threat Intelligence &amp; SOC Situational Awareness
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="hidden items-center gap-1.5 rounded-full border border-cyber-border bg-white/[0.02] px-3 py-1 text-[11px] text-slate-400 sm:flex"
            title={sources?.map((s) => `${s.name}: ${s.ok ? "live" : "fallback"}`).join(" · ")}
          >
            {liveCount > 0 ? (
              <Wifi className="h-3.5 w-3.5 text-cyber-green" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-cyber-amber" />
            )}
            <span>
              {liveCount}/{totalSources} feeds live
            </span>
          </div>

          <Badge variant={liveCount > 0 ? "low" : "medium"} className="hidden sm:inline-flex">
            <span className={cn("h-1.5 w-1.5 rounded-full bg-current animate-blink-dot")} />
            {liveCount > 0 ? "Monitoring" : "Simulated"}
          </Badge>

          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
            <RefreshCcw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
      {generatedAt && (
        <div className="border-t border-cyber-border/60 bg-black/20 py-1 text-center text-[10px] uppercase tracking-widest text-slate-600">
          Last sync {new Date(generatedAt).toLocaleTimeString()}
        </div>
      )}
    </header>
  );
}
