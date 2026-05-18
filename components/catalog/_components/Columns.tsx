"use client";

import { Button, Space, Popconfirm, Tag, Badge } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Book } from "../helper/useFetchBooks";
import type { useBooks } from "../helper/useBooks";
import type { useCatalogContext } from "../helper/hooks";

interface ColumnArgs {
  ctx: ReturnType<typeof useCatalogContext>;
  actions: ReturnType<typeof useBooks>;
  t: (key: string) => string;
}

export function buildBookColumns({ ctx, actions, t }: ColumnArgs): ColumnsType<Book> {
  return [
    {
      title: t("catalog.colTitle"),
      key: "title",
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800 leading-snug">{row.titleEn}</p>
          {row.titleKh && <p className="text-xs text-slate-400 mt-0.5">{row.titleKh}</p>}
        </div>
      ),
    },
    {
      title: t("catalog.author"),
      dataIndex: "author",
      key: "author",
      render: (v) => v ?? <span className="text-slate-300">—</span>,
    },
    {
      title: t("catalog.category"),
      dataIndex: "category",
      key: "category",
      render: (v) =>
        v ? (
          <Tag className="border-0 bg-slate-100 text-slate-600">{v}</Tag>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: t("catalog.colCopies"),
      key: "copies",
      render: (_, row) => (
        <Badge
          status={row.availableCopies > 0 ? "success" : "error"}
          text={`${row.availableCopies} / ${row.totalCopies}`}
        />
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 100,
      render: (_, row) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => ctx.editForm.open(row as unknown)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => actions.deleteBook(row)}
          />
        </Space>
      ),
    },
  ];
}
