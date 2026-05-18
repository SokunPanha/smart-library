"use client";

import { Table, Select } from "antd";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/libs/utils/request";
import { useTableScroll } from "@/lib/hooks";
import type { ColumnsType } from "antd/es/table";

type PopularBook = {
  book: { id: string; titleEn: string; titleKh: string | null; author: string | null; category: string | null };
  totalLoans: number;
};

export function PopularBooksTab() {
  const [limit, setLimit] = useState(10);
  const { ref: tableRef, scrollY } = useTableScroll();
  const t = useTranslations("reports");
  const tc = useTranslations("common");

  const { data = [], isLoading } = useQuery<PopularBook[]>({
    queryKey: ["report-popular", limit],
    queryFn: () => apiFetch<PopularBook[]>(`/api/reports/popular-books?limit=${limit}`),
  });

  const columns: ColumnsType<PopularBook> = [
    { title: t("popular.colRank"), key: "rank", render: (_, __, i) => i + 1, width: 48 },
    {
      title: t("popular.colTitle"),
      key: "title",
      render: (_, r) => (
        <div>
          <div className="font-medium">{r.book.titleEn}</div>
          {r.book.titleKh && <div className="text-slate-400 text-xs">{r.book.titleKh}</div>}
        </div>
      ),
    },
    { title: t("popular.colAuthor"), dataIndex: ["book", "author"], key: "author" },
    { title: t("popular.colCategory"), dataIndex: ["book", "category"], key: "category" },
    { title: t("popular.colTotalLoans"), dataIndex: "totalLoans", key: "totalLoans", align: "right", sorter: (a, b) => b.totalLoans - a.totalLoans },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-slate-600 text-sm">{t("popular.showTop")}</span>
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
      <div ref={tableRef}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(r) => r.book.id}
          loading={isLoading}
          size="small"
          scroll={{ y: scrollY }}
          pagination={false}
          locale={{ emptyText: t("popular.empty") }}
        />
      </div>
    </div>
  );
}
