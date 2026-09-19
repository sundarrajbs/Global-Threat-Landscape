"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line as RLine,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ThreatEvent } from "@/lib/types";
import { TYPE_META, TYPE_ORDER } from "@/lib/threat-meta";
import { PieChart as PieIcon, BarChart3, LineChart as LineIcon } from "lucide-react";

interface AnalyticsChartsProps {
  events: ThreatEvent[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "#0a0e17",
  border: "1px solid #1b2436",
  borderRadius: 8,
  fontSize: 12,
  color: "#e2e8f0",
};

export function AnalyticsCharts({ events }: AnalyticsChartsProps) {
  const typeData = useMemo(
    () =>
      TYPE_ORDER.map((type) => ({
        name: TYPE_META[type].label,
        value: events.filter((e) => e.type === type).length,
        color: TYPE_META[type].color,
      })).filter((d) => d.value > 0),
    [events]
  );

  const timelineData = useMemo(() => {
    const buckets = new Map<string, number>();
    const now = Date.now();
    for (let i = 23; i >= 0; i--) {
      const bucketTime = now - i * 60 * 60 * 1000;
      const label = new Date(bucketTime).toLocaleTimeString([], { hour: "2-digit" });
      buckets.set(label, 0);
    }
    for (const event of events) {
      const diffHours = Math.floor((now - new Date(event.timestamp).getTime()) / (60 * 60 * 1000));
      if (diffHours < 0 || diffHours > 23) continue;
      const bucketTime = now - diffHours * 60 * 60 * 1000;
      const label = new Date(bucketTime).toLocaleTimeString([], { hour: "2-digit" });
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    }
    return Array.from(buckets.entries()).map(([time, count]) => ({ time, count }));
  }, [events]);

  const regionData = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events) {
      map.set(event.target.country, (map.get(event.target.country) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [events]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>
            <PieIcon className="h-4 w-4 text-cyber-cyan" />
            Threat Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
                stroke="#05070d"
                strokeWidth={2}
              >
                {typeData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <LineIcon className="h-4 w-4 text-cyber-cyan" />
            Attack Frequency (24h)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1b2436" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#64748b" }}
                interval={3}
                axisLine={{ stroke: "#1b2436" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={{ stroke: "#1b2436" }}
                tickLine={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <RLine
                type="monotone"
                dataKey="count"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#22d3ee" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <BarChart3 className="h-4 w-4 text-cyber-cyan" />
            Top Target Regions
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1b2436" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#1b2436" }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="country"
                width={90}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={{ stroke: "#1b2436" }}
                tickLine={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(34,211,238,0.06)" }} />
              <Bar dataKey="count" fill="#fb3d4a" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
