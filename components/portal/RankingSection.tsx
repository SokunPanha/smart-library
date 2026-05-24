"use client";

import { useState } from "react";
import { usePortalQuery, portalFetch } from "./usePortalQuery";
import { useTranslations, useLocale } from "next-intl";
import dayjs from "dayjs";
import "dayjs/locale/km";
import { Spinner, Select } from "./ui";

interface RankEntry {
  rank: number;
  memberId: string;
  name: string;
  photo: string | null;
  visits: number;
  isMe: boolean;
}

interface RankingData {
  month: string;
  myRank: number | null;
  myVisits: number;
  totalParticipants: number;
  top: RankEntry[];
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function rankColor(rank: number) {
  if (rank === 1) return "text-yellow-500";
  if (rank === 2) return "text-slate-400 dark:text-slate-300";
  if (rank === 3) return "text-amber-600 dark:text-amber-500";
  return "text-indigo-600 dark:text-indigo-400";
}

function buildMonthOptions(locale: string) {
  const options = [];
  const now = dayjs();
  for (let i = 0; i < 12; i++) {
    const d = now.subtract(i, "month");
    options.push({ value: d.format("YYYY-MM"), label: d.locale(locale).format("MMM YYYY") });
  }
  return options;
}

export default function RankingSection() {
  const t      = useTranslations("portal.ranking");
  const locale = useLocale();
  const [month, setMonth]  = useState(() => dayjs().format("YYYY-MM"));
  const monthOptions       = buildMonthOptions(locale);

  const { data, isLoading } = usePortalQuery<RankingData>({
    queryKey: ["portal-ranking", month],
    queryFn: () => portalFetch(`/api/portal/ranking?month=${month}`) as Promise<RankingData>,
  });

  const topList = data?.top ?? [];
  const hasGap  = data?.myRank !== null && (data?.myRank ?? 0) > 10;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-700">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("title")}</span>
        <Select
          value={month}
          onChange={setMonth}
          options={monthOptions}
          className="w-32"
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {/* My rank card */}
          <div className="px-4 py-4 bg-linear-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-b border-slate-100 dark:border-slate-700">
            {data?.myRank !== null ? (
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[56px]">
                  <div className="text-3xl leading-none">
                    {MEDAL[data!.myRank!] ?? "🏅"}
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${rankColor(data!.myRank!)}`}>
                    #{data!.myRank}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("yourRank")}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {t("visits", { count: data!.myVisits })}
                    </span>
                    <span className="text-xs text-slate-300 dark:text-slate-600">
                      {t("of", { total: data!.totalParticipants })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">{t("notRanked")}</p>
            )}
          </div>

          {/* Leaderboard */}
          {topList.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-300 dark:text-slate-600">{t("noVisits")}</div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/60">
              {topList.map((entry, i) => {
                const showGap = hasGap && i === topList.length - 2;
                return (
                  <div key={entry.memberId}>
                    {showGap && (
                      <div className="px-4 py-1 text-center text-xs text-slate-300 dark:text-slate-600">· · ·</div>
                    )}
                    <div className={`flex items-center gap-3 px-4 py-2.5 ${entry.isMe ? "bg-indigo-50/60 dark:bg-indigo-900/20" : ""}`}>
                      <div className="w-7 text-center shrink-0">
                        {MEDAL[entry.rank] ? (
                          <span className="text-lg">{MEDAL[entry.rank]}</span>
                        ) : (
                          <span className={`text-sm font-bold ${entry.isMe ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
                            #{entry.rank}
                          </span>
                        )}
                      </div>

                      {entry.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.photo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {entry.name.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${entry.isMe ? "font-semibold text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`}>
                          {entry.name}
                          {entry.isMe && (
                            <span className="ml-1.5 text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
                              {t("you")}
                            </span>
                          )}
                        </p>
                      </div>

                      <span className={`text-sm font-semibold tabular-nums shrink-0 ${entry.isMe ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}`}>
                        {entry.visits}×
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
