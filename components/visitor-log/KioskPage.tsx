"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/request";
import { PURPOSES, PURPOSE_COLOR, type Purpose } from "./constants";

interface ReaderEntry {
  rank: number;
  id: string;
  nameKh: string | null;
  nameEn: string | null;
  photo: string | null;
  class: { name: string } | null;
  visitCount: number;
}

interface BookEntry {
  rank: number;
  id: string;
  titleKh: string | null;
  titleEn: string | null;
  coverImage: string | null;
  author: string | null;
  borrowCount: number;
}

const RANK_STYLES = ["text-yellow-400", "text-slate-300", "text-orange-400"];
const RANK_BG    = ["bg-yellow-400/10", "bg-slate-400/10", "bg-orange-400/10"];

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

// Shows items statically when they fit; switches to a seamless CSS loop when they overflow.
// Content is doubled so translateY(-50%) advances exactly one full list height.
function AutoScrollList({ children, itemCount }: { children: ReactNode; itemCount: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef   = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const measure   = measureRef.current;
    if (!container || !measure) return;
    const check = () => setIsOverflowing(measure.offsetHeight > container.clientHeight);
    const ro = new ResizeObserver(check);
    ro.observe(container);
    ro.observe(measure);
    check();
    return () => ro.disconnect();
  }, [itemCount]);

  // ~2 s per item, clamped 10–40 s
  const duration = `${Math.min(40, Math.max(10, itemCount * 2))}s`;

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden relative">
      {/* Hidden single copy used only for measuring */}
      <div ref={measureRef} className="absolute invisible pointer-events-none w-full" aria-hidden="true">
        {children}
      </div>
      {isOverflowing ? (
        <div style={{ animation: `kiosk-scroll-up ${duration} linear infinite` }}>
          <div>{children}</div>
          <div>{children}</div>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}

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

  // Monthly leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ["kiosk-leaderboard"],
    queryFn: () => apiFetch<{ topReaders: ReaderEntry[]; topBooks: BookEntry[] }>("/api/visitor-log/kiosk"),
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });

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
        { fps: 10, qrbox: { width: 400, height: 300 } },
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
      <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <img src="/LibraCore.png" alt="LibraCore" className="w-7 h-7 md:w-8 md:h-8 object-contain" />
          <div>
            <p className="text-xs md:text-sm font-semibold leading-tight">{t("kiosk.schoolName")}</p>
            <p className="hidden sm:block text-xs text-slate-400 leading-tight">{t("kiosk.libraryName")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="text-right">
            <p className="text-base md:text-lg font-mono font-semibold tracking-widest">{clock}</p>
            <p className="text-xs text-slate-400">
              {insideNow > 0 ? t("kiosk.insideCount", { count: insideNow }) : t("kiosk.noOneInside")}
            </p>
          </div>
          <button
            onClick={() => router.push(`/${locale}/visitor-log`)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 md:px-3 md:py-1.5 rounded border border-slate-700 hover:border-slate-500"
          >
            {t("kiosk.exit")} ↗
          </button>
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────────── */}
      {/* Mobile: scanner on top (full width), 2 panels side-by-side below  */}
      {/* Desktop (lg+): left column = 2 stacked panels, right = big scanner */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 px-2 py-2 md:gap-3 md:px-3 md:py-3 lg:gap-4 lg:px-4 lg:py-4 min-h-0">

        {/* ── Left column: 2 leaderboard panels stacked ───────────── */}
        {/* Mobile: row-2 side-by-side (order-2); Desktop: left column (order-1) */}
        <div className="flex flex-row lg:flex-col gap-2 lg:gap-3 order-2 lg:order-1 lg:w-[340px] xl:w-[400px] shrink-0 min-h-0 overflow-hidden">

          {/* Top Readers */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-800/40 rounded-xl px-2 py-2 lg:px-3 lg:py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 lg:mb-2 shrink-0">
              🏆 {t("kiosk.topReaders")}
            </p>
            <AutoScrollList itemCount={(leaderboard?.topReaders ?? []).length}>
              <div className="space-y-0.5 lg:space-y-1">
                {(leaderboard?.topReaders ?? []).length === 0 ? (
                  <p className="text-slate-600 text-sm">{t("kiosk.noData")}</p>
                ) : (leaderboard?.topReaders ?? []).map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${r.rank <= 3 ? RANK_BG[r.rank - 1] : "bg-slate-800/60"}`}
                  >
                    <span className={`text-xs font-bold w-5 text-center shrink-0 ${r.rank <= 3 ? RANK_STYLES[r.rank - 1] : "text-slate-500"}`}>
                      {r.rank <= 3 ? ["🥇","🥈","🥉"][r.rank - 1] : r.rank}
                    </span>
                    {r.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photo} alt="" className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover shrink-0 ring-2 ring-slate-600" />
                    ) : (
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-slate-700 flex items-center justify-center text-base shrink-0">👤</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate leading-tight">{r.nameKh ?? r.nameEn}</p>
                      {r.class && <p className="hidden md:block text-xs text-slate-500 truncate leading-tight">{r.class.name}</p>}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{t("kiosk.visits", { count: r.visitCount })}</span>
                  </div>
                ))}
              </div>
            </AutoScrollList>
          </div>

          {/* Divider (desktop only) */}
          <div className="hidden lg:block h-px bg-slate-700 shrink-0" />

          {/* Top Books */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-800/40 rounded-xl px-2 py-2 lg:px-3 lg:py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 lg:mb-2 shrink-0">
              📚 {t("kiosk.topBooks")}
            </p>
            <AutoScrollList itemCount={(leaderboard?.topBooks ?? []).length}>
              <div className="space-y-0.5 lg:space-y-1">
                {(leaderboard?.topBooks ?? []).length === 0 ? (
                  <p className="text-slate-600 text-sm">{t("kiosk.noData")}</p>
                ) : (leaderboard?.topBooks ?? []).map((b) => (
                  <div
                    key={b.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${b.rank <= 3 ? RANK_BG[b.rank - 1] : "bg-slate-800/60"}`}
                  >
                    <span className={`text-xs font-bold w-5 text-center shrink-0 ${b.rank <= 3 ? RANK_STYLES[b.rank - 1] : "text-slate-500"}`}>
                      {b.rank <= 3 ? ["🥇","🥈","🥉"][b.rank - 1] : b.rank}
                    </span>
                    {b.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.coverImage} alt="" className="w-8 h-12 lg:w-10 lg:h-14 object-cover rounded shadow shrink-0" />
                    ) : (
                      <div className="w-8 h-12 lg:w-10 lg:h-14 rounded bg-slate-700 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate leading-tight">{b.titleKh ?? b.titleEn}</p>
                      {b.author && <p className="hidden md:block text-xs text-slate-500 truncate leading-tight">{b.author}</p>}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{t("kiosk.borrows", { count: b.borrowCount })}</span>
                  </div>
                ))}
              </div>
            </AutoScrollList>
          </div>
        </div>

        {/* ── Right column: big scanner ────────────────────────────── */}
        {/* Mobile: row-1 centered (order-1); Desktop: fills remaining width (order-2) */}
        <div className="order-1 lg:order-2 flex-1 flex flex-col items-center justify-center gap-3 lg:gap-5">
          <div className="relative">
            <div
              id="kiosk-qr-reader"
              ref={containerRef}
              className="rounded-2xl overflow-hidden shadow-2xl w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] lg:w-[420px] lg:h-[420px] xl:w-[500px] xl:h-[500px]"
            />
            {/* Corner brackets */}
            {[["top-2 left-2","border-t-2 border-l-2"],["top-2 right-2","border-t-2 border-r-2"],
              ["bottom-2 left-2","border-b-2 border-l-2"],["bottom-2 right-2","border-b-2 border-r-2"]
            ].map(([pos, cls], i) => (
              <div key={i} className={`absolute ${pos} ${cls} w-8 h-8 lg:w-10 lg:h-10 border-blue-400 rounded-sm pointer-events-none`} />
            ))}
            {scanState.status === "processing" && (
              <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center rounded-2xl">
                <div className="w-10 h-10 lg:w-14 lg:h-14 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <p className="text-slate-300 text-sm lg:text-lg font-medium tracking-wide text-center">{t("kiosk.instruction")}</p>
        </div>
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
