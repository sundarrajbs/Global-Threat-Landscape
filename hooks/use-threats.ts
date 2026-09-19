"use client";

import { useQuery } from "@tanstack/react-query";
import type { ThreatFeedResponse } from "@/lib/types";

async function fetchThreats(): Promise<ThreatFeedResponse> {
  const res = await fetch("/api/threats", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load threat feed (${res.status})`);
  }
  return res.json();
}

export function useThreats() {
  return useQuery({
    queryKey: ["threats"],
    queryFn: fetchThreats,
    refetchInterval: 30_000,
  });
}
