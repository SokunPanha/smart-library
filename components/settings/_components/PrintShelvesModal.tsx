"use client";

import { useState } from "react";
import { Modal, Button, Select, Tag } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

export interface ShelfForPrint {
  id: string;
  code: string;
  cabinet: string;
  side: string | null;
  shelfNo: number;
  sectionNo: number;
  zone: string | null;
  label: string | null;
  _count: { books: number };
}

interface Props {
  open: boolean;
  onClose: () => void;
  shelves: ShelfForPrint[];
}

interface PrintStrings {
  libraryName: string;
  cabinetWord: string;
  sidesLabel: string;
  subjectZonesTitle: string;
  sectionsUnit: (n: number) => string;
  booksUnit: (n: number) => string;
  sectionLabelsHeader: (cab: string) => string;
  frontSide: string;
  rearSide: string;
}

const enStrings: PrintStrings = {
  libraryName: "LibraCore Library",
  cabinetWord: "Cabinet",
  sidesLabel: "Sides",
  subjectZonesTitle: "Subject zones",
  sectionsUnit: (n) => `${n} section${n !== 1 ? "s" : ""}`,
  booksUnit: (n) => `${n} book${n !== 1 ? "s" : ""}`,
  sectionLabelsHeader: (cab) => `Cabinet ${cab} — Section Labels`,
  frontSide: "Left",
  rearSide: "Right",
};

const kmStrings: PrintStrings = {
  libraryName: "បណ្ណាល័យ LibraCore",
  cabinetWord: "ទូ",
  sidesLabel: "ខាង",
  subjectZonesTitle: "តំបន់មុខវិជ្ជា",
  sectionsUnit: (n) => `${n} ផ្នែក`,
  booksUnit: (n) => `${n} ក្បាល`,
  sectionLabelsHeader: (cab) => `ទូ ${cab} — ស្លាកផ្នែក`,
  frontSide: "ឆ្វេង",
  rearSide: "ស្តាំ",
};

function humanSide(side: string | null, s: PrintStrings): string {
  if (!side) return "";
  if (side.toUpperCase() === "L" || side.toUpperCase() === "F") return s.frontSide;
  if (side.toUpperCase() === "R") return s.rearSide;
  return side;
}

