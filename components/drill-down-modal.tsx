"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { TYPE_META, SEVERITY_META } from "@/lib/threat-meta";
import type { ThreatEvent } from "@/lib/types";
import {
  MapPin,
  Fingerprint,
  Crosshair,
  Gauge,
  Code2,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";

interface DrillDownModalProps {
  event: ThreatEvent | null;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[65%] truncate text-right font-mono text-slate-200">{value}</span>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPin;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyber-cyan">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

export function DrillDownModal({ event, onOpenChange }: DrillDownModalProps) {
  const [rawOpen, setRawOpen] = useState(false);

  return (
    <Dialog open={!!event} onOpenChange={onOpenChange}>
      <DialogContent>
        {event && (
          <>
            <DialogHeader>
              <div className="mb-1 flex items-center gap-2">
                <Badge variant={SEVERITY_META[event.severity].badge}>
                  {SEVERITY_META[event.severity].label}
                </Badge>
                <Badge variant="outline">{TYPE_META[event.type].label}</Badge>
                <Badge variant="violet">{event.source}</Badge>
              </div>
              <DialogTitle>{event.title}</DialogTitle>
              <DialogDescription>{event.description}</DialogDescription>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                <Clock className="h-3 w-3" />
                {new Date(event.timestamp).toLocaleString()}
              </div>
            </DialogHeader>

            <Section icon={MapPin} title="Origin & Target Geolocation">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-cyber-border bg-black/20 p-3">
                  <div className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">
                    Origin
                  </div>
                  <DetailRow label="Country" value={event.origin.country} />
                  <DetailRow label="Code" value={event.origin.countryCode} />
                  <DetailRow label="ASN" value={event.origin.asn} />
                  <DetailRow label="ISP" value={event.origin.isp} />
                  <DetailRow
                    label="Coordinates"
                    value={`${event.origin.lat.toFixed(2)}, ${event.origin.lon.toFixed(2)}`}
                  />
                </div>
                <div className="rounded-lg border border-cyber-border bg-black/20 p-3">
                  <div className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">
                    Target
                  </div>
                  <DetailRow label="Country" value={event.target.country} />
                  <DetailRow label="Code" value={event.target.countryCode} />
                  <DetailRow
                    label="Coordinates"
                    value={`${event.target.lat.toFixed(2)}, ${event.target.lon.toFixed(2)}`}
                  />
                </div>
              </div>
            </Section>

            <Separator />

            <Section icon={Fingerprint} title="Indicator of Compromise">
              <div className="rounded-lg border border-cyber-border bg-black/20 p-3">
                <DetailRow label="IP Address" value={event.ioc.ip} />
                <DetailRow label="Domain" value={event.ioc.domain} />
                <DetailRow label="URL" value={event.ioc.url} />
                <DetailRow label="File Hash" value={event.ioc.hash} />
                <DetailRow label="CVE Reference" value={event.ioc.cve} />
              </div>
            </Section>

            <Separator />

            <Section icon={Crosshair} title="MITRE ATT&CK Tactics">
              <div className="flex flex-wrap gap-1.5">
                {event.mitreTactics.map((tactic) => (
                  <Badge key={tactic} variant="default">
                    {tactic}
                  </Badge>
                ))}
                {event.mitreTactics.length === 0 && (
                  <span className="text-xs text-slate-500">No tactics mapped.</span>
                )}
              </div>
            </Section>

            <Separator />

            <Section icon={Gauge} title="Confidence Score">
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyber-cyan to-cyber-green"
                    style={{ width: `${event.confidence}%` }}
                  />
                </div>
                <span className="font-mono text-sm text-slate-200">{event.confidence}%</span>
              </div>
            </Section>

            <Separator />

            <div className="p-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRawOpen((o) => !o)}
                className="w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5" />
                  Raw JSON Payload
                </span>
                {rawOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
              {rawOpen && (
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-cyber-border bg-black/40 p-3 text-[11px] leading-relaxed text-cyber-green scrollbar-thin">
                  {JSON.stringify(event, null, 2)}
                </pre>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
