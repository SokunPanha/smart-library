"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/libs/utils/request";

export type Settings = Record<string, string>;

export function useFetchSettings() {
  return useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => apiFetch<Settings>("/api/settings"),
  });
}
