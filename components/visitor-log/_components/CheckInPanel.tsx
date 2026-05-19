"use client";

import { useState, useRef } from "react";
import { Button, Input, Tag, App, Spin } from "antd";
import { QrcodeOutlined, BookOutlined, CloseOutlined, LoginOutlined, LogoutOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/libs/utils/request";
import { QrScanner } from "./QrScanner";

const PURPOSES = ["READING", "BORROWING", "SCHOOLWORK", "RESEARCH", "OTHER"] as const;
type Purpose = typeof PURPOSES[number];

interface MemberInfo {
  id: string;
  memberId: string;
  nameKh: string | null;
  nameEn: string | null;
  type: string;
  class?: { name: string } | null;
}

interface BookInfo {
  id: string;
  titleKh: string | null;
  titleEn: string | null;
}

interface OpenVisit {
  id: string;
  arrivedAt: string;
}

const PURPOSE_COLOR: Record<Purpose, string> = {
  READING: "blue",
  BORROWING: "green",
  SCHOOLWORK: "orange",
  RESEARCH: "purple",
  OTHER: "default",
};

export function CheckInPanel({ onCheckedIn }: { onCheckedIn: () => void }) {
  const t = useTranslations("visitorLog");
  const { message } = App.useApp();

  const [scannerTarget, setScannerTarget] = useState<"member" | "book" | null>(null);
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [openVisit, setOpenVisit] = useState<OpenVisit | null>(null);
  const [books, setBooks] = useState<BookInfo[]>([]);
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);

  async function resolveMember(qrValue: string) {
    if (resolving) return;
    setResolving(true);
    setScannerTarget(null);
    try {
      const res = await apiFetch<{ members: MemberInfo[]; total: number }>(
        `/api/members?search=${encodeURIComponent(qrValue)}&limit=1`
      );
      const found = res.members[0];
      if (!found) { message.error(t("memberNotFound")); return; }
      setMember(found);

      const logRes = await apiFetch<{ logs: OpenVisit[]; total: number }>(
        `/api/visitor-log?openOnly=true&search=${encodeURIComponent(qrValue)}&limit=1`
      );
      setOpenVisit(logRes.logs[0] ?? null);
    } catch {
      message.error(t("memberNotFound"));
    } finally {
      setResolving(false);
    }
  }

  async function resolveBook(qrValue: string) {
    setScannerTarget(null);
    try {
      const looksLikeCuid = !qrValue.includes("-") && qrValue.length > 10;
      let found: BookInfo | null = null;
      if (looksLikeCuid) {
        found = await apiFetch<BookInfo>(`/api/books/${qrValue}`);
      } else {
        const res = await apiFetch<{ books: BookInfo[]; total: number }>(
          `/api/books?search=${encodeURIComponent(qrValue)}&limit=1`
        );
        found = res.books?.[0] ?? null;
      }
      if (!found) { message.warning(t("bookNotFound")); return; }
      if (books.some((b) => b.id === found!.id)) { message.info(t("bookAlreadyAdded")); return; }
      setBooks((prev) => [...prev, found!]);
      message.success(t("bookLinked", { title: found.titleKh ?? found.titleEn ?? "" }));
    } catch {
      message.warning(t("bookNotFound"));
    }
  }

  async function handleSubmit() {
    if (!member) return;
    setLoading(true);
    try {
      if (openVisit) {
        await apiFetch(`/api/visitor-log/${openVisit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "checkout" }),
        });
        message.success(t("checkoutSuccess"));
      } else {
        if (!purpose) { message.warning(t("purpose")); setLoading(false); return; }
        await apiFetch("/api/visitor-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: member.id, purpose, bookIds: books.map((b) => b.id), note: note || null }),
        });
        message.success(t("checkinSuccess"));
      }
      onCheckedIn();
      reset();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMember(null);
    setOpenVisit(null);
    setBooks([]);
    setPurpose(null);
    setNote("");
  }

  const isCheckout = !!openVisit;
  const canSubmit = !!member && (isCheckout || !!purpose);

  return (
    <div className="bg-white border border-slate-100 rounded-lg p-4 space-y-4">
      {/* Member scan */}
      <div className="flex flex-wrap gap-2 items-start">
        <Button
          icon={<QrcodeOutlined />}
          onClick={() => setScannerTarget("member")}
          type={member ? "default" : "primary"}
          size="large"
          className="flex-shrink-0"
        >
          {t("scanMember")}
        </Button>

        {resolving && <Spin className="mt-2" />}

        {member && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
            <div className="flex-1">
              <p className="font-medium text-slate-800 leading-snug">{member.nameKh ?? member.nameEn}</p>
              {member.nameKh && member.nameEn && <p className="text-xs text-slate-400">{member.nameEn}</p>}
              <div className="flex gap-1 mt-1 flex-wrap">
                <Tag className="border-0 text-xs bg-slate-100 text-slate-500">{member.memberId}</Tag>
                {member.class && (
                  <Tag className="border-0 text-xs bg-indigo-50 text-indigo-600">{member.class.name}</Tag>
                )}
                {isCheckout && <Tag color="orange" className="border-0 text-xs">{t("open")}</Tag>}
              </div>
            </div>
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={reset} />
          </div>
        )}
      </div>

      {/* Only show purpose + books if checking in */}
      {member && !isCheckout && (
        <>
          {/* Purpose chips */}
          <div>
            <p className="text-xs text-slate-500 mb-2">{t("purpose")}</p>
            <div className="flex flex-wrap gap-2">
              {PURPOSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPurpose(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    purpose === p
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-slate-300 text-slate-600 hover:border-blue-400"
                  }`}
                >
                  {t(`purposes.${p}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Book scan — multiple */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button icon={<BookOutlined />} size="small" onClick={() => setScannerTarget("book")}>
                {t("scanBookOptional")}
              </Button>
              {books.length > 0 && (
                <span className="text-xs text-slate-400">{t("booksRead")}: {books.length}</span>
              )}
            </div>
            {books.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {books.map((b) => (
                  <span
                    key={b.id}
                    className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded px-2 py-0.5 text-xs text-blue-700"
                  >
                    {b.titleKh ?? b.titleEn}
                    <button
                      type="button"
                      onClick={() => setBooks((prev) => prev.filter((x) => x.id !== b.id))}
                      className="text-blue-400 hover:text-blue-700 ml-0.5"
                    >
                      <CloseOutlined style={{ fontSize: 10 }} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Note */}
          <Input
            placeholder={t("notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="max-w-sm"
          />
        </>
      )}

      {/* Submit */}
      {member && (
        <Button
          type="primary"
          size="large"
          icon={isCheckout ? <LogoutOutlined /> : <LoginOutlined />}
          loading={loading}
          disabled={!canSubmit}
          onClick={handleSubmit}
          danger={isCheckout}
        >
          {isCheckout ? t("checkOut") : t("checkIn")}
        </Button>
      )}

      {scannerTarget && (
        <QrScanner
          onScan={(val) => {
            if (scannerTarget === "member") resolveMember(val);
            else resolveBook(val);
          }}
          onClose={() => setScannerTarget(null)}
          title={scannerTarget === "member" ? t("scanMember") : t("scanBook")}
        />
      )}
    </div>
  );
}
