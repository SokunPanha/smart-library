"use client";

import { useState, useCallback, useEffect } from "react";
import { Button, InputNumber, Modal, Input, Form, App, Select } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/request";
import { type CellType, type MapCell, PALETTE } from "@/components/library-map/types";

interface LibraryMapData {
  id: string;
  rows: number;
  cols: number;
  cells: MapCell[];
}

interface ShelfRecord {
  id: string;
  code: string;
  cabinet: string | null;
  label: string | null;
  section: string | null;
  _count: { books: number };
}

const CELL_STYLE: Record<CellType, { bg: string; border: string; text: string }> = {
  EMPTY:   { bg: "bg-white",       border: "border-slate-200",  text: "text-slate-200"  },
  CABINET: { bg: "bg-violet-50",   border: "border-violet-300", text: "text-violet-700" },
  SHELF:   { bg: "bg-blue-50",     border: "border-blue-300",   text: "text-blue-700"   },
  WALL:    { bg: "bg-slate-700",   border: "border-slate-800",  text: "text-slate-400"  },
  DOOR:    { bg: "bg-green-100",   border: "border-green-400",  text: "text-green-700"  },
  TABLE:   { bg: "bg-amber-50",    border: "border-amber-300",  text: "text-amber-700"  },
  DESK:    { bg: "bg-orange-100",  border: "border-orange-400", text: "text-orange-700" },
  WINDOW:  { bg: "bg-sky-50",      border: "border-sky-300",    text: "text-sky-600"    },
};

function safeGetStyle(type: string) {
  return CELL_STYLE[type as CellType] ?? CELL_STYLE.EMPTY;
}

