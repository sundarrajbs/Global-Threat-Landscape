"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DeckGL from "@deck.gl/react";
import { _GlobeView as GlobeView, type Color } from "@deck.gl/core";
import { ArcLayer, BitmapLayer, ScatterplotLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { Globe2 } from "lucide-react";
import { generateMockEvent } from "@/lib/mockData";
import type { ThreatSeverity } from "@/lib/types";

const DARK_BASEMAP_TILES = "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";

// Requirement #3: cap the live telemetry buffer so the arc/point layers
// never grow unbounded while the globe is left running.
const MAX_BUFFERED_EVENTS = 100;
const TELEMETRY_INTERVAL_MS = 800;
const PULSE_INTERVAL_MS = 1100;

interface GlobeArc {
  id: string;
  from: [number, number];
  to: [number, number];
  severity: ThreatSeverity;
  title: string;
  originCountry: string;
  targetCountry: string;
}

// Critical: #FF0055 · High/Medium: #FFAA00 (per spec) · Low: cyan, to keep the
// severity legend legible without collapsing the whole scale into two colors.
const SEVERITY_COLOR: Record<ThreatSeverity, Color> = {
  critical: [255, 0, 85],
  high: [255, 170, 0],
  medium: [255, 170, 0],
  low: [34, 211, 238],
};

function toGlobeArc(event: ReturnType<typeof generateMockEvent>): GlobeArc {
  return {
    id: event.id,
    from: [event.origin.lon, event.origin.lat],
    to: [event.target.lon, event.target.lat],
    severity: event.severity,
    title: event.title,
    originCountry: event.origin.country,
    targetCountry: event.target.country,
  };
}

const INITIAL_VIEW_STATE = {
  longitude: 10,
  latitude: 20,
  zoom: 0.6,
  minZoom: 0,
  maxZoom: 4,
};

export function ThreatGlobe() {
  const [arcs, setArcs] = useState<GlobeArc[]>(() =>
    Array.from({ length: 24 }, () => toGlobeArc(generateMockEvent()))
  );
  const [pulseTick, setPulseTick] = useState(0);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const lastInteractionRef = useRef(0);

  // Mock real-time telemetry generator — pushes a new attack event onto the
  // buffer every 800ms and trims it back down to MAX_BUFFERED_EVENTS.
  useEffect(() => {
    const id = setInterval(() => {
      setArcs((prev) => {
        const next = [toGlobeArc(generateMockEvent()), ...prev];
        return next.length > MAX_BUFFERED_EVENTS
          ? next.slice(0, MAX_BUFFERED_EVENTS)
          : next;
      });
    }, TELEMETRY_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Drives the pulsing "impact ring" animation on target markers.
  useEffect(() => {
    const id = setInterval(() => setPulseTick((t) => t + 1), PULSE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Gentle auto-rotation that yields to the user the moment they drag/zoom.
  useEffect(() => {
    let frame: number;
    const tick = () => {
      const idleFor = Date.now() - lastInteractionRef.current;
      if (idleFor > 2500) {
        setViewState((vs) => ({ ...vs, longitude: vs.longitude + 0.05 }));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleViewStateChange = useCallback(({ viewState: next }: any) => {
    lastInteractionRef.current = Date.now();
    setViewState(next);
  }, []);

  const layers = useMemo(() => {
    const basemap = new TileLayer({
      id: "basemap",
      data: DARK_BASEMAP_TILES,
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      renderSubLayers: (props) => {
        const { boundingBox } = props.tile;
        return new BitmapLayer(props, {
          data: undefined,
          image: props.data as any,
          bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]],
        });
      },
    });

    const attackArcs = new ArcLayer<GlobeArc>({
      id: "attack-arcs",
      data: arcs,
      greatCircle: true,
      getSourcePosition: (d) => d.from,
      getTargetPosition: (d) => d.to,
      getSourceColor: (d) => SEVERITY_COLOR[d.severity],
      getTargetColor: (d) => {
        const [r, g, b] = SEVERITY_COLOR[d.severity];
        return [r, g, b, 60] as Color;
      },
      getWidth: (d) => (d.severity === "critical" ? 3 : 1.5),
      getHeight: 0.4,
      pickable: true,
    });

    const originPoints = new ScatterplotLayer<GlobeArc>({
      id: "origin-points",
      data: arcs,
      getPosition: (d) => d.from,
      getRadius: 5,
      radiusUnits: "pixels",
      getFillColor: (d) => SEVERITY_COLOR[d.severity],
      pickable: true,
    });

    // Two-layer "glowing ring" impact marker at each target: a pulsing
    // translucent halo (animated via getRadius transitions) plus a static core.
    const impactPulse = new ScatterplotLayer<GlobeArc>({
      id: "impact-pulse",
      data: arcs,
      getPosition: (d) => d.to,
      getRadius: pulseTick % 2 === 0 ? 26 : 4,
      radiusUnits: "pixels",
      stroked: true,
      filled: false,
      getLineColor: (d) => SEVERITY_COLOR[d.severity],
      getLineWidth: 2,
      lineWidthUnits: "pixels",
      transitions: {
        getRadius: { duration: PULSE_INTERVAL_MS, easing: (t: number) => 1 - (1 - t) ** 2 },
      },
    });

    const impactCore = new ScatterplotLayer<GlobeArc>({
      id: "impact-core",
      data: arcs,
      getPosition: (d) => d.to,
      getRadius: 4,
      radiusUnits: "pixels",
      getFillColor: (d) => {
        const [r, g, b] = SEVERITY_COLOR[d.severity];
        return [r, g, b, 220] as Color;
      },
      pickable: true,
    });

    return [basemap, attackArcs, impactPulse, impactCore, originPoints];
  }, [arcs, pulseTick]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-cyber-border bg-[#040610]">
      <DeckGL
        views={new GlobeView()}
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller
        layers={layers}
        getTooltip={({ object }: any) =>
          object && "title" in object
            ? {
                html: `<div style="font-family: ui-monospace, monospace; font-size: 11px;">
                  <strong>${object.title}</strong><br/>
                  ${object.originCountry} &rarr; ${object.targetCountry}
                </div>`,
                style: {
                  backgroundColor: "#0a0e17",
                  border: "1px solid #1b2436",
                  borderRadius: "8px",
                  padding: "8px",
                },
              }
            : null
        }
      />

      <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full border border-cyber-border bg-black/40 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-400">
        <Globe2 className="h-3 w-3 text-cyber-cyan" />
        <span className="h-1.5 w-1.5 rounded-full bg-cyber-cyan animate-blink-dot" />
        3D Threat Globe · {arcs.length} active vectors
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-3 rounded-lg border border-cyber-border bg-black/40 px-3 py-2 text-[10px] uppercase tracking-widest text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#FF0055" }} />
          Critical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#FFAA00" }} />
          High / Medium
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#22D3EE" }} />
          Low
        </span>
      </div>
    </div>
  );
}