function buildPrintHTML(
  cabinetIds: string[],
  byCabinet: Record<string, ShelfForPrint[]>,
  s: PrintStrings
): string {
  const pages = cabinetIds.map((cab) => {
    const items = byCabinet[cab] ?? [];
    const zones = [...new Set(items.map((i) => i.zone).filter(Boolean))] as string[];
    const sides = [...new Set(items.map((i) => i.side).filter(Boolean))] as string[];
    const totalBooks = items.reduce((n, i) => n + i._count.books, 0);

    // ── Page 1: big cabinet label ─────────────────────────────────────────
    const cabinetPage = `
      <div class="page cabinet-page">
        <div class="lib-name">${s.libraryName}</div>
        <div class="cab-letter">${cab}</div>
        <div class="cab-word">${s.cabinetWord}</div>
        ${
          sides.length > 0
            ? `<div class="cab-sides">${s.sidesLabel}: ${sides.map((side) => humanSide(side, s)).join("  ·  ")}</div>`
            : ""
        }
        ${
          zones.length > 0
            ? `<div class="cab-zones">
                <div class="zones-title">${s.subjectZonesTitle}</div>
                ${zones.map((z) => `<div class="zone-row">• ${z}</div>`).join("")}
               </div>`
            : ""
        }
        <div class="cab-stats">${s.sectionsUnit(items.length)} &nbsp;·&nbsp; ${s.booksUnit(totalBooks)}</div>
      </div>`;

    // ── Page 2: section label cards (code only) ───────────────────────────
    const cards = items
      .map(
        (i) => `
        <div class="card">
          <div class="card-code">${i.code}</div>
        </div>`
      )
      .join("");

    const sectionsPage = `
      <div class="page sections-page">
        <div class="sections-hdr">${s.sectionLabelsHeader(cab)}</div>
        <div class="cards-grid">${cards}</div>
      </div>`;

    return cabinetPage + sectionsPage;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Shelf Labels</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;700&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Noto Sans Khmer', Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── shared ─────────────────────────────────── */
    .page { width: 100%; page-break-after: always; }
    .page:last-child { page-break-after: avoid; }

    /* ── Page 1: cabinet label ──────────────────── */
    .cabinet-page {
      min-height: calc(297mm - 24mm);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      text-align: center;
      border: 3px solid #1e1b4b;
      border-radius: 10px;
      padding: 24px 36px;
      position: relative;
    }
    .lib-name {
      position: absolute;
      top: 14px;
      font-size: 9.5pt;
      color: #94a3b8;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .cab-letter {
      font-size: 140pt;
      font-weight: 800;
      color: #1e1b4b;
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .cab-word {
      font-size: 14pt;
      font-weight: 500;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      margin-top: -12px;
    }
    .cab-sides {
      font-size: 9pt;
      color: #94a3b8;
    }
    .cab-zones {
      margin-top: 6px;
      max-width: 380px;
    }
    .zones-title {
      font-size: 8.5pt;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 5px;
    }
    .zone-row {
      font-size: 12pt;
      color: #334155;
      line-height: 1.7;
    }
    .cab-stats {
      margin-top: 6px;
      font-size: 9pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      width: 180px;
    }

    /* ── Page 2: section cards (code only) ─────── */
    .sections-page { padding-top: 2mm; }
    .sections-hdr {
      font-size: 9pt;
      color: #94a3b8;
      text-align: center;
      margin-bottom: 4mm;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3mm;
    }
    .card {
      border: 1.5px dashed #cbd5e1;
      border-radius: 4px;
      padding: 5mm 4mm;
      page-break-inside: avoid;
      min-height: 22mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card-code {
      font-size: 18pt;
      font-weight: 700;
      color: #1e1b4b;
      font-family: monospace;
      letter-spacing: 0.05em;
      text-align: center;
    }
  </style>
</head>
<body>
  ${pages.join("")}
  <script>window.onload = function () { window.print(); };<\/script>
</body>
</html>`;
}

export function PrintShelvesModal({ open, onClose, shelves }: Props) {
  const t = useTranslations("settings.shelves");
  const locale = useLocale();
  const [selected, setSelected] = useState<string>("all");

  const strings = locale === "km" ? kmStrings : enStrings;

  const cabinets = [...new Set(shelves.map((s) => s.cabinet))].sort();
  const byCabinet: Record<string, ShelfForPrint[]> = Object.fromEntries(
    cabinets.map((cab) => [cab, shelves.filter((s) => s.cabinet === cab)])
  );

  const printCabinets = selected === "all" ? cabinets : [selected];

  function handlePrint() {
    if (printCabinets.length === 0) return;
    const html = buildPrintHTML(printCabinets, byCabinet, strings);
    const win = window.open("", "_blank", "width=900,height=720");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
  }

  const previewItems = printCabinets.flatMap((cab) => byCabinet[cab] ?? []);

  return (
    <Modal
      open={open}
      title={
        <span className="flex items-center gap-2">
          <PrinterOutlined />
          {t("printTitle")}
        </span>
      }
      onCancel={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t("cancel")}</Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            disabled={printCabinets.length === 0}
            onClick={handlePrint}
          >
            {t("printBtn")}
          </Button>
        </div>
      }
      width={520}
      destroyOnHidden
    >
      <div className="space-y-4 py-2">
        <div>
          <label className="block text-xs text-slate-500 mb-1">{t("printSelectCabinet")}</label>
          <Select
            value={selected}
            onChange={setSelected}
            className="w-full"
            options={[
              { value: "all", label: `${t("printAllCabinets")} (${cabinets.length})` },
              ...cabinets.map((cab) => ({
                value: cab,
                label: `${t("colCabinet")} ${cab} — ${byCabinet[cab]?.length ?? 0} ${t("colSection").toLowerCase()}`,
              })),
            ]}
          />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs text-slate-500">
          <p className="font-medium text-slate-600">{t("printWillPrint")}</p>
          <ul className="space-y-1 list-none">
            {printCabinets.map((cab) => {
              const items = byCabinet[cab] ?? [];
              const zones = [...new Set(items.map((s) => s.zone).filter(Boolean))];
              return (
                <li key={cab} className="flex flex-col gap-0.5">
                  <span>
                    <strong>{t("colCabinet")} {cab}</strong>
                    {" — "}
                    <span className="text-slate-400">
                      2 {t("printTotalPages", { pages: 2 }).replace("2 ", "")}: 1 {t("colCabinet").toLowerCase()} + {items.length} {t("colSection").toLowerCase()}
                    </span>
                  </span>
                  {zones.length > 0 && (
                    <span className="flex flex-wrap gap-1 pl-2">
                      {zones.map((z) => (
                        <Tag key={z} className="border-0 bg-indigo-50 text-indigo-600 text-xs m-0">{z}</Tag>
                      ))}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-slate-400 pt-1 border-t border-slate-200">
            {t("printTotalPages", { pages: printCabinets.length * 2 })}
            {" · "}
            {t("printTotalCards", { cards: previewItems.length })}
          </p>
        </div>

        <p className="text-xs text-slate-400">{t("printHint")}</p>
      </div>
    </Modal>
  );
}
