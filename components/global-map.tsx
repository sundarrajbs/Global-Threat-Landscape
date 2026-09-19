"use client";

import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  Sphere,
  Graticule,
} from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
// world-atlas ships pre-simplified TopoJSON for country borders (110m resolution).
import geoData from "world-atlas/countries-110m.json";
import type { ThreatEvent } from "@/lib/types";
import { TYPE_META, SEVERITY_META } from "@/lib/threat-meta";
import { cn } from "@/lib/utils";

interface GlobalMapProps {
  events: ThreatEvent[];
  onSelect: (event: ThreatEvent) => void;
  selectedId?: string;
}

const MAX_ARCS = 45;

export function GlobalMap({ events, onSelect, selectedId }: GlobalMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const visible = useMemo(() => events.slice(0, MAX_ARCS), [events]);

  const hotspots = useMemo(() => {
    const map = new Map<string, { lat: number; lon: number; count: number; country: string }>();
    for (const event of events) {
      const key = event.origin.countryCode;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          lat: event.origin.lat,
          lon: event.origin.lon,
          count: 1,
          country: event.origin.country,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [events]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-cyber-border bg-[#040610]">
      <div className="cyber-scanline pointer-events-none absolute inset-0 z-10" />
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 165, center: [10, 15] }}
        className="h-full w-full"
      >
        <Sphere id="sphere" fill="transparent" stroke="#132038" strokeWidth={0.5} />
        <Graticule stroke="#0f1a2e" strokeWidth={0.4} />
        <Geographies geography={geoData}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#0b1122"
                stroke="#1b2436"
                strokeWidth={0.6}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "#111a30" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {visible.map((event) => {
          const color = TYPE_META[event.type].color;
          const isActive = hoveredId === event.id || selectedId === event.id;
          return (
            <Line
              key={`arc-${event.id}`}
              from={[event.origin.lon, event.origin.lat]}
              to={[event.target.lon, event.target.lat]}
              stroke={color}
              strokeWidth={isActive ? 1.6 : 0.6}
              strokeLinecap="round"
              strokeOpacity={isActive ? 0.9 : 0.28}
              className="transition-all duration-200"
            />
          );
        })}

        {hotspots.map((h) => (
          <Marker key={`hot-${h.country}`} coordinates={[h.lon, h.lat]}>
            <motion.circle
              r={4 + Math.min(10, h.count)}
              fill="#fb3d4a"
              fillOpacity={0.15}
              stroke="#fb3d4a"
              strokeOpacity={0.4}
              animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </Marker>
        ))}

        {visible.map((event) => {
          const color = TYPE_META[event.type].color;
          const isActive = hoveredId === event.id || selectedId === event.id;
          return (
            <Marker
              key={`origin-${event.id}`}
              coordinates={[event.origin.lon, event.origin.lat]}
            >
              <circle
                r={isActive ? 4.5 : 2.4}
                fill={color}
                stroke="#05070d"
                strokeWidth={0.8}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredId(event.id)}
                onMouseLeave={() => setHoveredId((id) => (id === event.id ? null : id))}
                onClick={() => onSelect(event)}
              />
            </Marker>
          );
        })}

        {visible.map((event) => (
          <Marker
            key={`target-${event.id}`}
            coordinates={[event.target.lon, event.target.lat]}
          >
            <circle
              r={1.6}
              fill="none"
              stroke={SEVERITY_META[event.severity].color}
              strokeWidth={0.8}
              strokeOpacity={hoveredId === event.id || selectedId === event.id ? 0.9 : 0.35}
            />
          </Marker>
        ))}
      </ComposableMap>

      <AnimatePresence>
        {hoveredId &&
          (() => {
            const event = visible.find((e) => e.id === hoveredId);
            if (!event) return null;
            return (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-xs rounded-lg border border-cyber-border bg-cyber-panel/95 p-3 text-xs shadow-xl backdrop-blur"
              >
                <div className="font-semibold text-slate-100">{event.title}</div>
                <div className="mt-1 text-slate-400">
                  {event.origin.country} → {event.target.country}
                </div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full border border-cyber-border bg-black/40 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-400">
        <span className={cn("h-1.5 w-1.5 rounded-full bg-cyber-cyan animate-blink-dot")} />
        Live threat flow · {visible.length} shown
      </div>
    </div>
  );
}
