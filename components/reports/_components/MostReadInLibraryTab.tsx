"use client";

import { useState } from "react";
import { Table, Select } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/libs/utils/request";
import { useTableScroll } from "@/lib/hooks";
import type { ColumnsType } from "antd/es/table";
import { DateRangeFilter, type DateRange } from "./DateRangeFilter";

interface InLibraryBook {
  rank: number;
  readCount: number;
  book: { id: string; titleKh: string | null; titleEn: string | null; author: string | null; category: string | null } | undefined;
}

export function MostReadInLibraryTab() {
  const t = useTranslations("reports");
  const { ref: tableRef, scrollY } = useTableScroll();
  const [limit, setLimit] = useState(10);
  const [range, setRange] = useState<DateRange>({ from: null, to: null });

  const params = new URLSearchParams({ limit: String(limit) });
  if (range.from) params.set("dateFrom", range.from);
  if (range.to) params.set("dateTo", range.to);

  const { data = [], isLoading } = useQuery<InLibraryBook[]>({
    queryKey: ["report-most-read-inlibrary", limit, range.from, range.to],
    queryFn: () => apiFetch<InLibraryBook[]>(`/api/reports/most-read-inlibrary?${params}`),
  });

  const columns: ColumnsType<InLibraryBook> = [
    {
      title: "#",
      key: "rank",
      width: 44,
      render: (_, __, i) => (
        <span className={`font-bold text-sm ${i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-slate-300"}`}>
          {i + 1}
        </span>
      ),
    },
    {
      title: t("inLibrary.colTitle"),
      key: "title",
      render: (_, r) =>
        r.book ? (
          <div>
            <p className="font-medium text-slate-800 leading-snug">{r.book.titleKh ?? r.book.titleEn}</p>
            {r.book.titleKh && r.book.titleEn && <p className="text-xs text-slate-400">{r.book.titleEn}</p>}
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: t("inLibrary.colAuthor"),
      key: "author",
      render: (_, r) => <span className="text-slate-500 text-sm">{r.book?.author ?? "—"}</span>,
    },
    {
      title: t("inLibrary.colCategory"),
      key: "category",
      render: (_, r) => <span className="text-slate-500 text-sm">{r.book?.category ?? "—"}</span>,
    },
    {
      title: t("inLibrary.colReadCount"),
      dataIndex: "readCount",
      key: "readCount",
      align: "right",
      sorter: (a, b) => b.readCount - a.readCount,
      render: (v) => <span className="font-semibold text-blue-600">{v}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeFilter onChange={setRange} />
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-sm">{t("popular.showTop")}</span>
          <Select
            value={limit}
            onChange={setLimit}
            size="small"
            options={[
              { label: t("popular.top10"), value: 10 },
              { label: t("popular.top20"), value: 20 },
              { label: t("popular.top50"), value: 50 },
            ]}
          />
        </div>
      </div>

      <div ref={tableRef}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(r) => r.book?.id ?? String(r.rank)}
          loading={isLoading}
          size="small"
          scroll={{ x: "max-content", y: scrollY }}
          pagination={false}
          locale={{ emptyText: t("inLibrary.empty") }}
        />
      </div>
    </div>
  );
}
