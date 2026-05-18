"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/libs/utils/request";

export interface Member {
  id: string;
  memberId: string;
  nameEn: string | null;
  nameKh: string | null;
  phone: string | null;
  email: string | null;
  type: "STUDENT" | "TEACHER" | "PUBLIC" | "RESEARCHER";
  expiresAt: string | null;
  _count: { loans: number };
}

interface MembersResponse {
  members: Member[];
  total: number;
}

export function useFetchMembers(search: string, page: number) {
  return useQuery({
    queryKey: ["members", search, page],
    queryFn: () =>
      apiFetch<MembersResponse>(
        `/api/members?search=${encodeURIComponent(search)}&page=${page}&limit=20`
      ),
  });
}
