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
import { FeedSources } from "@/components/feed-sources";
import { MitreHeatmap } from "@/components/mitre-heatmap";
import { useThreats } from "@/hooks/use-threats";
import { filterThreats } from "@/lib/filter-threats";
import type { ThreatEvent, ThreatFilters } from "@/lib/types";
import { AlertOctagon, Globe2, Map as MapIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

// 3D globe uses a WebGL canvas (deck.gl) — must stay out of the server bundle
// and skip SSR entirely to avoid hydration mismatches.
const ThreatGlobe = dynamic(
  () => import("@/components/ThreatGlobe").then((mod) => mod.ThreatGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-cyber-border bg-[#040610] text-sm text-slate-600">
        Initializing 3D threat globe…
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

        <FeedSources sources={data?.sources} isLoading={isLoading} />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <Tabs defaultValue="globe" className="flex h-[480px] flex-col gap-2">
            <TabsList>
              <TabsTrigger value="globe">
                <Globe2 className="mr-1.5 h-3.5 w-3.5" />
                3D Globe
              </TabsTrigger>
              <TabsTrigger value="map">
                <MapIcon className="mr-1.5 h-3.5 w-3.5" />
                2D Map
              </TabsTrigger>
            </TabsList>
            <TabsContent value="globe" className="min-h-0 flex-1">
              <ThreatGlobe />
            </TabsContent>
            <TabsContent value="map" className="min-h-0 flex-1">
              <GlobalMap
                events={filteredEvents}
                onSelect={setSelectedEvent}
                selectedId={selectedEvent?.id}
              />
            </TabsContent>
          </Tabs>
          <FeedLog events={filteredEvents} onSelect={setSelectedEvent} />
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          countries={data?.stats.topCountries ?? []}
          resultCount={filteredEvents.length}
        />

        <AnalyticsCharts events={filteredEvents} />

        <MitreHeatmap events={filteredEvents} />

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
