"use client";

import { useLocale, useTranslations } from "next-intl";
import "dayjs/locale/km";
import { usePortalQuery, portalFetch } from "./usePortalQuery";
import { useEffect, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";

/* ─── types ─────────────────────────────────────────── */
interface Member {
  memberId: string;
  nameKh: string | null;
  nameEn: string | null;
  type: string;
  photo: string | null;
  expiresAt: string | null;
  createdAt: string;
  class: { name: string } | null;
}
interface Loan {
  id: string;
  status: string;
  dueAt: string;
  book: { titleKh: string | null; titleEn: string; coverImage: string | null };
}

/* ─── data ───────────────────────────────────────────── */

const QUOTES = [
  {
    km: "ការអានសៀវភៅ គឺការបើកទ្វារចូលទៅក្នុងពិភពថ្មី ដែលអ្នកមិននឹកស្មានទុក។",
    en: "Reading a book opens a door to a world you never imagined.",
    attr: "ប្រាជ្ញាខ្មែរ",
  },
  {
    km: "ចំណេះដឹងគឺជាទ្រព្យដ៏ថ្លៃបំផុត ដែលគ្មាននរណាម្នាក់អាចលួចបានពីអ្នក។",
    en: "Knowledge is the most precious treasure that no one can ever steal from you.",
    attr: "ប្រាជ្ញាខ្មែរ",
  },
  {
    km: "ផ្ទះដែលគ្មានសៀវភៅ ដូចជាបន្ទប់ដែលគ្មានបង្អួច — ស្ងប់ស្ងាត់ ប៉ុន្តែខ្វះពន្លឺ។",
    en: "A house without books is like a room without windows — quiet, but lacking light.",
    attr: "Heinrich Mann",
  },
  {
    km: "អ្នកអានរស់នៅក្នុងជីវិតច្រើន មុននឹងស្លាប់ ។ អ្នកដែលមិនអានឡើយ រស់នៅតែម្នាក់ប៉ុណ្ណោះ។",
    en: "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    attr: "George R.R. Martin",
  },
  {
    km: "ពេលវេលាដែលអ្នកចំណាយនៅបណ្ណាល័យ គឺការវិនិយោគដ៏ប្រសើរបំផុតលើខ្លួនឯង។",
    en: "Time you spend at the library is the best investment you can make in yourself.",
    attr: "ប្រាជ្ញាខ្មែរ",
  },
];

/* ─── helpers ────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
    </div>
  );
}

function QuoteCarousel({ locale }: { locale: string }) {
  const [idx, setIdx]     = useState(0);
  const [show, setShow]   = useState(true);

  const go = (next: number) => {
    setShow(false);
    setTimeout(() => { setIdx(next); setShow(true); }, 300);
  };

  useEffect(() => {
    const t = setInterval(() => go((idx + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const q = QUOTES[idx];
  return (
    <div className="bg-linear-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-yellow-900/20 rounded-3xl px-5 pt-5 pb-4 relative overflow-hidden">
      <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-amber-200/25 pointer-events-none" />
      <div className="absolute -bottom-4 left-4  w-16 h-16 rounded-full bg-orange-200/20 pointer-events-none" />

      <div className="relative transition-opacity duration-300" style={{ opacity: show ? 1 : 0 }}>
        <span className="text-6xl font-serif text-amber-300 leading-none select-none">"</span>
        <p className="text-slate-700 dark:text-slate-200 text-[13px] leading-relaxed -mt-1 min-h-[4rem]">
          {locale === "km" ? q.km : q.en}
        </p>
        <p className="text-amber-500 text-[11px] font-semibold mt-3 tracking-wide">— {q.attr}</p>
      </div>

      <div className="flex gap-1.5 mt-4 justify-center">
        {QUOTES.map((_, i) => (
          <button
            key={i}
            onClick={() => i !== idx && go(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === idx ? "w-6 bg-amber-400" : "w-1.5 bg-amber-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── page ───────────────────────────────────────────── */
export default function PortalDashboardPage() {
  const t  = useTranslations("portal.dashboard");
  const tl = useTranslations("portal.loans");
  const locale = useLocale();

  const { data: member, isLoading: memberLoading } = usePortalQuery<Member>({
    queryKey: ["portal-me"],
    queryFn: () => portalFetch("/api/portal/me") as Promise<Member>,
  });

  const { data: loansData, isLoading: loansLoading } = usePortalQuery<{ loans: Loan[] }>({
    queryKey: ["portal-loans-active"],
    queryFn: () => portalFetch("/api/portal/loans?status=ACTIVE") as Promise<{ loans: Loan[] }>,
  });

  const { data: visitsData } = usePortalQuery<{ total: number; thisYear: number }>({
    queryKey: ["portal-visits-summary"],
    queryFn: () => portalFetch("/api/portal/visits") as Promise<{ total: number; thisYear: number }>,
  });

  const activeLoans  = loansData?.loans ?? [];
  const overdueCount = activeLoans.filter(
    (l) => l.status === "OVERDUE" || dayjs(l.dueAt).isBefore(dayjs(), "day")
  ).length;

  const displayName = member?.nameKh ?? member?.nameEn ?? member?.memberId ?? "";

  if (memberLoading) return <Spinner />;

  return (
    <div className="max-w-lg mx-auto pb-6">
      <div className="px-4 pt-4 space-y-4">

        {/* ── Quote carousel ── */}
        <QuoteCarousel locale={locale} />

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-300/40 dark:shadow-blue-900/30 p-3 text-center">
            <div className="text-2xl font-bold text-white tabular-nums leading-none">
              {loansLoading ? "·" : activeLoans.length}
            </div>
            <div className="text-blue-100 text-[10px] mt-1 leading-tight">{t("activeLoans")}</div>
          </div>

          {overdueCount > 0 ? (
            <div className="bg-linear-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg shadow-red-300/40 dark:shadow-red-900/30 p-3 text-center">
              <div className="text-2xl font-bold text-white tabular-nums leading-none">
                {loansLoading ? "·" : overdueCount}
              </div>
              <div className="text-red-100 text-[10px] mt-1 leading-tight">{t("overdueLoans")}</div>
            </div>
          ) : (
            <div className="bg-linear-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-300/40 dark:shadow-violet-900/30 p-3 text-center">
              <div className="text-2xl font-bold text-white tabular-nums leading-none">
                {loansLoading ? "·" : 0}
              </div>
              <div className="text-violet-100 text-[10px] mt-1 leading-tight">{t("overdueLoans")}</div>
            </div>
          )}

          <div className="bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-300/40 dark:shadow-emerald-900/30 p-3 text-center">
            <div className="text-2xl font-bold text-white tabular-nums leading-none">
              {visitsData?.total ?? 0}
            </div>
            <div className="text-emerald-100 text-[10px] mt-1 leading-tight">{t("libraryVisits")}</div>
          </div>
        </div>

        {/* ── Active loans shelf ── */}
        {!loansLoading && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800 dark:text-white">{t("activeLoans")}</span>
              {activeLoans.length > 0 && (
                <Link href={`/${locale}/loans`} className="text-xs text-blue-600 font-semibold">
                  {t("viewLoans")} →
                </Link>
              )}
            </div>

            {activeLoans.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-7 text-center shadow-sm">
                <p className="text-4xl mb-2">📚</p>
                <p className="text-slate-400 dark:text-slate-400 text-sm">{t("noLoans")}</p>
                <Link
                  href={`/${locale}/books`}
                  className="mt-3 inline-block bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-full"
                >
                  {t("browseBooks")}
                </Link>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 snap-x snap-mandatory">
                {activeLoans.slice(0, 6).map((loan) => {
                  const isOverdue = loan.status === "OVERDUE" || dayjs(loan.dueAt).isBefore(dayjs(), "day");
                  const daysLeft  = dayjs(loan.dueAt).diff(dayjs(), "day");
                  return (
                    <Link
                      key={loan.id}
                      href={`/${locale}/loans`}
                      className="snap-start shrink-0 w-[7.5rem]"
                    >
                      <div className="h-40 rounded-2xl overflow-hidden bg-indigo-50 relative shadow-md">
                        {loan.book.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={loan.book.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                            <span className="text-4xl opacity-30">📖</span>
                          </div>
                        )}
                        {isOverdue && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow">
                            <span className="text-white text-[10px] font-black">!</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-2 line-clamp-2 leading-tight">
                        {loan.book.titleKh ?? loan.book.titleEn}
                      </p>
                      <p className={`text-[10px] mt-0.5 font-medium ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                        {isOverdue
                          ? tl("overdueDays", { days: dayjs().diff(dayjs(loan.dueAt), "day") })
                          : daysLeft === 0
                          ? tl("dueToday")
                          : tl("daysLeft", { days: daysLeft })}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Member card CTA ── */}
        <Link href={`/${locale}/card`}>
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 shadow-xl shadow-blue-300/30 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-blue-200 text-[11px] mb-0.5 font-medium">{t("myCard")}</p>
              <p className="text-white font-bold text-base leading-snug truncate">{displayName}</p>
              <p className="font-mono text-blue-200 text-xs mt-1">{member?.memberId}</p>
            </div>
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/20">
              <span className="text-3xl">🪪</span>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
