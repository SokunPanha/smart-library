"use client";

import { useState, useMemo } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Popconfirm, App, Tag, Divider } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreAddOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/libs/utils/request";
import { useTableScroll } from "@/lib/hooks";
import type { ColumnsType } from "antd/es/table";

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

function levelLetter(level: number | null): string {
  if (!level || level < 1) return "—";
  return String.fromCharCode(64 + level);
}

export function ShelvesTab() {
  const { message } = App.useApp();
  const t = useTranslations("settings.shelves");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState<ShelfRecord | null>(null);
  const [open, setOpen] = useState(false);

  const [cabinetCode, setCabinetCode] = useState("");
  const [levelCount, setLevelCount] = useState(3);
  const [blockCount, setBlockCount] = useState(4);
  const { ref: tableRef, scrollY } = useTableScroll();

  const { data: shelves = [], isLoading } = useQuery<ShelfRecord[]>({
    queryKey: ["shelves"],
    queryFn: () => apiFetch<ShelfRecord[]>("/api/shelves"),
  });

  // Generate preview codes: cabinetCode + levelLetter + blockNumber
  // e.g. cabinet="10", levels=2, blocks=3 → 10A1, 10A2, 10A3, 10B1, 10B2, 10B3
  const previewCodes = useMemo(() => {
    const trimmed = cabinetCode.trim();
    if (!trimmed || levelCount < 1 || blockCount < 1) return [];
    const codes: string[] = [];
    for (let l = 1; l <= levelCount; l++) {
      const letter = String.fromCharCode(64 + l);
      for (let b = 1; b <= blockCount; b++) {
        codes.push(`${trimmed}${letter}${b}`);
      }
    }
    return codes;
  }, [cabinetCode, levelCount, blockCount]);

  const existingCodes = useMemo(() => new Set(shelves.map((s) => s.code)), [shelves]);
  const newCodes = previewCodes.filter((c) => !existingCodes.has(c));

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
      setCabinetCode("");
    },
    onError: (e: Error) => message.error(e.message),
  });

  const saveMutation = useMutation({
    mutationFn: (values: { code: string; label?: string; section?: string; cabinet?: string; level?: number; block?: number }) =>
      editing
        ? apiFetch(`/api/shelves/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) })
        : apiFetch("/api/shelves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }),
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
    onSuccess: () => { message.success(t("deletedSuccess")); qc.invalidateQueries({ queryKey: ["shelves"] }); },
    onError: (e: Error) => message.error(e.message),
  });

  function openAdd() { setEditing(null); form.resetFields(); setOpen(true); }
  function openEdit(s: ShelfRecord) {
    setEditing(s);
    form.setFieldsValue({ code: s.code, label: s.label, section: s.section, cabinet: s.cabinet, level: s.level, block: s.block });
    setOpen(true);
  }

  function handleBulkAdd() {
    if (newCodes.length === 0) { message.info(t("allCodesExist")); return; }
    const cabinetTrimmed = cabinetCode.trim();
    const toCreate: { code: string; cabinet: string; level: number; block: number }[] = [];
    for (let l = 1; l <= levelCount; l++) {
      const letter = String.fromCharCode(64 + l);
      for (let b = 1; b <= blockCount; b++) {
        const code = `${cabinetTrimmed}${letter}${b}`;
        toCreate.push({ code, cabinet: cabinetTrimmed, level: l, block: b });
      }
    }
    bulkMutation.mutate({ shelves: toCreate });
  }

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
      render: (v) => v ? <Tag className="border-0 bg-violet-50 text-violet-600">{v}</Tag> : <span className="text-slate-300">—</span>,
    },
    {
      title: t("colLevel"),
      dataIndex: "level",
      key: "level",
      render: (v: number | null) => v
        ? <span className="text-slate-600">{t("levelDisplay", { level: v, letter: levelLetter(v) })}</span>
        : <span className="text-slate-300">—</span>,
    },
    {
      title: t("colBlock"),
      dataIndex: "block",
      key: "block",
      render: (v: number | null) => v
        ? <span className="font-mono text-slate-600">{v}</span>
        : <span className="text-slate-300">—</span>,
    },
    {
      title: t("colLabel"),
      dataIndex: "label",
      key: "label",
      render: (v) => v ?? <span className="text-slate-300">—</span>,
    },
    {
      title: t("colSection"),
      dataIndex: "section",
      key: "section",
      responsive: ["xl"],
      render: (v) => v ? <Tag className="border-0 bg-indigo-50 text-indigo-600">{v}</Tag> : <span className="text-slate-300">—</span>,
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
            title={r._count.books > 0
              ? t("deleteHasBooks", { count: r._count.books })
              : t("deleteConfirm")}
            onConfirm={() => r._count.books === 0 && deleteMutation.mutate(r.id)}
            okText={tc("delete")} cancelText={tc("cancel")}
            disabled={r._count.books > 0}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={r._count.books > 0} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Cabinet Builder */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AppstoreAddOutlined className="text-violet-500" />
          <span className="font-medium text-slate-700 text-sm">{t("cabinetBuilder")}</span>
        </div>
        <p className="text-xs text-slate-400">{t("cabinetBuilderHint")}</p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t("cabinetCode")}</label>
            <Input
              placeholder="e.g. 10"
              value={cabinetCode}
              onChange={(e) => setCabinetCode(e.target.value)}
              className="w-28 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t("levels")}</label>
            <InputNumber min={1} max={26} value={levelCount} onChange={(v) => v && setLevelCount(v)} className="w-20" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t("blocksPerLevel")}</label>
            <InputNumber min={1} max={20} value={blockCount} onChange={(v) => v && setBlockCount(v)} className="w-20" />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={newCodes.length === 0}
            loading={bulkMutation.isPending}
            onClick={handleBulkAdd}
          >
            {t("addCabinet", { count: newCodes.length })}
          </Button>
        </div>

        {/* Preview — grouped by level */}
        {previewCodes.length > 0 && (
          <div className="space-y-1.5">
            {Array.from({ length: levelCount }, (_, li) => {
              const letter = String.fromCharCode(65 + li);
              const levelCodes = Array.from({ length: blockCount }, (_, bi) => `${cabinetCode.trim()}${letter}${bi + 1}`);
              return (
                <div key={letter} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-400 w-6 text-right">{letter}</span>
                  {levelCodes.map((code) => (
                    <span
                      key={code}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-medium border ${
                        existingCodes.has(code)
                          ? "bg-slate-100 border-slate-200 text-slate-400 line-through"
                          : "bg-violet-50 border-violet-200 text-violet-700"
                      }`}
                    >
                      {code}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Divider className="my-0" />

      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{t("total", { count: shelves.length })}</p>
        <Button icon={<PlusOutlined />} onClick={openAdd}>{t("addSingle")}</Button>
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

      {/* Add / Edit modal */}
      <Modal
        open={open}
        title={editing ? t("editTitle") : t("addTitle")}
        onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }}
        onOk={() => form.submit()}
        okText={tc("save")}
        cancelText={tc("cancel")}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate} className="mt-4">
          <Form.Item name="code" label={t("codeLabel")} rules={[{ required: true }]} extra={t("codeExtra")}>
            <Input placeholder="10A1" className="font-mono" />
          </Form.Item>
          <div className="flex gap-3">
            <Form.Item name="cabinet" label={t("colCabinet")} className="flex-1" extra={t("cabinetExtra")}>
              <Input placeholder="10" className="font-mono" />
            </Form.Item>
            <Form.Item name="level" label={t("colLevel")} className="flex-1" extra={t("levelExtra")}>
              <InputNumber className="w-full" min={1} max={26} placeholder="1" />
            </Form.Item>
            <Form.Item name="block" label={t("colBlock")} className="flex-1" extra={t("blockExtra")}>
              <InputNumber className="w-full" min={1} max={20} placeholder="1" />
            </Form.Item>
          </div>
          <Form.Item name="label" label={t("labelLabel")} extra={t("labelExtra")}>
            <Input />
          </Form.Item>
          <Form.Item name="section" label={t("sectionLabel")} extra={t("sectionExtra")}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
