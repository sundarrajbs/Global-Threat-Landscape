"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DeckGL from "@deck.gl/react";
import { _GlobeView as GlobeView, type Color, type PickingInfo } from "@deck.gl/core";
import { ArcLayer, BitmapLayer, ScatterplotLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { Globe2 } from "lucide-react";
import type { ThreatEvent, ThreatSeverity } from "@/lib/types";

const DARK_BASEMAP_TILES = "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";

// Mirrors GlobalMap's MAX_ARCS — same render cap keeps the two views visually
// consistent and keeps the WebGL layer count sane on a live, refetching feed.
const MAX_ARCS = 45;
const PULSE_INTERVAL_MS = 1100;

interface ThreatGlobeProps {
  events: ThreatEvent[];
  onSelect?: (event: ThreatEvent) => void;
  selectedId?: string;
}

// Critical: #FF0055 · High/Medium: #FFAA00 (per spec) · Low: cyan, to keep the
// severity legend legible without collapsing the whole scale into two colors.
const SEVERITY_COLOR: Record<ThreatSeverity, Color> = {
  critical: [255, 0, 85],
  high: [255, 170, 0],
  medium: [255, 170, 0],
  low: [34, 211, 238],
};

const INITIAL_VIEW_STATE = {
  longitude: 10,
  latitude: 20,
  zoom: 0.6,
  minZoom: 0,
  maxZoom: 4,
};

export function ThreatGlobe({ events, onSelect, selectedId }: ThreatGlobeProps) {
  const [pulseTick, setPulseTick] = useState(0);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const lastInteractionRef = useRef(0);
  const isHoveredRef = useRef(false);

  const visible = useMemo(() => events.slice(0, MAX_ARCS), [events]);

  // Drives the pulsing "impact ring" animation on target markers.
  useEffect(() => {
    const id = setInterval(() => setPulseTick((t) => t + 1), PULSE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Gentle auto-rotation that yields to the user the moment they drag/zoom,
  // and pauses on hover so a target holds still long enough to click.
  useEffect(() => {
    let frame: number;
    const tick = () => {
      const idleFor = Date.now() - lastInteractionRef.current;
      if (idleFor > 2500 && !isHoveredRef.current) {
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

  const handleClick = useCallback(
    (info: PickingInfo<ThreatEvent>) => {
      if (info.object) onSelect?.(info.object);
    },
    [onSelect]
  );

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

    const attackArcs = new ArcLayer<ThreatEvent>({
      id: "attack-arcs",
      data: visible,
      greatCircle: true,
      getSourcePosition: (d) => [d.origin.lon, d.origin.lat],
      getTargetPosition: (d) => [d.target.lon, d.target.lat],
      getSourceColor: (d) => SEVERITY_COLOR[d.severity],
      getTargetColor: (d) => {
        const [r, g, b] = SEVERITY_COLOR[d.severity];
        return [r, g, b, 60] as Color;
      },
      getWidth: (d) => {
        const base = d.severity === "critical" ? 3 : 1.5;
        return d.id === selectedId ? base + 2 : base;
      },
      getHeight: 0.4,
      pickable: true,
      onClick: handleClick,
    });

    const originPoints = new ScatterplotLayer<ThreatEvent>({
      id: "origin-points",
      data: visible,
      getPosition: (d) => [d.origin.lon, d.origin.lat],
      getRadius: (d) => (d.id === selectedId ? 7 : 5),
      radiusUnits: "pixels",
      getFillColor: (d) => SEVERITY_COLOR[d.severity],
      pickable: true,
      onClick: handleClick,
    });

    // Two-layer "glowing ring" impact marker at each target: a pulsing
    // translucent halo (animated via getRadius transitions) plus a static core.
    const impactPulse = new ScatterplotLayer<ThreatEvent>({
      id: "impact-pulse",
      data: visible,
      getPosition: (d) => [d.target.lon, d.target.lat],
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

    const impactCore = new ScatterplotLayer<ThreatEvent>({
      id: "impact-core",
      data: visible,
      getPosition: (d) => [d.target.lon, d.target.lat],
      getRadius: (d) => (d.id === selectedId ? 6 : 4),
      radiusUnits: "pixels",
      getFillColor: (d) => {
        const [r, g, b] = SEVERITY_COLOR[d.severity];
        return [r, g, b, 220] as Color;
      },
      pickable: true,
      onClick: handleClick,
    });

    return [basemap, attackArcs, impactPulse, impactCore, originPoints];
  }, [visible, pulseTick, selectedId, handleClick]);

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-xl border border-cyber-border bg-[#040610]"
      onMouseEnter={() => (isHoveredRef.current = true)}
      onMouseLeave={() => (isHoveredRef.current = false)}
    >
      <DeckGL
        views={new GlobeView()}
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller
        // Markers are only a few px wide on screen; a forgiving hit-test
        // radius makes them realistically clickable/tappable, not just
        // pixel-perfect.
        pickingRadius={8}
        layers={layers}
        getTooltip={({ object }: PickingInfo<ThreatEvent>) =>
          object
            ? {
                html: `<div style="font-family: ui-monospace, monospace; font-size: 11px;">
                  <strong>${object.title}</strong><br/>
                  ${object.origin.country} &rarr; ${object.target.country}
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
        3D Threat Globe · {visible.length} active vectors
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
