"use client";

import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect } from "react";
import { signOut } from "next-auth/react";

export class PortalUnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "PortalUnauthorizedError";
  }
}

export async function portalFetch(input: RequestInfo, init?: RequestInit): Promise<unknown> {
  const r = await fetch(input, init);
  if (r.status === 401) throw new PortalUnauthorizedError();
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export function usePortalQuery<TData>(
  options: UseQueryOptions<TData, Error, TData, QueryKey>
) {
  const router = useRouter();
  const locale = useLocale();

  const result = useQuery<TData, Error>(options);

  useEffect(() => {
    if (result.error instanceof PortalUnauthorizedError) {
      signOut({ redirect: false }).then(() => {
        router.replace(`/${locale}/login`);
      });
    }
  }, [result.error, router, locale]);

  return result;
}
