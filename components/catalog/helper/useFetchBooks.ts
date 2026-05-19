"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/libs/utils/request";

export interface Book {
  id: string;
  isbn: string | null;
  titleEn: string;
  titleKh: string | null;
  author: string | null;
  publisher: string | null;
  publishYear: number | null;
  category: string | null;
  deweyCode: string | null;
  totalCopies: number;
  availableCopies: number;
  tags: string[];
  coverImage: string | null;
}

interface BooksResponse {
  books: Book[];
  total: number;
}

export function useFetchBooks(search: string, page: number, pageSize: number) {
  return useQuery({
    queryKey: ["books", search, page, pageSize],
    queryFn: () =>
      apiFetch<BooksResponse>(
        `/api/books?search=${encodeURIComponent(search)}&page=${page}&limit=${pageSize}`
      ),
  });
}
