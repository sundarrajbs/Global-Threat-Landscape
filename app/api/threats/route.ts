import { NextRequest, NextResponse } from "next/server";
import { fetchAllSources } from "@/lib/api-clients";
import { rateLimit } from "@/lib/rate-limit";
import type {
  ThreatEvent,
  ThreatFeedResponse,
  ThreatSeverity,
  ThreatType,
  SourceStatus,
} from "@/lib/types";

// Revalidate the underlying upstream fetches every 60 seconds and let the
// platform edge/CDN cache this route for the same window, keeping us well
// within the free-tier rate limits of every upstream feed.
export const revalidate = 60;

const SEVERITY_KEYS: ThreatSeverity[] = ["critical", "high", "medium", "low"];
const TYPE_KEYS: ThreatType[] = [
  "ransomware",
  "phishing",
  "botnet",
  "malware",
  "cve",
  "ddos",
  "c2",
];

function buildStats(events: ThreatEvent[]): ThreatFeedResponse["stats"] {
  const bySeverity = Object.fromEntries(
    SEVERITY_KEYS.map((s) => [s, 0])
  ) as Record<ThreatSeverity, number>;
  const byType = Object.fromEntries(TYPE_KEYS.map((t) => [t, 0])) as Record<
    ThreatType,
    number
  >;
  const countryCounts = new Map<string, { country: string; countryCode: string; count: number }>();

  for (const event of events) {
    bySeverity[event.severity] += 1;
    byType[event.type] += 1;

    const key = event.origin.countryCode;
    const existing = countryCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      countryCounts.set(key, {
        country: event.origin.country,
        countryCode: event.origin.countryCode,
        count: 1,
      });
    }
  }

  const topCountries = Array.from(countryCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const now = Date.now();
  const lastFiveMin = events.filter(
    (e) => now - new Date(e.timestamp).getTime() < 5 * 60_000
  ).length;

  return {
    total: events.length,
    bySeverity,
    byType,
    topCountries,
    attacksPerMinute: Math.max(1, Math.round(lastFiveMin / 5) || Math.round(events.length / 20)),
    activeThreats: events.length,
    highRiskCves: events.filter((e) => e.type === "cve" && (e.severity === "critical" || e.severity === "high"))
      .length,
  };
}

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  const limit = rateLimit(`threats:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.resetMs / 1000)),
          "X-RateLimit-Limit": String(limit.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const sources = await fetchAllSources();
    const events = sources
      .flatMap((s) => s.events)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const sourceStatus: SourceStatus[] = sources.map((s) => ({
      name: s.name,
      ok: s.ok,
      count: s.events.length,
      usedFallback: s.usedFallback,
      error: s.error,
    }));

    const payload: ThreatFeedResponse = {
      events,
      stats: buildStats(events),
      sources: sourceStatus,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        "X-RateLimit-Remaining": String(limit.remaining),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to aggregate threat feeds",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
