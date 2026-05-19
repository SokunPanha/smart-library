"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/request";

export interface Loan {
  id: string;
  status: "ACTIVE" | "RETURNED" | "OVERDUE" | "LOST";
  borrowedAt: string;
  dueAt: string;
  returnedAt: string | null;
  fineAmount: number;
  finePaid: boolean;
  renewalCount: number;
  checkedOutBy: string | null;
  closedBy: string | null;
  book: { id: string; titleEn: string; titleKh: string | null; coverImage: string | null };
  member: { id: string; nameEn: string | null; nameKh: string | null; memberId: string };
}

interface LoansResponse {
  loans: Loan[];
  total: number;
}

export function useFetchLoans(status: string, search: string, page: number) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  if (search) params.set("search", search);

  return useQuery({
    queryKey: ["loans", status, search, page],
    queryFn: () => apiFetch<LoansResponse>(`/api/loans?${params}`),
  });
}
