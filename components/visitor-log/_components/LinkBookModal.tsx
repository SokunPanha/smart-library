"use client";

import { useState } from "react";
import { Modal, Input, Button, Spin, App } from "antd";
import { QrcodeOutlined, SearchOutlined, CloseOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/request";
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
  currentBooks: { id: string; titleKh: string | null; titleEn: string | null }[];
  onClose: () => void;
}

export function LinkBookModal({ logId, memberName, currentBooks, onClose }: Props) {
  const t = useTranslations("visitorLog");
  const tc = useTranslations("common");
  const { message } = App.useApp();
  const qc = useQueryClient();

  const [showScanner, setShowScanner] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<BookResult[]>([]);

  const addMutation = useMutation({
    mutationFn: (bookId: string) =>
      apiFetch(`/api/visitor-log/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addBook", bookId }),
      }),
    onSuccess: (_, bookId) => {
      const book = results.find((r) => r.id === bookId);
      message.success(t("bookLinked", { title: book?.titleKh ?? book?.titleEn ?? "" }));
      qc.invalidateQueries({ queryKey: ["visitor-log"] });
      setResults([]);
      setSearchVal("");
    },
    onError: (e: Error) => message.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (bookId: string) =>
      apiFetch(`/api/visitor-log/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeBook", bookId }),
      }),
    onSuccess: () => {
      message.success(t("bookRemoved"));
      qc.invalidateQueries({ queryKey: ["visitor-log"] });
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
      const looksLikeCuid = !qrValue.includes("-") && qrValue.length > 10;
      let book: BookResult | null = null;
      if (looksLikeCuid) {
        book = await apiFetch<BookResult>(`/api/books/${qrValue}`);
      } else {
        const res = await apiFetch<{ books: BookResult[] }>(`/api/books?search=${encodeURIComponent(qrValue)}&limit=1`);
        book = res.books?.[0] ?? null;
      }
      if (!book) { message.warning(t("bookNotFound")); return; }
      addMutation.mutate(book.id);
    } catch {
      message.warning(t("bookNotFound"));
    } finally {
      setSearching(false);
    }
  }

  const currentBookIds = new Set(currentBooks.map((b) => b.id));

  return (
    <>
      <Modal
        open
        title={`${t("manageBooks")} — ${memberName}`}
        onCancel={onClose}
        footer={null}
        width={440}
        mask={{ closable: false }}
        destroyOnHidden
      >
        <div className="space-y-4 mt-2">
          {/* Current books */}
          {currentBooks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 font-medium">{t("booksRead")}</p>
              <div className="flex flex-wrap gap-1.5">
                {currentBooks.map((b) => (
                  <span
                    key={b.id}
                    className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded px-2 py-0.5 text-xs text-blue-700"
                  >
                    {b.titleKh ?? b.titleEn}
                    <button
                      type="button"
                      disabled={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(b.id)}
                      className="text-blue-400 hover:text-red-500 ml-0.5 transition-colors"
                    >
                      <CloseOutlined style={{ fontSize: 10 }} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {currentBooks.length === 0 && (
            <p className="text-xs text-slate-400">{t("noBooks")}</p>
          )}

          {/* Add book section */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500 font-medium">{t("addBook")}</p>
            <div className="flex gap-2">
              <Input
                placeholder={t("searchBooksPlaceholder")}
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

            {results.length > 0 && (
              <div className="border border-slate-200 rounded divide-y divide-slate-100 max-h-52 overflow-y-auto">
                {results.map((b) => {
                  const alreadyAdded = currentBookIds.has(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      disabled={alreadyAdded || addMutation.isPending}
                      onClick={() => !alreadyAdded && addMutation.mutate(b.id)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        alreadyAdded
                          ? "opacity-40 cursor-not-allowed bg-slate-50"
                          : "hover:bg-blue-50 cursor-pointer"
                      }`}
                    >
                      <p className="font-medium text-slate-800 leading-snug">{b.titleKh ?? b.titleEn}</p>
                      {b.titleKh && b.titleEn && <p className="text-xs text-slate-400">{b.titleEn}</p>}
                      {b.author && <p className="text-xs text-slate-400">{b.author}</p>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={onClose}>{tc("close")}</Button>
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
