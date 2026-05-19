"use client";

import { useRef } from "react";
import { Modal, Button, Space } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";
import type { Member } from "../helper/useFetchMembers";

interface Props {
  member: Member | null;
  onClose: () => void;
}

export function MemberQRModal({ member, onClose }: Props) {
  const t = useTranslations("members");
  const tc = useTranslations("common");
  const qrRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl || !member) return;

    const svgContent = new XMLSerializer().serializeToString(svgEl);
    const displayName = member.nameKh ?? member.nameEn ?? member.memberId;
    const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>QR - ${member.memberId}</title>
    <style>
      body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: Arial, sans-serif; }
      .card { width: 60mm; height: 52mm; border: 1.5px dashed #aaa; padding: 3mm; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2mm; }
      .card svg { display: block; width: 28mm !important; height: 28mm !important; }
      .name { font-size: 8pt; font-weight: 700; text-align: center; line-height: 1.35; max-width: 55mm; word-break: break-word; margin: 0; }
      .mid { font-size: 7pt; color: #555; margin: 0; }
    </style>
  </head>
  <body>
    <div class="card">
      ${svgContent}
      <p class="name">${escape(displayName)}</p>
      <p class="mid">${escape(member.memberId)}</p>
    </div>
    <script>window.onload = () => { window.print(); window.close(); }</script>
  </body>
</html>`);
    win.document.close();
  }

  const displayName = member?.nameKh ?? member?.nameEn ?? member?.memberId;

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
      width={320}
      centered
    >
      {member && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div ref={qrRef}>
            <QRCodeSVG value={member.memberId} size={200} level="M" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800 text-sm leading-snug">{displayName}</p>
            {member.nameKh && member.nameEn && (
              <p className="text-xs text-slate-400 mt-0.5">{member.nameEn}</p>
            )}
            <p className="text-xs text-slate-500 mt-1 font-mono">{member.memberId}</p>
          </div>
          <p className="text-xs text-slate-400">{t("qrScanHint")}</p>
        </div>
      )}
    </Modal>
  );
}
