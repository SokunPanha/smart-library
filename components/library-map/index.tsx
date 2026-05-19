"use client";

import { useState } from "react";
import { Input, Spin, Tag, Drawer, Empty } from "antd";
import { BookOutlined, SearchOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/request";
import type { MapCell, CellType } from "./types";

interface LibraryMapData { id: string; rows: number; cols: number; cells: MapCell[]; }

interface ShelfRecord {
  id: string;
  code: string;
  label: string | null;
  section: string | null;
  cabinet: string | null;
  level: number | null;
  block: number | null;
  _count: { books: number };
}

interface BookItem {
  id: string;
  titleKh: string | null;
  titleEn: string | null;
  author: string | null;
  availableCopies: number;
  totalCopies: number;
}

const CELL_STYLE: Record<CellType, { bg: string; border: string; text: string; cursor: string }> = {
  EMPTY:   { bg: "bg-white",      border: "border-slate-100",  text: "text-transparent", cursor: "cursor-default"  },
  CABINET: { bg: "bg-violet-50",  border: "border-violet-300", text: "text-violet-700",  cursor: "cursor-pointer"  },
  SHELF:   { bg: "bg-blue-50",    border: "border-blue-300",   text: "text-blue-700",    cursor: "cursor-pointer"  },
  WALL:    { bg: "bg-slate-700",  border: "border-slate-800",  text: "text-slate-500",   cursor: "cursor-default"  },
  DOOR:    { bg: "bg-green-100",  border: "border-green-400",  text: "text-green-700",   cursor: "cursor-default"  },
  TABLE:   { bg: "bg-amber-50",   border: "border-amber-300",  text: "text-amber-700",   cursor: "cursor-default"  },
  DESK:    { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700",  cursor: "cursor-default"  },
  WINDOW:  { bg: "bg-sky-50",     border: "border-sky-200",    text: "text-sky-500",     cursor: "cursor-default"  },
};

function safeGetStyle(type: string) {
  return CELL_STYLE[type as CellType] ?? CELL_STYLE.EMPTY;
}

function levelLetter(level: number | null): string {
  if (!level || level < 1) return "";
  return String.fromCharCode(64 + level);
}

export default function LibraryMapPage() {
  const t = useTranslations("map");
  const tMap = useTranslations("settings.libraryMap");

  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const [selectedCabinet, setSelectedCabinet] = useState<string | null>(null);
  const [shelfSearch, setShelfSearch] = useState("");
  const [cabinetSearch, setCabinetSearch] = useState("");

  const { data: mapData, isLoading: mapLoading } = useQuery<LibraryMapData>({
    queryKey: ["library-map"],
    queryFn: () => apiFetch<LibraryMapData>("/api/library-map"),
  });

  const { data: allShelves = [] } = useQuery<ShelfRecord[]>({
    queryKey: ["shelves"],
    queryFn: () => apiFetch<ShelfRecord[]>("/api/shelves"),
  });

  const { data: shelfBooks = [], isLoading: shelfBooksLoading } = useQuery<BookItem[]>({
    queryKey: ["shelf-books", selectedShelfId, shelfSearch],
    queryFn: () => apiFetch<{ books: BookItem[] }>(`/api/books?shelfId=${selectedShelfId}&search=${encodeURIComponent(shelfSearch)}&limit=50`).then((r) => r.books),
    enabled: !!selectedShelfId,
  });

  const { data: cabinetShelves = [], isLoading: cabinetLoading } = useQuery<ShelfRecord[]>({
    queryKey: ["cabinet-shelves", selectedCabinet],
    queryFn: () => apiFetch<ShelfRecord[]>(`/api/shelves?cabinet=${encodeURIComponent(selectedCabinet!)}`),
    enabled: !!selectedCabinet,
  });

  const [activeCabinetShelf, setActiveCabinetShelf] = useState<string | null>(null);
  const { data: cabinetShelfBooks = [], isLoading: cabinetShelfBooksLoading } = useQuery<BookItem[]>({
    queryKey: ["cabinet-shelf-books", activeCabinetShelf, cabinetSearch],
    queryFn: () => apiFetch<{ books: BookItem[] }>(`/api/books?shelfId=${activeCabinetShelf}&search=${encodeURIComponent(cabinetSearch)}&limit=50`).then((r) => r.books),
    enabled: !!activeCabinetShelf,
  });

  const selectedShelf = allShelves.find((s) => s.id === selectedShelfId);

  function getCell(row: number, col: number): MapCell {
    return mapData?.cells.find((c) => c.row === row && c.col === col) ?? { row, col, type: "EMPTY" };
  }

  function handleCellClick(cell: MapCell) {
    if (cell.type === "CABINET" && cell.cabinetCode) {
      setSelectedCabinet(cell.cabinetCode);
      setActiveCabinetShelf(null);
      setCabinetSearch("");
    } else if (cell.type === "SHELF" && cell.shelfId) {
      setSelectedShelfId(cell.shelfId);
      setShelfSearch("");
    }
  }

  if (mapLoading) return <div className="flex justify-center py-20"><Spin /></div>;

  const rows = mapData?.rows ?? 8;
  const cols = mapData?.cols ?? 12;
  const hasContent = mapData?.cells.some((c) => c.type !== "EMPTY");

  const legendTypes: CellType[] = ["CABINET", "SHELF", "WALL", "DOOR", "TABLE", "DESK", "WINDOW"];
  const cellTypeLabels: Record<CellType, string> = {
    EMPTY:   tMap("cellEmpty"),
    CABINET: tMap("cellCabinet"),
    SHELF:   tMap("cellShelf"),
    WALL:    tMap("cellWall"),
    DOOR:    tMap("cellDoor"),
    TABLE:   tMap("cellTable"),
    DESK:    tMap("cellDesk"),
    WINDOW:  tMap("cellWindow"),
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">{t("title")}</h1>

      {!hasContent ? (
        <div className="bg-white border border-slate-100 rounded-lg p-12">
          <Empty description={t("empty")} />
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-lg p-4 space-y-3">
          <p className="text-xs text-slate-400">{t("clickHint")}</p>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs">
            {legendTypes.map((type) => {
              const s = CELL_STYLE[type];
              return (
                <span key={type} className={`px-2 py-0.5 rounded border ${s.bg} ${s.border} ${s.text}`}>
                  {cellTypeLabels[type]}
                </span>
              );
            })}
          </div>

          {/* Grid */}
          <div className="overflow-auto">
            <div
              className="inline-grid gap-px bg-slate-100 p-1 rounded"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(48px, 1fr))` }}
            >
              {Array.from({ length: rows }, (_, r) =>
                Array.from({ length: cols }, (_, c) => {
                  const cell = getCell(r, c);
                  const style = safeGetStyle(cell.type);
                  const isSelected =
                    (cell.type === "SHELF" && cell.shelfId === selectedShelfId) ||
                    (cell.type === "CABINET" && cell.cabinetCode === selectedCabinet);
                  const isClickable = cell.type === "SHELF" || cell.type === "CABINET";
                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(cell)}
                      className={`h-12 flex items-center justify-center rounded border text-[10px] font-medium transition-all ${style.bg} ${style.border} ${style.text} ${style.cursor} ${
                        isSelected ? "ring-2 ring-blue-500 ring-offset-1 !bg-blue-100" : ""
                      } ${isClickable ? "hover:opacity-80 hover:ring-2 hover:ring-blue-300" : ""}`}
                    >
                      <span className="truncate px-1 text-center leading-tight">
                        {cell.label ?? (cell.type !== "EMPTY" ? (cellTypeLabels[cell.type as CellType] ?? cell.type) : "")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cabinet drawer */}
      <Drawer
        open={!!selectedCabinet}
        onClose={() => { setSelectedCabinet(null); setActiveCabinetShelf(null); setCabinetSearch(""); }}
        title={t("cabinetTitle", { code: selectedCabinet ?? "" })}
        size={400}
        placement="right"
      >
        <div className="space-y-5">
          {cabinetLoading ? (
            <div className="flex justify-center py-8"><Spin /></div>
          ) : cabinetShelves.length === 0 ? (
            <Empty description={t("noShelves")} />
          ) : (() => {
            // Group shelves by level
            const levelMap = new Map<number | null, ShelfRecord[]>();
            for (const shelf of cabinetShelves) {
              const key = shelf.level ?? null;
              if (!levelMap.has(key)) levelMap.set(key, []);
              levelMap.get(key)!.push(shelf);
            }
            return Array.from(levelMap.entries()).map(([lvl, shelves]) => (
              <div key={lvl ?? "none"} className="space-y-2">
                {/* Level header */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded px-2 py-0.5">
                    {lvl ? t("levelTag", { level: lvl, letter: levelLetter(lvl) }) : "—"}
                  </span>
                  <div className="flex-1 border-t border-slate-100" />
                </div>
                {/* Blocks in this level */}
                {shelves.map((shelf) => (
                  <div
                    key={shelf.id}
                    className={`border rounded-lg cursor-pointer transition-colors ${
                      activeCabinetShelf === shelf.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      setActiveCabinetShelf(activeCabinetShelf === shelf.id ? null : shelf.id);
                      setCabinetSearch("");
                    }}
                  >
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-blue-600 text-sm">{shelf.code}</span>
                        {shelf.block && (
                          <Tag className="border-0 bg-blue-50 text-blue-600 text-xs">
                            {t("blockTag", { block: shelf.block })}
                          </Tag>
                        )}
                        {shelf.label && <span className="text-xs text-slate-500">{shelf.label}</span>}
                      </div>
                      <span className="text-xs text-slate-400">
                        <BookOutlined className="mr-1" />
                        {t("booksCount", { count: shelf._count.books })}
                      </span>
                    </div>

                    {activeCabinetShelf === shelf.id && (
                      <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-2">
                        <Input
                          prefix={<SearchOutlined className="text-slate-300" />}
                          placeholder={t("searchBooks")}
                          size="small"
                          value={cabinetSearch}
                          onChange={(e) => setCabinetSearch(e.target.value)}
                          allowClear
                          onClick={(e) => e.stopPropagation()}
                        />
                        {cabinetShelfBooksLoading ? (
                          <div className="flex justify-center py-4"><Spin size="small" /></div>
                        ) : cabinetShelfBooks.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-2">{t("noBooksOnShelf")}</p>
                        ) : (
                          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                            {cabinetShelfBooks.map((book) => (
                              <div key={book.id} className="py-2">
                                <p className="font-medium text-slate-800 text-xs leading-snug">{book.titleKh ?? book.titleEn}</p>
                                {book.titleKh && book.titleEn && <p className="text-[11px] text-slate-400">{book.titleEn}</p>}
                                {book.author && <p className="text-[11px] text-slate-400">{book.author}</p>}
                                <span className={`text-[11px] font-medium ${book.availableCopies > 0 ? "text-green-600" : "text-red-400"}`}>
                                  {book.availableCopies}/{book.totalCopies}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
      </Drawer>

      {/* Individual shelf drawer */}
      <Drawer
        open={!!selectedShelfId}
        onClose={() => { setSelectedShelfId(null); setShelfSearch(""); }}
        title={selectedShelf
          ? `${selectedShelf.code}${selectedShelf.label ? ` — ${selectedShelf.label}` : ""}`
          : tMap("cellShelf")}
        size={360}
        placement="right"
      >
        <div className="space-y-3">
          {selectedShelf?.section && (
            <Tag className="border-0 bg-indigo-50 text-indigo-600">{selectedShelf.section}</Tag>
          )}
          <Input
            prefix={<SearchOutlined className="text-slate-300" />}
            placeholder={t("searchShelfBooks")}
            value={shelfSearch}
            onChange={(e) => setShelfSearch(e.target.value)}
            allowClear
          />
          {shelfBooksLoading ? (
            <div className="flex justify-center py-8"><Spin /></div>
          ) : shelfBooks.length === 0 ? (
            <Empty description={t("noBooksYet")} />
          ) : (
            <div className="divide-y divide-slate-100">
              {shelfBooks.map((book) => (
                <div key={book.id} className="py-3">
                  <p className="font-medium text-slate-800 text-sm leading-snug">{book.titleKh ?? book.titleEn}</p>
                  {book.titleKh && book.titleEn && <p className="text-xs text-slate-400">{book.titleEn}</p>}
                  {book.author && <p className="text-xs text-slate-400">{book.author}</p>}
                  <span className={`text-xs font-medium ${book.availableCopies > 0 ? "text-green-600" : "text-red-400"}`}>
                    <BookOutlined className="mr-0.5" />
                    {book.availableCopies}/{book.totalCopies}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
