"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Spin, Tag } from "antd";
import { CloseOutlined, UserOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import dayjs from "dayjs";

const TYPE_COLOR: Record<string, string> = {
  STUDENT: "blue",
  TEACHER: "purple",
  PUBLIC: "green",
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

export default function PortalCardPage() {
  const t = useTranslations("portal.card");
  const tm = useTranslations("members.types");
  const [fullscreen, setFullscreen] = useState(false);

  const { data: member, isLoading } = useQuery<Member>({
    queryKey: ["portal-me"],
    queryFn: () => fetch("/api/portal/me").then((r) => r.json()),
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spin /></div>;
  }

  if (!member) return null;

  return (
    <div className="p-4 flex flex-col items-center">
      {/* Toolbar */}
      <div className="w-full max-w-sm flex items-center justify-between mb-4 print:hidden">
        <h2 className="text-lg font-semibold text-slate-800">{t("title")}</h2>
        {/* <Button
          icon={<PrinterOutlined />}
          size="small"
          onClick={() => window.print()}
        >
          {t("printCard")}
        </Button> */}
      </div>

      {/* Card — full width on mobile, capped on larger screens */}
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg border border-slate-100 print:shadow-none print:border-gray-300">

        {/* Header band */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-5 pt-6 pb-10 relative">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center flex-shrink-0">
              <img src="/LibraCore.png" alt="LibraCore" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-white font-semibold text-sm tracking-wide">LibraCore</span>
          </div>
          <p className="text-blue-200 text-xs mt-0.5">Library Member Card</p>
        </div>

        {/* Avatar — overlaps header/body */}
        <div className="relative px-5">
          <div className="absolute -top-10 left-5">
            {member.photo ? (
              <img
                src={member.photo}
                alt=""
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center">
                <UserOutlined className="text-2xl text-slate-400" />
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-5 pt-14 pb-5">
          {/* Name + type */}
          <div className="mb-4">
            <div className="font-bold text-slate-800 text-base leading-snug">
              {member.nameKh ?? member.nameEn}
            </div>
            {member.nameKh && member.nameEn && (
              <div className="text-sm text-slate-400">{member.nameEn}</div>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <Tag
                color={TYPE_COLOR[member.type] ?? "default"}
                className="text-xs m-0 border-0"
              >
                {tm(member.type as "STUDENT")}
              </Tag>
              {member.class && (
                <Tag className="text-xs m-0 border-0 bg-indigo-50 text-indigo-600">
                  {member.class.name}
                </Tag>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-y-3 mb-5 text-sm">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">
                {t("memberId")}
              </div>
              <div className="font-mono font-semibold text-slate-800 text-xs">
                {member.memberId}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">
                {t("memberSince")}
              </div>
              <div className="text-xs text-slate-700">
                {dayjs(member.createdAt).format("MMM YYYY")}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">
                {t("expires")}
              </div>
              <div className="text-xs text-slate-700">
                {member.expiresAt
                  ? dayjs(member.expiresAt).format("DD MMM YYYY")
                  : t("noExpiry")}
              </div>
            </div>
          </div>

          {/* QR code */}
          <div className="flex flex-col items-center border-t border-slate-50 pt-4">
            <button
              onClick={() => setFullscreen(true)}
              className="rounded-lg focus:outline-none active:opacity-70"
              aria-label="Expand QR code"
            >
              <QRCodeSVG
                value={member.memberId}
                size={140}
                level="M"
                includeMargin
                className="rounded-lg"
              />
            </button>
            <p className="text-xs text-slate-400 mt-1">{t("scanHint")}</p>
          </div>
        </div>
      </div>

      {/* Fullscreen QR overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center print:hidden"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-600"
            onClick={() => setFullscreen(false)}
            aria-label="Close"
          >
            <CloseOutlined />
          </button>
          <QRCodeSVG
            value={member.memberId}
            size={Math.min(window.innerWidth, window.innerHeight) - 80}
            level="H"
            includeMargin
          />
          <div className="mt-6 text-center px-6">
            <div className="font-mono font-bold text-slate-800 text-lg">{member.memberId}</div>
            <div className="text-sm text-slate-500 mt-1">{member.nameKh ?? member.nameEn}</div>
            <div className="text-xs text-slate-400 mt-3">{t("scanHint")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
