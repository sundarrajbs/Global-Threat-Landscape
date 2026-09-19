"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FEED_CATALOG } from "@/lib/feeds";
import { cn, truncateMiddle } from "@/lib/utils";
import type { SourceStatus } from "@/lib/types";
import { Database, ExternalLink, KeyRound, Loader2, Radio, ShieldCheck } from "lucide-react";

interface FeedSourcesProps {
  sources?: SourceStatus[];
  isLoading: boolean;
}

const AUTH_LABEL: Record<"required" | "optional" | "none", string> = {
  required: "API key required",
  optional: "API key optional",
  none: "No key needed",
};

export function FeedSources({ sources, isLoading }: FeedSourcesProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>
          <Database className="h-4 w-4 text-cyber-cyan" />
          Threat Feed Sources
        </CardTitle>
        <span className="text-[11px] text-slate-500">
          {FEED_CATALOG.length} feeds configured
        </span>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {FEED_CATALOG.map((feed) => {
          const status = sources?.find((s) => s.name === feed.name);
          const live = status?.ok ?? false;
          const showLoading = isLoading && !status;

          return (
            <div
              key={feed.name}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
                live
                  ? "border-cyber-green/30 bg-cyber-green/5"
                  : "border-cyber-border bg-black/20"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                  <Radio className="h-3.5 w-3.5 text-cyber-cyan" />
                  {feed.label}
                </div>
                {showLoading ? (
                  <Badge variant="outline">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking
                  </Badge>
                ) : live ? (
                  <Badge variant="low">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-blink-dot" />
                    Live
                  </Badge>
                ) : (
                  <Badge variant="medium">Simulated</Badge>
                )}
              </div>

              <p className="text-[11px] leading-snug text-slate-500">{feed.description}</p>

              <div className="mt-auto flex flex-col gap-1 border-t border-cyber-border/60 pt-2 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Provides
                  </span>
                  <span className="text-right text-slate-300">{feed.provides}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Events contributed</span>
                  <span className="font-mono text-slate-200">{status?.count ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1">
                    <KeyRound className="h-3 w-3" />
                    Auth
                  </span>
                  <span className="text-slate-300">{AUTH_LABEL[feed.authRequired]}</span>
                </div>
                {!live && status?.error && (
                  <div
                    className="truncate text-cyber-amber/80"
                    title={status.error}
                  >
                    {truncateMiddle(status.error, 40)}
                  </div>
                )}
                <a
                  href={feed.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-cyber-cyan/80 hover:text-cyber-cyan"
                >
                  <ExternalLink className="h-3 w-3" />
                  Source docs
                </a>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
