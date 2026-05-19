"use client";

import { useState } from "react";
import { Modal, Input, Button, Spin, App } from "antd";
import { QrcodeOutlined, SearchOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/libs/utils/request";
import { QrScanner } from "./QrScanner";

interface BookResult {
  id: string;
  titleKh: string | null;
  titleEn: string | null;
  author: string | null;
}

interface Props {
  logId: string;
  memberName: string;
  currentBook?: { titleKh: string | null; titleEn: string | null } | null;
  onClose: () => void;
}

export function LinkBookModal({ logId, memberName, currentBook, onClose }: Props) {
  const t = useTranslations("visitorLog");
  const { message } = App.useApp();
  const qc = useQueryClient();

  const [showScanner, setShowScanner] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<BookResult[]>([]);
  const [selected, setSelected] = useState<BookResult | null>(null);

  const linkMutation = useMutation({
    mutationFn: (bookId: string | null) =>
      apiFetch(`/api/visitor-log/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "linkBook", bookId }),
      }),
    onSuccess: () => {
      message.success(t("bookLinked", { title: selected?.titleKh ?? selected?.titleEn ?? "" }));
      qc.invalidateQueries({ queryKey: ["visitor-log"] });
      onClose();
    },
    onError: (e: Error) => message.error(e.message),
  });

  async function searchBooks(query: string) {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await apiFetch<{ books: BookResult[] }>(`/api/books?search=${encodeURIComponent(query)}&limit=10`);
      setResults(res.books ?? []);
    } finally {
      setSearching(false);
    }
  }

  async function resolveByQr(qrValue: string) {
    setShowScanner(false);
    setSearching(true);
    try {
      // Book QR codes encode the book id (CUID — no hyphens, ~25 chars)
      const looksLikeCuid = !qrValue.includes("-") && qrValue.length > 10;
      if (looksLikeCuid) {
        const book = await apiFetch<BookResult>(`/api/books/${qrValue}`);
        setSelected(book);
        setResults([book]);
      } else {
        const res = await apiFetch<{ books: BookResult[] }>(`/api/books?search=${encodeURIComponent(qrValue)}&limit=1`);
        const book = res.books?.[0];
        if (!book) { message.warning("Book not found"); return; }
        setSelected(book);
        setResults([book]);
      }
    } catch {
      message.warning("Book not found");
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <Modal
        open
        title={`${t("scanBook")} — ${memberName}`}
        onCancel={onClose}
        footer={null}
        width={420}
        destroyOnHidden
      >
        <div className="space-y-3 mt-2">
          {currentBook && (
            <p className="text-xs text-slate-400">
              {t("bookLinked", { title: currentBook.titleKh ?? currentBook.titleEn ?? "" })}
            </p>
          )}

          {/* Search row */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by title, ISBN…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onPressEnter={() => searchBooks(searchVal)}
              allowClear
              className="flex-1"
            />
            <Button icon={<SearchOutlined />} onClick={() => searchBooks(searchVal)} />
            <Button icon={<QrcodeOutlined />} onClick={() => setShowScanner(true)} />
          </div>

          {searching && <Spin size="small" />}

          {/* Results */}
          {results.length > 0 && (
            <div className="border border-slate-200 rounded divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {results.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelected(b)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    selected?.id === b.id ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <p className="font-medium text-slate-800 leading-snug">{b.titleKh ?? b.titleEn}</p>
                  {b.titleKh && b.titleEn && <p className="text-xs text-slate-400">{b.titleEn}</p>}
                  {b.author && <p className="text-xs text-slate-400">{b.author}</p>}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              disabled={!selected}
              loading={linkMutation.isPending}
              onClick={() => selected && linkMutation.mutate(selected.id)}
            >
              Link Book
            </Button>
          </div>
        </div>
      </Modal>

      {showScanner && (
        <QrScanner
          title={t("scanBook")}
          onScan={resolveByQr}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
