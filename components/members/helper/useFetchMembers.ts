"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/request";

export interface Member {
  id: string;
  memberId: string;
  nameEn: string | null;
  nameKh: string | null;
  phone: string | null;
  email: string | null;
  photo: string | null;
  type: "STUDENT" | "TEACHER" | "PUBLIC" | "RESEARCHER";
  expiresAt: string | null;
  classId: string | null;
  class: { id: string; name: string } | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
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
