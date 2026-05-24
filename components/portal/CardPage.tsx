"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePortalQuery, portalFetch } from "./usePortalQuery";
import { QRCodeSVG } from "qrcode.react";
import dayjs from "dayjs";
import "dayjs/locale/km";
import { Spinner, Badge } from "./ui";

const TYPE_COLOR: Record<string, string> = {
  STUDENT:    "blue",
  TEACHER:    "purple",
  PUBLIC:     "green",
  RESEARCHER: "orange",
};

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

function UserIcon() {
  return (
    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12"/>
    </svg>
  );
}

export default function PortalCardPage() {
  const t      = useTranslations("portal.card");
  const tm     = useTranslations("members.types");
  const locale = useLocale();
  const [fullscreen, setFullscreen] = useState(false);

  const { data: member, isLoading, isError } = usePortalQuery<Member>({
    queryKey: ["portal-me"],
    queryFn: () => portalFetch("/api/portal/me") as Promise<Member>,
  });

  if (isLoading) return <Spinner className="py-16" />;
  if (isError || !member) return null;

  return (
    <div className="p-4 flex flex-col items-center">
      <div className="w-full max-w-sm flex items-center justify-between mb-4 print:hidden">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t("title")}</h2>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-700 print:shadow-none">

        {/* Header band */}
        <div className="bg-linear-to-r from-indigo-700 to-blue-500 px-5 pt-6 pb-12 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute top-10 -right-4  w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
          <div className="flex items-center gap-2 relative">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/LibraCore.png" alt="LibraCore" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-white font-semibold text-sm tracking-wide">LibraCore</span>
          </div>
          <p className="text-blue-200 text-xs mt-0.5 relative">{t("subtitle")}</p>
        </div>

        {/* Avatar overlap */}
        <div className="relative px-5">
          <div className="absolute -top-10 left-5">
            {member.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photo}
                alt=""
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-lg flex items-center justify-center">
                <UserIcon />
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="bg-white dark:bg-slate-800 px-5 pt-14 pb-5">
          {/* Name */}
          <div className="mb-4">
            <p className="font-bold text-slate-800 dark:text-white text-base leading-snug">
              {member.nameKh ?? member.nameEn}
            </p>
            {member.nameKh && member.nameEn && (
              <p className="text-sm text-slate-400 dark:text-slate-500">{member.nameEn}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <Badge color={TYPE_COLOR[member.type] ?? "default"}>
                {tm(member.type as "STUDENT")}
              </Badge>
              {member.class && (
                <Badge color="purple">{member.class.name}</Badge>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-y-3 mb-5 text-sm">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
                {t("memberId")}
              </p>
              <p className="font-mono font-semibold text-slate-800 dark:text-slate-100 text-xs">
                {member.memberId}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
                {t("memberSince")}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {dayjs(member.createdAt).locale(locale).format("MMM YYYY")}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
                {t("expires")}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {member.expiresAt
                  ? dayjs(member.expiresAt).locale(locale).format("DD MMM YYYY")
                  : t("noExpiry")}
              </p>
            </div>
          </div>

          {/* QR code */}
          <div className="flex flex-col items-center border-t border-slate-50 dark:border-slate-700 pt-4">
            <button
              onClick={() => setFullscreen(true)}
              className="rounded-2xl focus:outline-none active:opacity-70 overflow-hidden"
              aria-label="Expand QR code"
            >
              <QRCodeSVG value={member.memberId} size={140} level="M" marginSize={2} className="rounded-xl" />
            </button>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t("scanHint")}</p>
          </div>
        </div>
      </div>

      {/* Fullscreen QR overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col items-center justify-center print:hidden"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            onClick={() => setFullscreen(false)}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
          <QRCodeSVG
            value={member.memberId}
            size={Math.min(window.innerWidth, window.innerHeight) - 80}
            level="H"
            marginSize={2}
          />
          <div className="mt-6 text-center px-6">
            <p className="font-mono font-bold text-slate-800 dark:text-white text-lg">{member.memberId}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{member.nameKh ?? member.nameEn}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">{t("scanHint")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
