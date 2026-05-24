"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useDebounce } from "@/lib/hooks";
import { Spinner, SearchInput, Select, Badge } from "./ui";

const PAGE_SIZE = 24;

interface Book {
  id: string;
  titleEn: string;
  titleKh: string | null;
  author: string | null;
  category: string | null;
  coverImage: string | null;
  availableCopies: number;
  totalCopies: number;
  publishYear: number | null;
}

interface BooksResponse {
  books: Book[];
  total: number;
  page: number;
  limit: number;
}

function BookPlaceholder() {
  return (
    <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
    </svg>
  );
}

export default function PortalBooksPage() {
  const t           = useTranslations("portal.books");
  const locale      = useLocale();
  const [search, setSearch]           = useState("");
  const [category, setCategory]       = useState("");
  const [availableOnly, setAvailable] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const sentinelRef     = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery<BooksResponse>({
      queryKey: ["portal-books", debouncedSearch, category, availableOnly],
      initialPageParam: 1,
      queryFn: ({ pageParam }) => {
        const params = new URLSearchParams({ page: String(pageParam), limit: String(PAGE_SIZE) });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (category)        params.set("category", category);
        if (availableOnly)   params.set("available", "true");
        return fetch(`/api/portal/books?${params}`).then((r) => r.json());
      },
      getNextPageParam: (last) => {
        const loaded = (last.page - 1) * last.limit + last.books.length;
        return loaded < last.total ? last.page + 1 : undefined;
      },
    });

  const { data: categoriesData } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearch = useCallback((val: string) => setSearch(val), []);

  const books      = data?.pages.flatMap((p) => p.books) ?? [];
  const total      = data?.pages[0]?.total ?? 0;
  const categories = categoriesData ?? [];

  const categoryOptions = [
    { value: "", label: t("filterCategory") },
    ...categories.map((c) => ({ value: c.name, label: c.name })),
  ];

  const availabilityOptions = [
    { value: "all",       label: t("filterAvailability") },
    { value: "available", label: t("availableOnly") },
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t("title")}</h2>

      {/* Search + filters */}
      <div className="space-y-2.5 mb-5">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder={t("searchPlaceholder")}
        />
        <div className="flex gap-2">
          <Select
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            className="flex-1"
          />
          <Select
            value={availableOnly ? "available" : "all"}
            onChange={(v) => setAvailable(v === "available")}
            options={availabilityOptions}
            className="w-36"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <Spinner />
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">{t("empty")}</div>
      ) : (
        <>
          {total > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
              {t("totalCount", { count: total })}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {books.map((book) => (
              <Link key={book.id} href={`/${locale}/books/${book.id}`}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="h-36 bg-indigo-50 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                    {book.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BookPlaceholder />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight mb-1">
                      {book.titleKh ?? book.titleEn}
                    </p>
                    {book.author && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate mb-1.5">
                        {book.author}
                      </p>
                    )}
                    {book.availableCopies > 0 ? (
                      <Badge color="green">{t("available", { count: book.availableCopies })}</Badge>
                    ) : (
                      <Badge color="default">{t("unavailable")}</Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Spinner className="py-0" />}
            {!hasNextPage && books.length > 0 && (
              <p className="text-xs text-slate-300 dark:text-slate-600">— {t("allLoaded")} —</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
