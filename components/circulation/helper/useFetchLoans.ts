"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/libs/utils/request";

export interface Loan {
  id: string;
  status: "ACTIVE" | "RETURNED" | "OVERDUE" | "LOST";
  borrowedAt: string;
  dueAt: string;
  returnedAt: string | null;
  fineAmount: number;
  finePaid: boolean;
  book: { id: string; titleEn: string; titleKh: string | null };
  member: { id: string; nameEn: string | null; nameKh: string | null; memberId: string };
}

interface LoansResponse {
  loans: Loan[];
  total: number;
}

export function useFetchLoans(status: string, page: number) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);

  return useQuery({
    queryKey: ["loans", status, page],
    queryFn: () => apiFetch<LoansResponse>(`/api/loans?${params}`),
  });
}
