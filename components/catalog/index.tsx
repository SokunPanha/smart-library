"use client";

import { useState, useRef } from "react";
import { Table, Button, Input, Space } from "antd";
import { PlusOutlined, SearchOutlined, PrinterOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";
import { CatalogProvider, useCatalogContext } from "./helper/hooks";
import { useFetchBooks } from "./helper/useFetchBooks";
import { useBooks } from "./helper/useBooks";
import { buildBookColumns } from "./_components/Columns";
import { CreateBookDrawer, EditBookDrawer } from "./_components/BookDrawerForm";
import { BookQRModal } from "./_components/BookQRModal";
import type { Book } from "./helper/useFetchBooks";
import { useDebounce, useTableScroll } from "@/lib/hooks";

function CatalogPageInner() {
  const ctx = useCatalogContext();
  const actions = useBooks();

  const [inputVal, setInputVal] = useState("");
  const search = useDebounce(inputVal, 400);
  const [qrBook, setQrBook] = useState<Book | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const bulkQRRef = useRef<HTMLDivElement>(null);

  const t = useTranslations();
  const { data, isLoading } = useFetchBooks(search, ctx.table.page, ctx.table.pageSize);
  const books = data?.books ?? [];
  const selectedBooks = books.filter((b) => selectedRowKeys.includes(b.id));
  const columns = buildBookColumns({ ctx, actions, t, onQR: setQrBook });
  const { ref: tableRef, scrollY } = useTableScroll();

  function handleBulkPrint() {
    if (selectedBooks.length === 0) return;
    const svgEls = bulkQRRef.current?.querySelectorAll("[data-qr] svg");
    if (!svgEls) return;

    const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const cards = selectedBooks.flatMap((book, i) => {
      const svgEl = svgEls[i];
      const svgContent = svgEl ? new XMLSerializer().serializeToString(svgEl) : "";
      const card = `<div class="card"><div class="qr">${svgContent}</div><p class="title">${escape(book.titleEn)}</p></div>`;
      return Array(book.totalCopies).fill(card);
    });

    const pages: string[] = [];
    for (let i = 0; i < cards.length; i += 15) {
      const chunk = cards.slice(i, i + 15).join("");
      pages.push(`<div class="page"><div class="grid">${chunk}</div></div>`);
    }

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>QR Labels</title>
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: white; }
      .page {
        width: 190mm;
        height: 277mm;
        page-break-after: always;
        break-after: page;
      }
      .page:last-child { page-break-after: avoid; break-after: avoid; }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(5, 1fr);
        gap: 4mm;
        width: 190mm;
        height: 277mm;
      }
      .card {
        border: 1.5px dashed #aaa;
        padding: 3mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2mm;
      }
      .qr svg { display: block; width: 28mm !important; height: 28mm !important; }
      .title { font-size: 7pt; font-weight: 700; text-align: center; line-height: 1.35; max-width: 55mm; word-break: break-word; }
    </style>
  </head>
  <body>
    ${pages.join("")}
    <script>window.onload = () => { window.print(); window.close(); }<\/script>
  </body>
</html>`);
    win.document.close();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-semibold text-slate-800">{t("catalog.title")}</h1>
        <Space wrap>
          {selectedRowKeys.length > 0 && (
            <Button icon={<PrinterOutlined />} onClick={handleBulkPrint}>
              <span className="hidden sm:inline">{t("catalog.printSelected")}</span>
              {` (${selectedRowKeys.length})`}
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => ctx.createForm.open()}>
            <span className="hidden sm:inline">{t("catalog.addBook")}</span>
          </Button>
        </Space>
      </div>

      <div className="bg-white border border-slate-100 rounded-lg p-4">
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder={t("catalog.searchPlaceholder")}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); ctx.table.setPage(1); }}
          className="max-w-sm mb-4"
          allowClear
        />
        <div ref={tableRef}>
          <Table
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              columnWidth: 40,
            }}
            columns={columns}
            dataSource={books}
            rowKey="id"
            loading={isLoading}
            size="small"
            scroll={{ x: "max-content", y: scrollY }}
            {...ctx.table.props}
            pagination={{ ...ctx.table.props.pagination, total: data?.total ?? 0 }}
            locale={{ emptyText: "No books found." }}
          />
        </div>
      </div>

      {/* Off-screen QR codes rendered so we can serialize their SVG for bulk print */}
      <div
        ref={bulkQRRef}
        style={{ position: "fixed", left: "-9999px", top: 0, visibility: "hidden", pointerEvents: "none" }}
        aria-hidden
      >
        {selectedBooks.map((book) => (
          <div key={book.id} data-qr="">
            <QRCodeSVG value={book.id} size={180} level="M" />
          </div>
        ))}
      </div>

      <CreateBookDrawer />
      <EditBookDrawer />
      <BookQRModal book={qrBook} onClose={() => setQrBook(null)} />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <CatalogProvider>
      <CatalogPageInner />
    </CatalogProvider>
  );
}
