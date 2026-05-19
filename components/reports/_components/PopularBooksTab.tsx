"use client";

import { Table, Select, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/request";
import { useTableScroll } from "@/lib/hooks";
import { exportExcel } from "@/lib/excel";
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
          <div className="font-medium">{r.book.titleKh ?? r.book.titleEn}</div>
          {r.book.titleKh && r.book.titleEn && <div className="text-slate-400 text-xs">{r.book.titleEn}</div>}
        </div>
      ),
    },
    { title: t("popular.colAuthor"), dataIndex: ["book", "author"], key: "author" },
    { title: t("popular.colCategory"), dataIndex: ["book", "category"], key: "category" },
    { title: t("popular.colTotalLoans"), dataIndex: "totalLoans", key: "totalLoans", align: "right", sorter: (a, b) => b.totalLoans - a.totalLoans },
  ];

  function handleExport() {
    exportExcel(
      data.map((r, i) => ({
        [t("popular.colRank")]: i + 1,
        [t("popular.colTitle")]: r.book.titleKh ?? r.book.titleEn,
        "Title (EN)": r.book.titleEn,
        [t("popular.colAuthor")]: r.book.author ?? "",
        [t("popular.colCategory")]: r.book.category ?? "",
        [t("popular.colTotalLoans")]: r.totalLoans,
      })),
      "Popular Books",
      "popular-books"
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
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
        <div className="ml-auto">
          <Button size="small" icon={<DownloadOutlined />} onClick={handleExport} disabled={!data.length}>
            {t("exportExcel")}
          </Button>
        </div>
      </div>
      <div ref={tableRef}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(r) => r.book.id}
          loading={isLoading}
          size="small"
          scroll={{ x: "max-content", y: scrollY }}
          pagination={false}
          locale={{ emptyText: t("popular.empty") }}
        />
      </div>
    </div>
  );
}
