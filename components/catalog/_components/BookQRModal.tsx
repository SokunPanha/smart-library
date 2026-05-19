"use client";

import { useRef } from "react";
import { Modal, Button, Space } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";
import type { Book } from "../helper/useFetchBooks";

interface Props {
  book: Book | null;
  onClose: () => void;
}

export function BookQRModal({ book, onClose }: Props) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const qrRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl || !book) return;

    const svgContent = new XMLSerializer().serializeToString(svgEl);
    const card = `<div class="card"><div class="qr">${svgContent}</div><p class="title">${book.titleEn}</p></div>`;
    const cards = Array(book.totalCopies).fill(card);

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
    <title>QR - ${book.titleEn}</title>
    <style>
      @page { size: A4 portrait; margin: 10mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; background: white; }
      .page { width: 190mm; height: 277mm; page-break-after: always; break-after: page; }
      .page:last-child { page-break-after: avoid; break-after: avoid; }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(5, 1fr);
        gap: 4mm;
        width: 190mm;
        height: 277mm;
      }
      .card { border: 1.5px dashed #aaa; padding: 3mm; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2mm; }
      .qr svg { display: block; width: 28mm !important; height: 28mm !important; }
      .title { font-size: 7pt; font-weight: 700; text-align: center; line-height: 1.35; max-width: 55mm; word-break: break-word; }
    </style>
  </head>
  <body>
    ${pages.join("")}
    <script>window.onload = () => { window.print(); window.close(); }</script>
  </body>
</html>`);
    win.document.close();
  }

  return (
    <Modal
      title={t("qrCode")}
      open={!!book}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>{tc("cancel")}</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            {t("printQR")}
          </Button>
        </Space>
      }
      width={320}
      centered
    >
      {book && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div ref={qrRef}>
            <QRCodeSVG value={book.id} size={200} level="M" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800 text-sm leading-snug">{book.titleEn}</p>
            {book.titleKh && <p className="text-xs text-slate-400 mt-0.5">{book.titleKh}</p>}
            <p className="text-xs text-slate-300 mt-2 font-mono">{book.id}</p>
          </div>
          <p className="text-xs text-slate-400">{t("qrScanHint")}</p>
        </div>
      )}
    </Modal>
  );
}
