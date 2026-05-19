"use client";

import { useState, useRef } from "react";
import { Modal, Button, Table, Tag, Alert, Progress, Upload, App } from "antd";
import { DownloadOutlined, UploadOutlined, InboxOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import type { ColumnsType } from "antd/es/table";
import { apiFetch } from "@/lib/request";
import { downloadBookTemplate, parseBookImportFile, type BookImportRow } from "@/lib/excel";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "upload" | "preview" | "done";

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export function BulkImportModal({ open, onClose, onSuccess }: Props) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const { message } = App.useApp();

  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<BookImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((r) => !r._error);
  const errorRows = rows.filter((r) => r._error);

  function reset() {
    setStep("upload");
    setRows([]);
    setResult(null);
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      message.error(t("bulkImport.invalidFileType"));
      return;
    }
    try {
      const parsed = await parseBookImportFile(file);
      if (parsed.length === 0) {
        message.warning(t("bulkImport.emptyFile"));
        return;
      }
      setRows(parsed);
      setStep("preview");
    } catch {
      message.error(t("bulkImport.parseError"));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setLoading(true);
    try {
      const res = await apiFetch<ImportResult>("/api/books/bulk", {
        method: "POST",
        body: JSON.stringify({
          books: validRows.map((r) => ({
            titleKh: r.titleKh,
            titleEn: r.titleEn,
            author: r.author,
            publisher: r.publisher,
            publishYear: r.publishYear,
            category: r.category,
            isbn: r.isbn,
            deweyCode: r.deweyCode,
            totalCopies: r.totalCopies,
            tags: r.tags,
          })),
        }),
      });
      setResult(res);
      setStep("done");
      onSuccess();
    } catch {
      message.error(t("bulkImport.importError"));
    } finally {
      setLoading(false);
    }
  }

  const previewColumns: ColumnsType<BookImportRow> = [
    {
      title: "#",
      key: "row",
      width: 44,
      render: (_, r) => <span className="text-slate-400 text-xs">{r._row}</span>,
    },
    {
      title: t("bulkImport.colTitleKh"),
      key: "titleKh",
      render: (_, r) => <span className="text-slate-800">{r.titleKh ?? <span className="text-slate-300">—</span>}</span>,
    },
    {
      title: t("bulkImport.colTitleEn"),
      key: "titleEn",
      render: (_, r) => <span className="text-slate-600 text-sm">{r.titleEn ?? <span className="text-slate-300">—</span>}</span>,
    },
    {
      title: t("bulkImport.colAuthor"),
      key: "author",
      render: (_, r) => <span className="text-slate-500 text-sm">{r.author ?? "—"}</span>,
    },
    {
      title: t("bulkImport.colCopies"),
      key: "totalCopies",
      width: 70,
      render: (_, r) => <span className="text-slate-600 text-sm">{r.totalCopies}</span>,
    },
    {
      title: t("bulkImport.colISBN"),
      key: "isbn",
      render: (_, r) => <span className="font-mono text-xs text-slate-400">{r.isbn ?? "—"}</span>,
    },
    {
      title: tc("status"),
      key: "status",
      width: 100,
      render: (_, r) =>
        r._error ? (
          <Tag color="error" className="border-0 text-xs">{r._error}</Tag>
        ) : (
          <Tag color="success" className="border-0 text-xs">{t("bulkImport.valid")}</Tag>
        ),
    },
  ];

  return (
    <Modal
      title={t("bulkImport.title")}
      open={open}
      onCancel={handleClose}
      width={step === "preview" ? 860 : 480}
      footer={null}
      destroyOnHidden
    >
      {/* ── Step 1: Upload ── */}
      {step === "upload" && (
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-500">{t("bulkImport.instructions")}</p>
          <Button icon={<DownloadOutlined />} onClick={downloadBookTemplate}>
            {t("bulkImport.downloadTemplate")}
          </Button>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
              dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
            }`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <InboxOutlined className="text-4xl text-slate-300 mb-2 block" />
            <p className="text-slate-600 font-medium">{t("bulkImport.dropHint")}</p>
            <p className="text-xs text-slate-400 mt-1">{t("bulkImport.fileTypes")}</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === "preview" && (
        <div className="space-y-3 py-2">
          <div className="flex gap-3 flex-wrap">
            <Tag color="success" className="border-0">{t("bulkImport.validCount", { count: validRows.length })}</Tag>
            {errorRows.length > 0 && (
              <Tag color="error" className="border-0">{t("bulkImport.errorCount", { count: errorRows.length })}</Tag>
            )}
          </div>

          {errorRows.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={t("bulkImport.errorRowsWarning")}
              className="text-sm"
            />
          )}

          <Table
            columns={previewColumns}
            dataSource={rows}
            rowKey="_row"
            size="small"
            scroll={{ x: "max-content", y: 340 }}
            pagination={false}
            rowClassName={(r) => (r._error ? "bg-red-50" : "")}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={reset}>{tc("back")}</Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleImport}
              loading={loading}
              disabled={validRows.length === 0}
            >
              {t("bulkImport.importCount", { count: validRows.length })}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ── */}
      {step === "done" && result && (
        <div className="py-6 space-y-4 text-center">
          <CheckCircleOutlined className="text-5xl text-green-500" />
          <p className="text-lg font-semibold text-slate-800">{t("bulkImport.doneTitle")}</p>
          <div className="flex justify-center gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold text-green-600">{result.created}</p>
              <p className="text-slate-500">{t("bulkImport.created")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-400">{result.skipped}</p>
              <p className="text-slate-500">{t("bulkImport.skipped")}</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={result.errors.join(" · ")}
              className="text-sm text-left"
            />
          )}
          <div className="flex justify-center gap-2 pt-2">
            <Button onClick={reset}>{t("bulkImport.importMore")}</Button>
            <Button type="primary" onClick={handleClose}>{tc("close")}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
