# Global Threat Landscape

A real-time **Global Cyber Threat Intelligence Dashboard** — live malicious IPs, malware distribution URLs, botnet C2 infrastructure, and actively exploited CVEs, visualized on an interactive world map with a dark SOC/cyberpunk aesthetic.

![stack](https://img.shields.io/badge/Next.js-15-black) ![stack](https://img.shields.io/badge/React-19-61DAFB) ![stack](https://img.shields.io/badge/TypeScript-5-3178C6) ![stack](https://img.shields.io/badge/Tailwind-CSS-38BDF8)

## Features

- **Interactive world map** with animated attack flow arcs, pulsing hotspot rings, and origin/target markers (`react-simple-maps`).
- **Live metric ticker**: active threats, attacks/min, high-risk CVEs, top attacking country, critical alerts.
- **Filtering engine**: free-text search over IOCs/countries, threat-type toggles, severity toggles, region select.
- **Analytics charts**: threat distribution donut, 24h attack frequency line chart, top target regions bar chart (Recharts).
- **Drill-down slide-over**: click any map node, feed entry, or table row to open a detail panel with geolocation, IOC data, MITRE ATT&CK tactics, confidence score, and a raw JSON payload expander.
- **Live feed log**: streaming ticker with auto-scroll and pause-on-hover.
- **Aggregator API route** (`app/api/threats`) that fans out to 4 open-source threat intel feeds in parallel, normalizes them into a common schema, and caches the result for 60s.
- **Graceful fallback**: any feed that is unreachable, rate-limited, or missing an API key is silently replaced with realistic synthetic data from `lib/mockData.ts`, so the dashboard is always fully populated.
- **Rate limiting**: a lightweight in-memory limiter protects the API route itself (30 req/min per IP).

## Threat Intelligence Sources

| Source | Data | Auth required |
| --- | --- | --- |
| [AbuseIPDB](https://www.abuseipdb.com/) | Reported malicious IPs (blacklist) | Yes — free API key |
| [URLhaus](https://urlhaus.abuse.ch/) (abuse.ch) | Recent malware distribution URLs | Optional (higher limits with key) |
| [ThreatFox](https://threatfox.abuse.ch/) (abuse.ch) | Botnet C2 / IOC feed | Optional (higher limits with key) |
| [CISA KEV Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | Actively exploited CVEs | No — fully public |

If a key is missing or a feed call fails/rate-limits, that source's slice of the dashboard is transparently backfilled with mock data (flagged as `source: "Mock"` in the raw payload) — the UI never breaks and always shows a "0/4 feeds live · Simulated" style indicator so you know what you're looking at.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables (all optional)

Create a `.env.local` file to enable live data instead of the mock fallback:

```bash
ABUSEIPDB_API_KEY=your_abuseipdb_key      # https://www.abuseipdb.com/account/api
URLHAUS_API_KEY=your_urlhaus_auth_key     # https://urlhaus.abuse.ch/api/
THREATFOX_API_KEY=your_threatfox_auth_key # https://threatfox.abuse.ch/api/
```

CISA KEV requires no key and works out of the box.

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript, React 19)
- **Styling**: Tailwind CSS + shadcn-style primitives (Radix UI) + Lucide icons + Framer Motion
- **Maps**: `react-simple-maps` (SVG/D3-geo, `world-atlas` topojson) with animated arcs & pulsing markers
- **Charts**: Recharts (donut, line, bar)
- **Data fetching**: TanStack Query (React Query) with a 30s client refetch interval
- **API**: Next.js Route Handlers, 60s server-side revalidation, in-memory rate limiting

## Project Structure

```
app/
  api/threats/route.ts   # aggregator proxy: fetches all sources, normalizes, caches, rate-limits
  layout.tsx              # root layout, fonts, dark theme
  page.tsx                # dashboard composition
  globals.css              # cyberpunk/SOC theme tokens
components/
  header.tsx, metrics-bar.tsx, global-map.tsx, filter-bar.tsx,
  analytics-charts.tsx, threat-table.tsx, feed-log.tsx, drill-down-modal.tsx
  ui/                      # shadcn-style primitives (button, card, dialog, select, ...)
lib/
  types.ts                 # shared ThreatEvent schema
  api-clients.ts           # per-source fetchers + normalization + fallback orchestration
  mockData.ts               # synthetic threat event generator
  geo.ts                    # country centroid lookup table
  rate-limit.ts             # in-memory sliding-window limiter
  filter-threats.ts         # client-side filter helper
hooks/
  use-threats.ts            # React Query hook for /api/threats
```

## Deployment

### Vercel (recommended)

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the optional environment variables above under **Project Settings → Environment Variables**.
4. Deploy — no additional configuration needed (`next build` / `next start` are auto-detected).

Or via CLI:

```bash
npm i -g vercel
vercel
```

### Netlify

1. Install the [Next.js Runtime](https://docs.netlify.com/frameworks/next-js/overview/) (auto-detected on import).
2. Import the repo at [app.netlify.com/start](https://app.netlify.com/start).
3. Build command: `npm run build` · Publish directory: handled automatically by the Next.js runtime.
4. Add the optional environment variables in **Site configuration → Environment variables**.

## Notes

- This project surfaces real vendor/CVE/IP data from public feeds for security-awareness and SOC-dashboard demonstration purposes. Origin/target geolocation for feeds that don't publish geo data (URLhaus, ThreatFox, CISA KEV) is illustrative, not measured.
- `npm install` currently requires `--legacy-peer-deps` because `react-simple-maps@3` has not yet published an updated peer-dependency range for React 19; this is purely a peer-dependency metadata mismatch — the library itself works fine with React 19.
