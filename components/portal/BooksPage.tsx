"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Input, Select, Tag, Spin } from "antd";
import { BookOutlined, SearchOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useDebounce } from "@/lib/hooks";

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

export default function PortalBooksPage() {
  const t = useTranslations("portal.books");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery<BooksResponse>({
      queryKey: ["portal-books", debouncedSearch, category, availableOnly],
      initialPageParam: 1,
      queryFn: ({ pageParam }) => {
        const params = new URLSearchParams({
          page: String(pageParam),
          limit: String(PAGE_SIZE),
        });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (category) params.set("category", category);
        if (availableOnly) params.set("available", "true");
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

  // IntersectionObserver — fires fetchNextPage when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearch = useCallback((val: string) => setSearch(val), []);

  const books = data?.pages.flatMap((p) => p.books) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const categories = categoriesData ?? [];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">{t("title")}</h2>

      {/* Search + filters */}
      <div className="space-y-2 mb-4">
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
          size="large"
          className="rounded-lg"
        />
        <div className="flex gap-2">
          <Select
            value={category}
            onChange={(v) => setCategory(v)}
            className="flex-1"
            size="middle"
          >
            <Select.Option value="">{t("filterCategory")}</Select.Option>
            {categories.map((c) => (
              <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>
            ))}
          </Select>
          <Select
            value={availableOnly ? "available" : "all"}
            onChange={(v) => setAvailableOnly(v === "available")}
            style={{ width: 150 }}
            size="middle"
          >
            <Select.Option value="all">{t("filterAvailability")}</Select.Option>
            <Select.Option value="available">{t("availableOnly")}</Select.Option>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-slate-400">{t("empty")}</div>
      ) : (
        <>
          {total > 0 && (
            <p className="text-xs text-slate-400 mb-3">{total} books</p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {books.map((book) => (
              <Link key={book.id} href={`/${locale}/books/${book.id}`}>
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-36 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BookOutlined className="text-3xl text-slate-300" />
                    )}
                  </div>
                  <div className="p-2.5">
                    <div className="text-xs font-medium text-slate-800 line-clamp-2 leading-tight mb-1">
                      {book.titleKh ?? book.titleEn}
                    </div>
                    {book.author && (
                      <div className="text-xs text-slate-400 truncate mb-1.5">{book.author}</div>
                    )}
                    {book.availableCopies > 0 ? (
                      <Tag color="green" className="text-xs">
                        {t("available", { count: book.availableCopies })}
                      </Tag>
                    ) : (
                      <Tag color="default" className="text-xs">{t("unavailable")}</Tag>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Sentinel + loading indicator */}
          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Spin />}
            {!hasNextPage && books.length > 0 && (
              <p className="text-xs text-slate-300">— {t("allLoaded")} —</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
