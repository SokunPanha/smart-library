"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/request";
import { PURPOSES, PURPOSE_COLOR, type Purpose } from "./constants";

interface Member {
  id: string;
  memberId: string;
  nameKh: string | null;
  nameEn: string | null;
  photo: string | null;
  class: { name: string } | null;
}

type ScanState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "purpose-select"; member: Member }
  | { status: "checkin";  member: Member }
  | { status: "checkout"; member: Member; durationMin: number }
  | { status: "error";    message: string };

// Static class map — avoids dynamic Tailwind purging
const PURPOSE_BTN: Record<string, string> = {
  READING:    "bg-blue-500   hover:bg-blue-400   border-blue-400",
  BORROWING:  "bg-green-500  hover:bg-green-400  border-green-400",
  SCHOOLWORK: "bg-orange-500 hover:bg-orange-400 border-orange-400",
  RESEARCH:   "bg-purple-500 hover:bg-purple-400 border-purple-400",
  OTHER:      "bg-slate-500  hover:bg-slate-400  border-slate-400",
};

export function KioskPage() {
  const t = useTranslations("visitorLog");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [clock, setClock] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScanned = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live clock
  useEffect(() => {
    function tick() {
      setClock(new Date().toLocaleTimeString("km-KH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Inside-now count
  const { data: statsData } = useQuery({
    queryKey: ["visitor-log", "stats", "kiosk"],
    queryFn: () => apiFetch<{ insideNow: number }>("/api/visitor-log/stats"),
    refetchInterval: 30_000,
  });
  const insideNow = statsData?.insideNow ?? 0;

  function scheduleReset(delayMs = 2500) {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setScanState({ status: "idle" });
      hasScanned.current = false;
    }, delayMs);
  }

  // Step 1: QR scanned — look up member and decide check-in or checkout
  async function handleScan(qrValue: string) {
    if (hasScanned.current) return;
    hasScanned.current = true;
    setScanState({ status: "processing" });

    try {
      // Dry-run: just resolve member + detect open visit without committing
      const res = await apiFetch<{ action: "checkin" | "checkout"; member: Member; durationMin?: number }>(
        "/api/visitor-log/kiosk",
        { method: "POST", body: JSON.stringify({ qrValue: qrValue.trim(), dryRun: true }) }
      );

      if (res.action === "checkout") {
        // Checkout is instant — commit immediately
        const committed = await apiFetch<{ action: "checkout"; member: Member; durationMin?: number }>(
          "/api/visitor-log/kiosk",
          { method: "POST", body: JSON.stringify({ qrValue: qrValue.trim() }) }
        );
        setScanState({ status: "checkout", member: committed.member, durationMin: committed.durationMin ?? 0 });
        scheduleReset();
      } else {
        // Check-in: show purpose selection (no commit yet)
        setScanState({ status: "purpose-select", member: res.member });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message === "MEMBER_NOT_FOUND"
        ? t("kiosk.memberNotFound")
        : t("kiosk.error");
      setScanState({ status: "error", message: msg });
      scheduleReset();
    }
  }

  // Step 2: Student taps a purpose → commit check-in
  async function handlePurposeSelect(purpose: Purpose, member: Member) {
    setScanState({ status: "processing" });
    try {
      await apiFetch("/api/visitor-log/kiosk", {
        method: "POST",
        body: JSON.stringify({ qrValue: member.memberId, purpose }),
      });
      setScanState({ status: "checkin", member });
      scheduleReset();
    } catch {
      setScanState({ status: "error", message: t("kiosk.error") });
      scheduleReset();
    }
  }

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      scannerRef.current?.isScanning && scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
      return;
    }
    const scanner = new Html5Qrcode(el.id);
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (text) => handleScan(text),
        () => {}
      )
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function formatDuration(min: number) {
    if (min < 60) return `${min} ${t("kiosk.minutes")}`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h} ${t("kiosk.hours")} ${m} ${t("kiosk.minutes")}` : `${h} ${t("kiosk.hours")}`;
  }

  const showResultOverlay = scanState.status === "checkin" || scanState.status === "checkout" || scanState.status === "error";

  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex flex-col select-none overflow-hidden">

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/LibraCore.png" alt="LibraCore" className="w-8 h-8 object-contain" />
          <div>
            <p className="text-sm font-semibold leading-tight">{t("kiosk.schoolName")}</p>
            <p className="text-xs text-slate-400 leading-tight">{t("kiosk.libraryName")}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-mono font-semibold tracking-widest">{clock}</p>
            <p className="text-xs text-slate-400">
              {insideNow > 0 ? t("kiosk.insideCount", { count: insideNow }) : t("kiosk.noOneInside")}
            </p>
          </div>
          <button
            onClick={() => router.push(`/${locale}/visitor-log`)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded border border-slate-700 hover:border-slate-500"
          >
            {t("kiosk.exit")} ↗
          </button>
        </div>
      </div>

      {/* ── Main scanner area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <div className="relative">
          <div
            id="kiosk-qr-reader"
            ref={containerRef}
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: 340, height: 340 }}
          />
          {/* Corner brackets */}
          {[["top-2 left-2","border-t-2 border-l-2"],["top-2 right-2","border-t-2 border-r-2"],
            ["bottom-2 left-2","border-b-2 border-l-2"],["bottom-2 right-2","border-b-2 border-r-2"]
          ].map(([pos, cls], i) => (
            <div key={i} className={`absolute ${pos} ${cls} w-8 h-8 border-blue-400 rounded-sm pointer-events-none`} />
          ))}
          {/* Spinner while processing */}
          {scanState.status === "processing" && (
            <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center rounded-2xl">
              <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <p className="text-slate-300 text-lg font-medium tracking-wide">{t("kiosk.instruction")}</p>
      </div>

      {/* ── Purpose selection overlay ─────────────────────────────── */}
      {scanState.status === "purpose-select" && (
        <div className="absolute inset-0 bg-slate-900/97 flex flex-col items-center justify-center gap-6 px-8">
          {/* Member info */}
          <div className="flex items-center gap-4">
            {scanState.member.photo ? (
              <img src={scanState.member.photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-slate-600" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl">👤</div>
            )}
            <div>
              <p className="text-2xl font-bold">{scanState.member.nameKh ?? scanState.member.nameEn}</p>
              {scanState.member.class && (
                <p className="text-slate-400 text-sm mt-0.5">{scanState.member.class.name}</p>
              )}
            </div>
          </div>

          <p className="text-slate-300 text-base font-medium">{t("kiosk.selectPurpose")}</p>

          {/* Purpose buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
            {PURPOSES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePurposeSelect(p, scanState.member)}
                className={`${PURPOSE_BTN[p]} border rounded-2xl py-5 px-4 text-white text-base font-semibold transition-all active:scale-95 shadow-lg`}
              >
                {t(`purposes.${p}`)}
              </button>
            ))}
          </div>

          {/* Cancel */}
          <button
            type="button"
            onClick={() => { setScanState({ status: "idle" }); hasScanned.current = false; }}
            className="text-slate-500 hover:text-slate-300 text-sm mt-2 transition-colors"
          >
            ← {t("kiosk.cancel")}
          </button>
        </div>
      )}

      {/* ── Result overlay (checkin / checkout / error) ───────────── */}
      {showResultOverlay && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-5 ${
          scanState.status === "checkin"  ? "bg-emerald-900/95" :
          scanState.status === "checkout" ? "bg-blue-900/95"    : "bg-red-900/95"
        }`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${
            scanState.status === "checkin"  ? "bg-emerald-500" :
            scanState.status === "checkout" ? "bg-blue-500"    : "bg-red-500"
          }`}>
            {scanState.status === "checkin" ? "✓" : scanState.status === "checkout" ? "👋" : "✕"}
          </div>

          {(scanState.status === "checkin" || scanState.status === "checkout") && (
            <>
              {scanState.member.photo && (
                <img src={scanState.member.photo} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white/30" />
              )}
              <div className="text-center">
                <p className="text-3xl font-bold">{scanState.member.nameKh ?? scanState.member.nameEn}</p>
                {scanState.member.nameKh && scanState.member.nameEn && (
                  <p className="text-slate-300 text-lg mt-1">{scanState.member.nameEn}</p>
                )}
                {scanState.member.class && (
                  <p className="text-slate-400 text-sm mt-1">{scanState.member.class.name}</p>
                )}
              </div>
              <p className="text-xl font-semibold">
                {scanState.status === "checkin" ? t("kiosk.welcomeMessage") : t("kiosk.goodbyeMessage")}
              </p>
              {scanState.status === "checkout" && scanState.durationMin > 0 && (
                <p className="text-slate-300 text-sm">{t("kiosk.duration")}: {formatDuration(scanState.durationMin)}</p>
              )}
            </>
          )}

          {scanState.status === "error" && (
            <p className="text-xl font-semibold">{scanState.message}</p>
          )}

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
            <div className="h-full bg-white/70 animate-[shrink_2.5s_linear_forwards]" />
          </div>
        </div>
      )}
    </div>
  );
}
