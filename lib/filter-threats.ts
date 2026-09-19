import type { ThreatEvent, ThreatFilters } from "./types";

export function filterThreats(events: ThreatEvent[], filters: ThreatFilters): ThreatEvent[] {
  return events.filter((event) => {
    if (filters.types?.length && !filters.types.includes(event.type)) return false;
    if (filters.severities?.length && !filters.severities.includes(event.severity)) return false;
    if (filters.countryCode && event.origin.countryCode !== filters.countryCode && event.target.countryCode !== filters.countryCode) {
      return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [
        event.title,
        event.description,
        event.origin.country,
        event.target.country,
        event.ioc.ip,
        event.ioc.domain,
        event.ioc.url,
        event.ioc.hash,
        event.ioc.cve,
        event.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
