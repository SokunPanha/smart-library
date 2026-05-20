"use client";

import { useRef, useState, useEffect } from "react";
import { Modal, Button, Space, Input } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/request";
import type { Member } from "../helper/useFetchMembers";

interface Props {
  member: Member | null;
  onClose: () => void;
}

const TYPE_COLOR: Record<string, string> = {
  STUDENT: "#3b82f6",
  TEACHER: "#22c55e",
  PUBLIC: "#64748b",
  RESEARCHER: "#8b5cf6",
};

export function buildMemberCardHtml(
  member: { memberId: string; nameKh: string | null; nameEn: string | null; type: string; photo: string | null; expiresAt: string | null; class?: { name: string } | null },
  qrSvg: string,
  libraryName: string,
): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const color = TYPE_COLOR[member.type] ?? "#64748b";
  const nameKh = member.nameKh ?? member.nameEn ?? member.memberId;
  const nameEn = member.nameKh && member.nameEn ? member.nameEn : null;
  const className = member.class?.name ?? null;
  const expiry = member.expiresAt ? dayjs(member.expiresAt).format("DD/MM/YYYY") : null;
  const photoHtml = member.photo
    ? `<img src="${escape(member.photo)}" style="width:22mm;height:28mm;object-fit:cover;border-radius:1mm;display:block;" crossorigin="anonymous" />`
    : `<div style="width:22mm;height:28mm;background:#f1f5f9;border-radius:1mm;display:flex;align-items:center;justify-content:center;font-size:18pt;color:#cbd5e1;">👤</div>`;

  return `
<div class="card">
  <div class="header" style="background:${color};">
    <span class="lib-name">${escape(libraryName)}</span>
    <span class="type-label">${escape(member.type)}</span>
  </div>
  <div class="body">
    <div class="photo">${photoHtml}</div>
    <div class="info">
      <div class="info-top">
        <p class="name-kh">${escape(nameKh)}</p>
        ${nameEn ? `<p class="name-en">${escape(nameEn)}</p>` : ""}
        ${className ? `<p class="meta">${escape(className)}</p>` : ""}
        ${expiry ? `<p class="meta">Exp: ${escape(expiry)}</p>` : ""}
      </div>
      <div class="info-bottom">
        <p class="member-id">${escape(member.memberId)}</p>
        <div class="qr">${qrSvg}</div>
      </div>
    </div>
  </div>
</div>`;
}

export function MemberQRModal({ member, onClose }: Props) {
  const t = useTranslations("members");
  const tc = useTranslations("common");
  const qrRef = useRef<HTMLDivElement>(null);

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["settings"],
    queryFn: () => apiFetch<Record<string, string>>("/api/settings"),
  });
  const libraryName = settings?.libraryNameKh ?? settings?.libraryNameEn ?? "បណ្ណាល័យ វិ.ហ.ស.ខ្ច";
  const [cardTitle, setCardTitle] = useState("");

  useEffect(() => {
    if (libraryName) setCardTitle(libraryName);
  }, [libraryName]);

  function handlePrint() {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl || !member) return;
    const qrSvg = new XMLSerializer().serializeToString(svgEl);
    const cardHtml = buildMemberCardHtml(member, qrSvg, cardTitle);

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Member Card — ${member.memberId}</title>
    <style>
      ${CARD_PRINT_CSS}
      body { display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    </style>
  </head>
  <body>
    ${cardHtml}
    <script>window.onload = () => { window.print(); window.close(); }<\/script>
  </body>
</html>`);
    win.document.close();
  }

  const color = TYPE_COLOR[member?.type ?? "PUBLIC"] ?? "#64748b";

  return (
    <Modal
      title={t("qrCode")}
      open={!!member}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>{tc("cancel")}</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            {t("printQR")}
          </Button>
        </Space>
      }
      width={380}
      centered
      destroyOnHidden
    >
      {member && (
        <div className="flex flex-col items-center gap-4 py-3">
          {/* Title input */}
          <Input
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            placeholder={libraryName}
            prefix={<span className="text-slate-400 text-xs">Title</span>}
            className="text-sm"
          />

          {/* Card preview */}
          <div
            className="rounded-lg overflow-hidden shadow-md"
            style={{ width: 300, fontFamily: "Arial, sans-serif" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ background: color }}
            >
              <span className="text-white text-xs font-bold truncate flex-1">{cardTitle || libraryName}</span>
              <span className="text-white/70 text-[10px] uppercase ml-2 shrink-0">{member.type}</span>
            </div>
            {/* Body */}
            <div className="flex gap-3 p-3 bg-white">
              {/* Photo */}
              <div className="shrink-0">
                {member.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photo}
                    alt=""
                    className="object-cover rounded"
                    style={{ width: 64, height: 80 }}
                  />
                ) : (
                  <div
                    className="bg-slate-100 rounded flex items-center justify-center text-slate-300 text-2xl"
                    style={{ width: 64, height: 80 }}
                  >
                    👤
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <p className="font-bold text-slate-800 text-sm leading-snug">{member.nameKh ?? member.nameEn}</p>
                  {member.nameKh && member.nameEn && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{member.nameEn}</p>
                  )}
                  {member.class && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{member.class.name}</p>
                  )}
                  {member.expiresAt && (
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      Exp: {dayjs(member.expiresAt).format("DD/MM/YYYY")}
                    </p>
                  )}
                </div>
                <div className="flex items-end justify-between mt-1">
                  <span className="font-mono text-[11px] text-slate-500 font-semibold">{member.memberId}</span>
                  <div ref={qrRef}>
                    <QRCodeSVG value={member.memberId} size={52} level="M" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">{t("qrScanHint")}</p>
        </div>
      )}
    </Modal>
  );
}

export const CARD_PRINT_CSS = `
  @page { margin: 8mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: white; }
  .card {
    width: 85.6mm; height: 54mm;
    border-radius: 3mm;
    overflow: hidden;
    border: 0.5pt solid #d1d5db;
    display: flex;
    flex-direction: column;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .header {
    height: 10mm;
    display: flex;
    align-items: center;
    padding: 0 4mm;
    gap: 2mm;
  }
  .lib-name {
    color: white;
    font-size: 7.5pt;
    font-weight: 700;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .type-label {
    color: rgba(255,255,255,0.75);
    font-size: 6pt;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .body {
    display: flex;
    flex: 1;
    padding: 2.5mm 3mm;
    gap: 3mm;
    background: white;
  }
  .photo { flex-shrink: 0; }
  .info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
  .info-top { display: flex; flex-direction: column; gap: 0.5mm; }
  .name-kh { font-size: 8pt; font-weight: 700; color: #1e293b; line-height: 1.3; }
  .name-en { font-size: 6.5pt; color: #64748b; line-height: 1.2; }
  .meta { font-size: 6pt; color: #94a3b8; line-height: 1.3; }
  .info-bottom { display: flex; align-items: flex-end; justify-content: space-between; }
  .member-id { font-size: 6.5pt; font-family: monospace; color: #475569; font-weight: 600; }
  .qr { width: 16mm; height: 16mm; flex-shrink: 0; }
  .qr svg { width: 16mm !important; height: 16mm !important; display: block; }
  /* Bulk grid */
  .grid { display: grid; grid-template-columns: repeat(2, 85.6mm); gap: 4mm; }
  .page { page-break-after: always; break-after: page; }
  .page:last-child { page-break-after: avoid; break-after: avoid; }
`;
