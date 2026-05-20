"use client";

import { useEffect, useRef, useState } from "react";
import { Modal, Button, Space, Tag, Spin, Alert, Divider, DatePicker } from "antd";
import { Html5Qrcode } from "html5-qrcode";
import { ReloadOutlined, QrcodeOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/request";
import { useFetchSettings } from "@/components/settings/helper/useFetchSettings";

// Book IDs are CUIDs (no hyphens). Member IDs are human-readable like LIB-2025-002.
const isMemberId = (value: string) => value.includes("-");
const SCANNER_EL_ID = "qr-scan-reader";

interface ScannedBook {
  id: string;
  titleEn: string;
  titleKh: string | null;
  coverImage: string | null;
  totalCopies: number;
  availableCopies: number;
  author: string | null;
}

interface LoanEntry {
  id: string;
  bookId: string;
  status: string;
}

interface ScannedMember {
  id: string;
  memberId: string;
  nameEn: string | null;
  nameKh: string | null;
  type: string;
  loans: LoanEntry[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCheckout: (bookId: string, memberId: string, dueAt?: string) => Promise<void>;
  onReturn: (loanId: string) => Promise<void>;
}

export function QRScanModal({ open, onClose, onCheckout, onReturn }: Props) {
  const t = useTranslations("circulation");
  const { data: settings } = useFetchSettings();
  const maxLoans = Number(settings?.maxLoansPerMember ?? 5);

  const [books, setBooks] = useState<ScannedBook[]>([]);
  const [member, setMember] = useState<ScannedMember | null>(null);
  const [dueAt, setDueAt] = useState<dayjs.Dayjs | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockRef = useRef(false);

  async function stopScanner() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* already stopped */ }
      try { scannerRef.current.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
  }

  async function startScanner() {
    const el = document.getElementById(SCANNER_EL_ID);
    if (!el || scannerRef.current) return;

    const scanner = new Html5Qrcode(SCANNER_EL_ID);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decoded) => {
          if (lockRef.current) return;
          lockRef.current = true;
          setFetching(true);
          setError(null);

          try {
            if (!isMemberId(decoded)) {
              // Book scan
              setBooks((prev) => {
                if (prev.find((b) => b.id === decoded)) return prev; // already added
                return prev; // will update after fetch
              });
              const data = await apiFetch<ScannedBook>(`/api/books/${decoded}`);
              setBooks((prev) => {
                if (prev.find((b) => b.id === data.id)) {
                  setError(t("scan.bookAlreadyAdded"));
                  return prev;
                }
                return [...prev, data];
              });
            } else {
              // Member scan
              const res = await apiFetch<{ members: ScannedMember[] }>(
                `/api/members?search=${encodeURIComponent(decoded)}&limit=5`
              );
              const found = res.members.find((m) => m.memberId === decoded);
              if (!found) throw new Error(t("scan.memberNotFound"));
              const full = await apiFetch<ScannedMember>(`/api/members/${found.id}`);
              setMember(full);
            }
          } catch (e: unknown) {
            setError(e instanceof Error ? e.message : t("scan.qrNotRecognized"));
          } finally {
            setFetching(false);
            setTimeout(() => { lockRef.current = false; }, 2000);
          }
        },
        undefined
      );
    } catch {
      setError(t("scan.cameraUnavailable"));
      scannerRef.current = null;
    }
  }

  useEffect(() => {
    if (!open) {
      stopScanner();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBooks([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMember(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDueAt(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);
      lockRef.current = false;
      return;
    }
    const timer = setTimeout(startScanner, 400);
    return () => { clearTimeout(timer); stopScanner(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const activeLoansCount = member ? member.loans.filter((l) => l.status === "ACTIVE").length : 0;
  const slotsLeft = Math.max(0, maxLoans - activeLoansCount);

  function getActiveLoanForBook(bookId: string): LoanEntry | null {
    return member?.loans.find((l) => l.bookId === bookId && l.status === "ACTIVE") ?? null;
  }

  const checkoutBooks = books.filter(
    (b) => !getActiveLoanForBook(b.id) && b.totalCopies > 2 && b.availableCopies > 2
  );
  const returnBooks = books.filter((b) => !!getActiveLoanForBook(b.id));

  const canCheckout = !!member && checkoutBooks.length > 0 && checkoutBooks.length <= slotsLeft;
  const canReturn = returnBooks.length > 0;

  async function handleCheckout() {
    if (!member || checkoutBooks.length === 0) return;
    setActionLoading(true);
    try {
      for (const b of checkoutBooks) {
        await onCheckout(b.id, member.id, dueAt?.toISOString());
      }
      setBooks([]);
      setDueAt(null);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReturn() {
    if (!member || returnBooks.length === 0) return;
    setActionLoading(true);
    try {
      for (const b of returnBooks) {
        const loan = getActiveLoanForBook(b.id);
        if (loan) await onReturn(loan.id);
      }
      setBooks((prev) => prev.filter((b) => !getActiveLoanForBook(b.id)));
    } finally {
      setActionLoading(false);
    }
  }

  function removeBook(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  const showDueDate = canCheckout;
  const hasAnything = books.length > 0 || !!member;

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <QrcodeOutlined />
          {t("scan.title")}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      destroyOnHidden
    >
      {/* Camera */}
      <div className="relative rounded-lg overflow-hidden bg-black min-h-[260px]">
        <div id={SCANNER_EL_ID} className="w-full" />
        {fetching && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Spin size="large" />
          </div>
        )}
      </div>
      <p className="text-xs text-center text-slate-400 mt-2">
        {t("scan.hint", { max: maxLoans })}
      </p>

      {error && (
        <Alert
          type="error"
          title={error}
          className="mt-3"
          showIcon
          closable
          onClose={() => setError(null)}
        />
      )}

      <Divider className="my-3" />

      {/* Member card */}
      <div className={`border rounded-lg p-3 mb-3 transition-colors ${member ? "border-green-200 bg-green-50" : "border-dashed border-slate-200"}`}>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{t("scan.memberSection")}</p>
        {member ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {member.nameKh ?? member.nameEn ?? member.memberId}
              </p>
              {member.nameKh && member.nameEn && (
                <p className="text-xs text-slate-500">{member.nameEn}</p>
              )}
              <p className="text-xs font-mono text-slate-400">{member.memberId}</p>
            </div>
            <div className="text-right">
              <Tag className="border-0 text-xs">{member.type}</Tag>
              <p className={`text-xs mt-1 font-medium ${activeLoansCount >= maxLoans ? "text-red-500" : "text-slate-500"}`}>
                {t("scan.activeLoans", { current: activeLoansCount, max: maxLoans })} · {t("scan.slotsLeft", { count: slotsLeft })}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-300 text-center py-2">{t("scan.scanMemberQR")}</p>
        )}
      </div>

      {/* Books list */}
      <div className="border rounded-lg transition-colors border-slate-200">
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            {t("scan.booksLabel", { count: books.length })}
          </p>
          {member && slotsLeft > 0 && checkoutBooks.length < slotsLeft && (
            <p className="text-[10px] text-blue-400">{t("scan.scanBookToAdd")}</p>
          )}
          {member && checkoutBooks.length >= slotsLeft && slotsLeft > 0 && (
            <p className="text-[10px] text-orange-400">{t("scan.loanLimitWarning")}</p>
          )}
          {member && slotsLeft === 0 && (
            <p className="text-[10px] text-red-400">{t("scan.noSlotsLeft")}</p>
          )}
        </div>

        {books.length === 0 ? (
          <p className="text-xs text-slate-300 text-center py-4">{t("scan.noBooksScanned")}</p>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {books.map((b) => {
              const loan = getActiveLoanForBook(b.id);
              const blocked = !loan && (b.totalCopies <= 2 || b.availableCopies <= 2);
              return (
                <li key={b.id} className="flex items-center gap-2 px-3 py-2">
                  {b.coverImage && (
                    <img src={b.coverImage} alt="cover" className="w-7 h-10 object-cover rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-1">{b.titleKh ?? b.titleEn}</p>
                    {b.titleKh && b.titleEn && <p className="text-xs text-slate-400 line-clamp-1">{b.titleEn}</p>}
                    <p className="text-[10px] mt-0.5">
                      {loan
                        ? <span className="text-orange-500 font-medium">{t("scan.onLoan")}</span>
                        : blocked
                          ? <span className="text-red-500 font-medium">
                              {b.totalCopies <= 2 ? t("scan.libraryOnly") : t("scan.reserveLimit")}
                            </span>
                          : <span className="text-green-600 font-medium">{t("scan.readyToBorrow")}</span>}
                    </p>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeBook(b.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Due date picker */}
      {showDueDate && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-1">{t("customDueDate")}</p>
          <DatePicker
            className="w-full"
            format="DD/MM/YYYY"
            value={dueAt}
            onChange={setDueAt}
            disabledDate={(d) => d.isBefore(dayjs(), "day")}
            placeholder={t("scan.defaultDueDateHint")}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => { setBooks([]); setMember(null); setDueAt(null); setError(null); }}
          disabled={!hasAnything}
        >
          {t("scan.clearAll")}
        </Button>
        <Space>
          {canReturn && (
            <Button loading={actionLoading} onClick={handleReturn}>
              {t("scan.returnCount", { count: returnBooks.length })}
            </Button>
          )}
          {canCheckout && (
            <Button type="primary" loading={actionLoading} onClick={handleCheckout}>
              {t("scan.checkoutCount", { count: checkoutBooks.length })}
            </Button>
          )}
          {member && !canCheckout && !canReturn && books.length > 0 && (
            <span className="text-xs text-red-500">
              {slotsLeft === 0 ? t("scan.loanLimitReached", { max: maxLoans }) : t("scan.noValidBooks")}
            </span>
          )}
        </Space>
      </div>
    </Modal>
  );
}
