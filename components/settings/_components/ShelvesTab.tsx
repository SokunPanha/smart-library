"use client";

import { useState, useMemo } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Checkbox, Popconfirm, App, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreAddOutlined, PrinterOutlined } from "@ant-design/icons";
import { PrintShelvesModal } from "./PrintShelvesModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/request";
import { useTableScroll } from "@/lib/hooks";
import type { ColumnsType } from "antd/es/table";

interface ShelfRecord {
  id: string;
  code: string;
  label: string | null;
  zone: string | null;
  cabinet: string;
  side: string | null;
  shelfNo: number;
  sectionNo: number;
  _count: { books: number };
}

function buildCode(
  cabinet: string,
  side: string | null | undefined,
  shelfNo: number,
  sectionNo: number
): string {
  const parts: string[] = [cabinet.trim().toUpperCase()];
  if (side?.trim()) parts.push(side.trim().toUpperCase());
  parts.push(String(shelfNo), String(sectionNo));
  return parts.join("-");
}

export function ShelvesTab() {
  const { message } = App.useApp();
  const t = useTranslations("settings.shelves");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState<ShelfRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  // Cabinet Builder state
  const [cabinetName, setCabinetName] = useState("");
  const [doubleSided, setDoubleSided] = useState(false);
  const [frontLabel, setFrontLabel] = useState("L");
  const [rearLabel, setRearLabel] = useState("R");
  const [shelfCount, setShelfCount] = useState(3);
  const [sectionsPerShelf, setSectionsPerShelf] = useState(3);
  const [builderZone, setBuilderZone] = useState("");
  // slotId = "${side ?? ''}-${shelfNo}-${originalSectionNo}" — stable across renumbering
  const [removedSlots, setRemovedSlots] = useState<Set<string>>(new Set());

  // Add/Edit modal — watch fields to compute code preview
  const [editCabinet, setEditCabinet] = useState("");
  const [editSide, setEditSide] = useState("");
  const [editShelfNo, setEditShelfNo] = useState(1);
  const [editSectionNo, setEditSectionNo] = useState(1);

  const { ref: tableRef, scrollY } = useTableScroll();

  const { data: shelves = [], isLoading } = useQuery<ShelfRecord[]>({
    queryKey: ["shelves"],
    queryFn: () => apiFetch<ShelfRecord[]>("/api/shelves"),
  });

  const existingCodes = useMemo(() => new Set(shelves.map((s) => s.code)), [shelves]);

  // Generate preview codes for the cabinet builder
  const previewEntries = useMemo(() => {
    const trimmed = cabinetName.trim().toUpperCase();
    if (!trimmed || shelfCount < 1 || sectionsPerShelf < 1) return [];
    const sides = doubleSided ? [frontLabel.trim() || "F", rearLabel.trim() || "R"] : [null];
    const entries: { code: string; cabinet: string; side: string | null; shelfNo: number; sectionNo: number }[] = [];
    for (const side of sides) {
      for (let sh = 1; sh <= shelfCount; sh++) {
        for (let sec = 1; sec <= sectionsPerShelf; sec++) {
          const code = buildCode(trimmed, side, sh, sec);
          entries.push({ code, cabinet: trimmed, side: side ?? null, shelfNo: sh, sectionNo: sec });
        }
      }
    }
    return entries;
  }, [cabinetName, doubleSided, frontLabel, rearLabel, shelfCount, sectionsPerShelf]);

  // After removals, renumber remaining sections so gaps are closed (1,2,3… always)
  const effectiveEntries = useMemo(() => {
    const grouped = new Map<string, typeof previewEntries>();
    for (const e of previewEntries) {
      const key = `${e.side ?? ""}|${e.shelfNo}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(e);
    }
    const result: { slotId: string; cabinet: string; side: string | null; shelfNo: number; sectionNo: number; code: string }[] = [];
    for (const group of grouped.values()) {
      const kept = group.filter(
        (e) => !removedSlots.has(`${e.side ?? ""}-${e.shelfNo}-${e.sectionNo}`)
      );
      kept.forEach((e, idx) => {
        const newSecNo = idx + 1;
        result.push({
          slotId: `${e.side ?? ""}-${e.shelfNo}-${e.sectionNo}`,
          cabinet: e.cabinet,
          side: e.side,
          shelfNo: e.shelfNo,
          sectionNo: newSecNo,
          code: buildCode(e.cabinet, e.side, e.shelfNo, newSecNo),
        });
      });
    }
    return result;
  }, [previewEntries, removedSlots]);

  const newEntries = effectiveEntries.filter((e) => !existingCodes.has(e.code));

  const bulkMutation = useMutation({
    mutationFn: (data: object) =>
      apiFetch<{ created: number; skipped: number }>("/api/shelves/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      const base = t("addedSuccess", { count: data.created });
      const suffix = data.skipped ? t("addedSkippedSuffix", { count: data.skipped }) : "";
      message.success(base + suffix);
      qc.invalidateQueries({ queryKey: ["shelves"] });
      setCabinetName("");
      setRemovedSlots(new Set());
      setBuilderOpen(false);
    },
    onError: (e: Error) => message.error(e.message),
  });

  const saveMutation = useMutation({
    mutationFn: (values: {
      code: string; cabinet: string; side?: string | null;
      shelfNo: number; sectionNo: number; zone?: string | null; label?: string | null;
    }) =>
      editing
        ? apiFetch(`/api/shelves/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          })
        : apiFetch("/api/shelves", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          }),
    onSuccess: () => {
      message.success(editing ? t("updatedSuccess") : t("addedSingleSuccess"));
      qc.invalidateQueries({ queryKey: ["shelves"] });
      setOpen(false);
      setEditing(null);
      form.resetFields();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/shelves/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      message.success(t("deletedSuccess"));
      qc.invalidateQueries({ queryKey: ["shelves"] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  function openAdd() {
    setEditing(null);
    setEditCabinet("");
    setEditSide("");
    setEditShelfNo(1);
    setEditSectionNo(1);
    setOpen(true);
  }

  function openEdit(s: ShelfRecord) {
    setEditing(s);
    setEditCabinet(s.cabinet);
    setEditSide(s.side ?? "");
    setEditShelfNo(s.shelfNo);
    setEditSectionNo(s.sectionNo);
    form.setFieldsValue({
      cabinet: s.cabinet,
      side: s.side ?? "",
      shelfNo: s.shelfNo,
      sectionNo: s.sectionNo,
      zone: s.zone,
      label: s.label,
    });
    setOpen(true);
  }

  function handleBulkAdd() {
    if (newEntries.length === 0) {
      message.info(t("allCodesExist"));
      return;
    }
    const zone = builderZone.trim() || undefined;
    const toCreate = newEntries.map((e) => ({ ...e, zone: zone ?? null }));
    bulkMutation.mutate({ shelves: toCreate });
  }

  function handleFormFinish(values: {
    cabinet: string; side?: string; shelfNo: number; sectionNo: number;
    zone?: string; label?: string;
  }) {
    const code = buildCode(
      values.cabinet,
      values.side ?? null,
      values.shelfNo,
      values.sectionNo
    );
    saveMutation.mutate({
      code,
      cabinet: values.cabinet.trim().toUpperCase(),
      side: values.side?.trim().toUpperCase() || null,
      shelfNo: values.shelfNo,
      sectionNo: values.sectionNo,
      zone: values.zone || null,
      label: values.label || null,
    });
  }

  // Computed code preview for the modal
  const modalPreviewCode = buildCode(
    editCabinet || "?",
    editSide || null,
    editShelfNo || 1,
    editSectionNo || 1
  );

  const columns: ColumnsType<ShelfRecord> = [
    {
      title: t("colCode"),
      dataIndex: "code",
      key: "code",
      render: (v) => <span className="font-mono font-semibold text-blue-600">{v}</span>,
    },
    {
      title: t("colCabinet"),
      dataIndex: "cabinet",
      key: "cabinet",
      render: (v) => <Tag className="border-0 bg-violet-50 text-violet-600">{v}</Tag>,
    },
    {
      title: t("colSide"),
      dataIndex: "side",
      key: "side",
      render: (v: string | null) =>
        v ? (
          <Tag className="border-0 bg-slate-100 text-slate-600">{v}</Tag>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: t("colShelf"),
      dataIndex: "shelfNo",
      key: "shelfNo",
      render: (v: number) => <span className="font-mono text-slate-600">{v}</span>,
    },
    {
      title: t("colSection"),
      dataIndex: "sectionNo",
      key: "sectionNo",
      render: (v: number) => <span className="font-mono text-slate-600">{v}</span>,
    },
    {
      title: t("colZone"),
      dataIndex: "zone",
      key: "zone",
      responsive: ["xl"],
      render: (v) =>
        v ? (
          <Tag className="border-0 bg-indigo-50 text-indigo-600">{v}</Tag>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: t("colLabel"),
      dataIndex: "label",
      key: "label",
      render: (v) => v ?? <span className="text-slate-300">—</span>,
    },
    {
      title: t("colBooks"),
      key: "books",
      render: (_, r) => <span className="text-slate-500">{r._count.books}</span>,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, r) => (
        <div className="flex gap-1">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title={
              r._count.books > 0
                ? t("deleteHasBooks", { count: r._count.books })
                : t("deleteConfirm")
            }
            onConfirm={() => r._count.books === 0 && deleteMutation.mutate(r.id)}
            okText={tc("delete")}
            cancelText={tc("cancel")}
            disabled={r._count.books > 0}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={r._count.books > 0}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // Group preview entries by side for visual display
  const previewSides = doubleSided
    ? [frontLabel.trim() || "L", rearLabel.trim() || "R"]
    : [null];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{t("total", { count: shelves.length })}</p>
        <div className="flex gap-2">
          <Button icon={<AppstoreAddOutlined />} onClick={() => setBuilderOpen(true)}>
            {t("cabinetBuilder")}
          </Button>
          <Button icon={<PrinterOutlined />} onClick={() => setPrintOpen(true)} disabled={shelves.length === 0}>
            {t("printBtn")}
          </Button>
          <Button icon={<PlusOutlined />} onClick={openAdd}>
            {t("addSingle")}
          </Button>
        </div>
      </div>

      <div ref={tableRef}>
        <Table
          dataSource={shelves}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={{ pageSize: 15, showSizeChanger: false, hideOnSinglePage: true }}
          locale={{ emptyText: t("empty") }}
          scroll={{ x: "max-content", y: scrollY }}
        />
      </div>

      <PrintShelvesModal open={printOpen} onClose={() => setPrintOpen(false)} shelves={shelves} />

      {/* Cabinet Builder modal */}
      <Modal
        
        open={builderOpen}
        title={
          <span className="flex items-center gap-2">
            <AppstoreAddOutlined className="text-violet-500" />
            {t("cabinetBuilder")}
          </span>
        }
        onCancel={() => setBuilderOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setBuilderOpen(false)}>{tc("cancel")}</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={newEntries.length === 0}
              loading={bulkMutation.isPending}
              onClick={handleBulkAdd}
            >
              {t("addCabinet", { count: newEntries.length })}
            </Button>
          </div>
        }
        width={700}
        destroyOnHidden
      >
        <div className="space-y-4 py-2">
          {/* Hint + code anatomy */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-xs text-slate-400 shrink-0">{t("cabinetBuilderHint")}</p>
            <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
              {(
                [
                  { seg: "A",   label: t("colCabinet"), sub: "A, B, C…"              },
                  { seg: "L/R", label: t("colSide"),    sub: t("codeFormatOptional") },
                  { seg: "2",   label: t("colShelf"),   sub: t("shelfNoExtra")       },
                  { seg: "3",   label: t("colSection"), sub: t("sectionNoExtra")     },
                ] as const
              ).map(({ seg, label, sub }, i, arr) => (
                <div key={seg} className="flex items-center gap-x-1">
                  <div className="flex flex-col items-center gap-0.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-violet-50 border border-violet-200 text-violet-700 font-mono font-semibold text-xs">{seg}</span>
                    <span className="text-[10px] font-medium text-slate-600 leading-tight">{label}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">{sub}</span>
                  </div>
                  {i < arr.length - 1 && <span className="text-slate-300 text-sm mb-5">–</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t("cabinetName")}</label>
              <Input
                placeholder="e.g. A"
                value={cabinetName}
                onChange={(e) => setCabinetName(e.target.value)}
                className="w-20 font-mono"
              />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Checkbox checked={doubleSided} onChange={(e) => setDoubleSided(e.target.checked)}>
                <span className="text-xs text-slate-600">{t("doubleSided")}</span>
              </Checkbox>
            </div>
            {doubleSided && (
              <>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t("frontLabel")}</label>
                  <Input value={frontLabel} onChange={(e) => setFrontLabel(e.target.value)} className="w-16 font-mono" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t("rearLabel")}</label>
                  <Input value={rearLabel} onChange={(e) => setRearLabel(e.target.value)} className="w-16 font-mono" />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t("shelves")}</label>
              <InputNumber min={1} max={20} value={shelfCount} onChange={(v) => v && setShelfCount(v)} className="w-20" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t("sectionsPerShelf")}</label>
              <InputNumber min={1} max={20} value={sectionsPerShelf} onChange={(v) => v && setSectionsPerShelf(v)} className="w-20" />
            </div>
            <div className="flex-1 min-w-35">
              <label className="block text-xs text-slate-500 mb-1">{t("zone")}</label>
              <Input placeholder="e.g. Science" value={builderZone} onChange={(e) => setBuilderZone(e.target.value)} className="w-full" />
            </div>
          </div>

          {/* Editable entry list — sections are renumbered live after removal */}
          {effectiveEntries.length > 0 && cabinetName.trim() && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              {previewSides.map((side, sideIdx) => {
                const sideLabel = side
                  ? `${side === (frontLabel.trim() || "L") ? t("frontLabel") : t("rearLabel")} (${side})`
                  : null;
                // shelves that still have at least one entry
                const shelvesWithEntries = Array.from(
                  new Set(effectiveEntries.filter(e => (side ? e.side === side : e.side === null)).map(e => e.shelfNo))
                ).sort((a, b) => a - b);
                if (shelvesWithEntries.length === 0) return null;
                return (
                  <div key={side ?? "single"}>
                    {previewSides.length > 1 && sideLabel && (
                      <div className={`px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 ${sideIdx > 0 ? "border-t border-slate-200" : ""}`}>
                        {sideLabel}
                      </div>
                    )}
                    {Array.from({ length: shelfCount }, (_, si) => {
                      const shelfNo = si + 1;
                      // effective entries for this shelf (already renumbered)
                      const rowEntries = effectiveEntries.filter(
                        (e) => (side ? e.side === side : e.side === null) && e.shelfNo === shelfNo
                      );
                      // original entries for this shelf (to build remove buttons)
                      const originalRow = previewEntries.filter(
                        (e) => (side ? e.side === side : e.side === null) && e.shelfNo === shelfNo
                      );
                      const removedInRow = originalRow.filter(
                        (e) => removedSlots.has(`${e.side ?? ""}-${e.shelfNo}-${e.sectionNo}`)
                      );
                      return (
                        <div key={si} className="flex items-start gap-2 px-3 py-1.5 border-t border-slate-100 first:border-t-0">
                          <span className="text-xs text-slate-400 w-12 shrink-0 pt-0.5">
                            {t("colShelf")} {shelfNo}
                          </span>
                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {rowEntries.map((e) => {
                              const isExisting = existingCodes.has(e.code);
                              return (
                                <span
                                  key={e.slotId}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium border ${
                                    isExisting
                                      ? "bg-slate-100 border-slate-200 text-slate-400"
                                      : "bg-violet-50 border-violet-200 text-violet-700"
                                  }`}
                                >
                                  {e.code}
                                  {!isExisting && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRemovedSlots((prev) => new Set([...prev, e.slotId]))
                                      }
                                      className="text-violet-400 hover:text-red-500 leading-none ml-0.5"
                                      aria-label={`Remove ${e.code}`}
                                    >
                                      ×
                                    </button>
                                  )}
                                  {isExisting && (
                                    <span className="text-slate-300 text-[10px] ml-0.5">↩</span>
                                  )}
                                </span>
                              );
                            })}
                            {removedInRow.map((e) => (
                              <span
                                key={e.code}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border border-dashed border-slate-200 text-slate-300 line-through"
                              >
                                {e.code}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRemovedSlots((prev) => {
                                      const next = new Set(prev);
                                      next.delete(`${e.side ?? ""}-${e.shelfNo}-${e.sectionNo}`);
                                      return next;
                                    })
                                  }
                                  className="text-slate-300 hover:text-violet-500 leading-none ml-0.5"
                                  aria-label={`Restore ${e.code}`}
                                >
                                  ↩
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                <span>{t("addCabinet", { count: newEntries.length })}</span>
                {removedSlots.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setRemovedSlots(new Set())}
                    className="text-violet-500 hover:text-violet-700"
                  >
                    {t("restoreAll")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Add / Edit modal */}
      <Modal
        open={open}
        title={editing ? t("editTitle") : t("addTitle")}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText={tc("save")}
        cancelText={tc("cancel")}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleFormFinish} className="mt-4">
          {/* Code preview (read-only) */}
          <Form.Item label={t("codeLabel")} extra={t("codeExtra")}>
            <Input
              value={modalPreviewCode}
              readOnly
              className="font-mono bg-slate-50 text-slate-600"
            />
          </Form.Item>

          <div className="flex gap-3">
            <Form.Item
              name="cabinet"
              label={t("colCabinet")}
              className="flex-1"
              rules={[{ required: true }]}
            >
              <Input
                placeholder="A"
                className="font-mono"
                onChange={(e) => setEditCabinet(e.target.value)}
              />
            </Form.Item>
            <Form.Item
              name="side"
              label={t("colSide")}
              className="flex-1"
              extra={t("sideExtra")}
            >
              <Input
                placeholder="L / R"
                className="font-mono"
                onChange={(e) => setEditSide(e.target.value)}
              />
            </Form.Item>
          </div>

          <div className="flex gap-3">
            <Form.Item
              name="shelfNo"
              label={t("shelfNoLabel")}
              className="flex-1"
              rules={[{ required: true }]}
              extra={t("shelfNoExtra")}
              initialValue={1}
            >
              <InputNumber
                className="w-full"
                min={1}
                max={99}
                onChange={(v) => v && setEditShelfNo(v)}
              />
            </Form.Item>
            <Form.Item
              name="sectionNo"
              label={t("sectionNoLabel")}
              className="flex-1"
              rules={[{ required: true }]}
              extra={t("sectionNoExtra")}
              initialValue={1}
            >
              <InputNumber
                className="w-full"
                min={1}
                max={99}
                onChange={(v) => v && setEditSectionNo(v)}
              />
            </Form.Item>
          </div>

          <Form.Item name="zone" label={t("zoneLabel")}>
            <Input />
          </Form.Item>

          <Form.Item name="label" label={t("labelLabel")}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
