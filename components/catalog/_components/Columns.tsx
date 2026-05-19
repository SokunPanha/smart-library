"use client";

import { Button, Space, Popconfirm, Tag, Badge, Image, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined, QrcodeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Book } from "../helper/useFetchBooks";
import type { useBooks } from "../helper/useBooks";
import type { useCatalogContext } from "../helper/hooks";

interface ColumnArgs {
  ctx: ReturnType<typeof useCatalogContext>;
  actions: ReturnType<typeof useBooks>;
  t: (key: string) => string;
  onQR: (book: Book) => void;
}

export function buildBookColumns({ ctx, actions, t, onQR }: ColumnArgs): ColumnsType<Book> {
  return [
    {
      title: t("catalog.coverImage"),
      key: "cover",
      width: 56,
      render: (_, row) =>
        row.coverImage ? (
          <Image
            src={row.coverImage}
            alt="cover"
            width={36}
            height={50}
            style={{ objectFit: "cover", borderRadius: 4 }}
            preview={{ mask: false }}
          />
        ) : (
          <div className="w-9 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-300 text-xs">
            —
          </div>
        ),
    },
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
          <Tooltip title={t("catalog.qrCode")}>
            <Button
              type="text"
              size="small"
              icon={<QrcodeOutlined />}
              onClick={() => onQR(row)}
            />
          </Tooltip>
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