export function LibraryMapTab() {
  const { message } = App.useApp();
  const t = useTranslations("settings.libraryMap");
  const tc = useTranslations("common");
  const qc = useQueryClient();

  const [activeTool, setActiveTool] = useState<CellType>("CABINET");
  const [cells, setCells] = useState<MapCell[]>([]);
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(12);
  const [painting, setPainting] = useState(false);

  const [cabinetModal, setCabinetModal] = useState<{ row: number; col: number } | null>(null);
  const [cabinetForm] = Form.useForm();

  const [shelfModal, setShelfModal] = useState<{ row: number; col: number } | null>(null);
  const [shelfForm] = Form.useForm();

  const CELL_LABELS: Record<CellType, string> = {
    EMPTY:   t("cellEmpty"),
    CABINET: t("cellCabinet"),
    SHELF:   t("cellShelf"),
    WALL:    t("cellWall"),
    DOOR:    t("cellDoor"),
    TABLE:   t("cellTable"),
    DESK:    t("cellDesk"),
    WINDOW:  t("cellWindow"),
  };

  const { data: mapData, isLoading } = useQuery<LibraryMapData>({
    queryKey: ["library-map"],
    queryFn: () => apiFetch<LibraryMapData>("/api/library-map"),
  });

  useEffect(() => {
    if (!mapData) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCells(mapData.cells ?? []);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(mapData.rows);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCols(mapData.cols);
  }, [mapData]);

  const { data: shelves = [] } = useQuery<ShelfRecord[]>({
    queryKey: ["shelves"],
    queryFn: () => apiFetch<ShelfRecord[]>("/api/shelves"),
  });

  const cabinetOptions = [...new Set(shelves.map((s) => s.cabinet).filter(Boolean))].sort().map((c) => ({
    value: c!,
    label: `${t("cellCabinet")} ${c}`,
  }));

  const saveMutation = useMutation({
    mutationFn: () => apiFetch("/api/library-map", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, cols, cells }),
    }),
    onSuccess: () => {
      message.success(t("savedSuccess"));
      qc.invalidateQueries({ queryKey: ["library-map"] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  function getCell(row: number, col: number): MapCell {
    return cells.find((c) => c.row === row && c.col === col) ?? { row, col, type: "EMPTY" };
  }

  function applyTool(row: number, col: number) {
    if (activeTool === "CABINET") { setCabinetModal({ row, col }); return; }
    if (activeTool === "SHELF") { setShelfModal({ row, col }); return; }
    setCells((prev) => {
      const filtered = prev.filter((c) => !(c.row === row && c.col === col));
      if (activeTool === "EMPTY") return filtered;
      return [...filtered, { row, col, type: activeTool }];
    });
  }

  function handleCabinetConfirm(values: { cabinetCode: string }) {
    if (!cabinetModal) return;
    setCells((prev) => {
      const filtered = prev.filter((c) => !(c.row === cabinetModal.row && c.col === cabinetModal.col));
      return [...filtered, {
        row: cabinetModal.row,
        col: cabinetModal.col,
        type: "CABINET",
        cabinetCode: values.cabinetCode,
        label: `${t("cellCabinet")} ${values.cabinetCode}`,
      }];
    });
    setCabinetModal(null);
    cabinetForm.resetFields();
  }

  function handleShelfConfirm(values: { shelfId: string }) {
    if (!shelfModal) return;
    const shelf = shelves.find((s) => s.id === values.shelfId);
    setCells((prev) => {
      const filtered = prev.filter((c) => !(c.row === shelfModal.row && c.col === shelfModal.col));
      return [...filtered, { row: shelfModal.row, col: shelfModal.col, type: "SHELF", shelfId: shelf?.id, label: shelf?.code }];
    });
    setShelfModal(null);
    shelfForm.resetFields();
  }

  const handleMouseDown = useCallback((row: number, col: number) => {
    setPainting(true);
    applyTool(row, col);
  }, [activeTool, cells, shelves]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (!painting || activeTool === "CABINET" || activeTool === "SHELF") return;
    applyTool(row, col);
  }, [painting, activeTool, cells]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Palette */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-400 mr-1">{t("tool")}</span>
        {PALETTE.map((type) => {
          const style = CELL_STYLE[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveTool(type)}
              className={`px-3 py-1 rounded border text-xs font-medium transition-all ${style.bg} ${style.border} ${style.text} ${
                activeTool === type ? "ring-2 ring-blue-500 ring-offset-1" : "opacity-70 hover:opacity-100"
              }`}
            >
              {CELL_LABELS[type]}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400">{t("rows")}</span>
          <InputNumber size="small" min={4} max={20} value={rows} onChange={(v) => v && setRows(v)} className="w-16" />
          <span className="text-xs text-slate-400">{t("cols")}</span>
          <InputNumber size="small" min={4} max={24} value={cols} onChange={(v) => v && setCols(v)} className="w-16" />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-slate-400 text-sm">{t("loading")}</div>
      ) : (
        <div
          className="border border-slate-200 rounded-lg overflow-auto select-none"
          onMouseUp={() => setPainting(false)}
          onMouseLeave={() => setPainting(false)}
        >
          <div
            className="inline-grid gap-px bg-slate-100 p-1"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(44px, 1fr))` }}
          >
            {Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols }, (_, c) => {
                const cell = getCell(r, c);
                const style = safeGetStyle(cell.type);
                return (
                  <div
                    key={`${r}-${c}`}
                    onMouseDown={() => handleMouseDown(r, c)}
                    onMouseEnter={() => handleMouseEnter(r, c)}
                    className={`h-11 flex items-center justify-center rounded text-xs font-medium border cursor-pointer transition-colors ${style.bg} ${style.border} ${style.text} hover:opacity-80`}
                  >
                    {cell.type !== "EMPTY" && (
                      <span className="truncate px-1 text-center leading-tight text-[10px]">
                        {cell.label ?? CELL_LABELS[cell.type as CellType] ?? cell.type}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {PALETTE.filter((t) => t !== "EMPTY").map((type) => {
          const style = CELL_STYLE[type];
          return (
            <div key={type} className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${style.bg} ${style.border} ${style.text}`}>
              {CELL_LABELS[type]}
            </div>
          );
        })}
      </div>

      <Button
        type="primary"
        icon={<SaveOutlined />}
        loading={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        {t("saveMap")}
      </Button>

      {/* Cabinet picker modal */}
      <Modal
        open={!!cabinetModal}
        title={t("placeCabinetTitle")}
        onCancel={() => { setCabinetModal(null); cabinetForm.resetFields(); }}
        onOk={() => cabinetForm.submit()}
        okText={tc("confirm")}
        cancelText={tc("cancel")}
        destroyOnHidden
      >
        <Form form={cabinetForm} onFinish={handleCabinetConfirm} layout="vertical" className="mt-4">
          <Form.Item name="cabinetCode" label={t("cabinetCodeLabel")} rules={[{ required: true }]}>
            {cabinetOptions.length > 0 ? (
              <Select
                showSearch
                allowClear
                placeholder={t("cabinetSelectPlaceholder")}
                optionFilterProp="label"
                options={cabinetOptions}
                popupRender={(menu) => (
                  <>
                    {menu}
                    <div className="px-3 py-2 border-t border-slate-100">
                      <Input
                        placeholder={t("cabinetTypeNew")}
                        className="font-mono"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) cabinetForm.setFieldValue("cabinetCode", val);
                          }
                        }}
                      />
                    </div>
                  </>
                )}
              />
            ) : (
              <Input placeholder="e.g. 10" className="font-mono" />
            )}
          </Form.Item>
          <p className="text-xs text-slate-400">{t("cabinetHint")}</p>
        </Form>
      </Modal>

      {/* Shelf picker modal */}
      <Modal
        open={!!shelfModal}
        title={t("placeShelfTitle")}
        onCancel={() => { setShelfModal(null); shelfForm.resetFields(); }}
        onOk={() => shelfForm.submit()}
        okText={tc("confirm")}
        cancelText={tc("cancel")}
        destroyOnHidden
      >
        <Form form={shelfForm} onFinish={handleShelfConfirm} layout="vertical" className="mt-4">
          <Form.Item name="shelfId" label={t("selectShelfLabel")} rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder={t("shelfPickPlaceholder")}
              optionFilterProp="label"
              options={shelves.map((s) => ({
                value: s.id,
                label: `${s.code}${s.label ? ` — ${s.label}` : ""}${s.section ? ` (${s.section})` : ""}`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
