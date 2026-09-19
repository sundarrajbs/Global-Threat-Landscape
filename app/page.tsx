"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { MetricsBar } from "@/components/metrics-bar";
import { FilterBar } from "@/components/filter-bar";
import { AnalyticsCharts } from "@/components/analytics-charts";
import { ThreatTable } from "@/components/threat-table";
import { FeedLog } from "@/components/feed-log";
import { DrillDownModal } from "@/components/drill-down-modal";
import { useThreats } from "@/hooks/use-threats";
import { filterThreats } from "@/lib/filter-threats";
import type { ThreatEvent, ThreatFilters } from "@/lib/types";
import { AlertOctagon, Globe2 } from "lucide-react";

const GlobalMap = dynamic(
  () => import("@/components/global-map").then((mod) => mod.GlobalMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-cyber-border bg-[#040610] text-sm text-slate-600">
        Rendering global threat map…
      </div>
    ),
  }
);

export default function Home() {
  const { data, isLoading, isFetching, refetch } = useThreats();
  const [filters, setFilters] = useState<ThreatFilters>({});
  const [selectedEvent, setSelectedEvent] = useState<ThreatEvent | null>(null);

  const events = data?.events ?? [];
  const filteredEvents = useMemo(() => filterThreats(events, filters), [events, filters]);

  return (
    <div className="min-h-screen pb-16">
      <Header
        sources={data?.sources}
        isFetching={isFetching}
        generatedAt={data?.generatedAt}
        onRefresh={() => refetch()}
      />

      <main className="container mt-4 flex flex-col gap-4">
        <MetricsBar stats={data?.stats} isLoading={isLoading} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="h-[480px]">
            <GlobalMap
              events={filteredEvents}
              onSelect={setSelectedEvent}
              selectedId={selectedEvent?.id}
            />
          </div>
          <FeedLog events={filteredEvents} onSelect={setSelectedEvent} />
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          countries={data?.stats.topCountries ?? []}
          resultCount={filteredEvents.length}
        />

        <AnalyticsCharts events={filteredEvents} />

        <ThreatTable
          events={filteredEvents}
          onSelect={setSelectedEvent}
          selectedId={selectedEvent?.id}
        />

        {!isLoading && events.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-cyber-border py-12 text-slate-500">
            <AlertOctagon className="h-6 w-6" />
            No threat intelligence available right now.
          </div>
        )}

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-cyber-border pt-4 text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <Globe2 className="h-3.5 w-3.5" />
            Sources: AbuseIPDB · URLhaus (abuse.ch) · ThreatFox (abuse.ch) · CISA KEV Catalog
          </span>
          <span>Data refreshes every 30–60s · Synthetic data is used as a fallback when live feeds are rate-limited.</span>
        </footer>
      </main>

      <DrillDownModal
        event={selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </div>
  );
}
