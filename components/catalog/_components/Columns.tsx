"use client";

import { Button, Space, Popconfirm, Tag, Badge, Image, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined, QrcodeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
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
          <p className="font-medium text-slate-800 leading-snug">{row.titleKh ?? row.titleEn}</p>
          {row.titleKh && row.titleEn && <p className="text-xs text-slate-400 mt-0.5">{row.titleEn}</p>}
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
      title: t("catalog.colShelf"),
      key: "shelf",
      render: (_, row) => {
        const s = row.shelf;
        if (!s) return <span className="text-slate-300">—</span>;
        const levelLetter = s.level ? String.fromCharCode(64 + s.level) : null;
        return (
          <div className="text-xs leading-snug">
            <span className="font-mono font-semibold text-blue-600">{s.code}</span>
            {s.cabinet && (
              <p className="text-slate-400">
                Cab.&nbsp;{s.cabinet}{levelLetter ? `, Lvl ${levelLetter}` : ""}{s.block ? `, Blk ${s.block}` : ""}
              </p>
            )}
          </div>
        );
      },
    },
    {
      title: t("common.createdBy"),
      key: "createdBy",
      render: (_, row) => (
        <div className="min-w-[110px]">
          <p className="text-xs text-slate-700 leading-snug">{row.createdBy ?? "—"}</p>
          <p className="text-[10px] text-slate-400">{dayjs(row.createdAt).format("DD/MM/YY HH:mm")}</p>
          {row.updatedBy && row.updatedBy !== row.createdBy && (
            <>
              <p className="text-xs text-slate-500 leading-snug mt-1">{row.updatedBy}</p>
              <p className="text-[10px] text-slate-400">{dayjs(row.updatedAt).format("DD/MM/YY HH:mm")}</p>
            </>
          )}
        </div>
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
