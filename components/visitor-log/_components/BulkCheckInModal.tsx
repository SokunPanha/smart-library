"use client";

import { useState } from "react";
import { Modal, Button, Segmented, Avatar, Image, Tag, App, Spin } from "antd";
import { QrcodeOutlined, CloseOutlined, UserOutlined, LoginOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/request";
import { QrScanner } from "./QrScanner";
import { PURPOSES, PURPOSE_COLOR, type Purpose } from "../constants";

const PURPOSE_SELECTED_CLASS: Record<string, string> = {
  READING: "bg-blue-500 border-blue-500 text-white",
  BORROWING: "bg-green-500 border-green-500 text-white",
  SCHOOLWORK: "bg-orange-500 border-orange-500 text-white",
  RESEARCH: "bg-purple-500 border-purple-500 text-white",
  OTHER: "bg-slate-500 border-slate-500 text-white",
};

interface MemberInfo {
  id: string;
  memberId: string;
  nameKh: string | null;
  nameEn: string | null;
  type: string;
  photo?: string | null;
  class?: { name: string } | null;
}

interface OpenVisit {
  id: string;
}

interface BulkRow {
  member: MemberInfo;
  openVisit: OpenVisit | null;
  purpose: Purpose | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCheckedIn: () => void;
}

type PurposeMode = "same" | "individual";

export function BulkCheckInModal({ open, onClose, onCheckedIn }: Props) {
  const t = useTranslations("visitorLog");
  const { message } = App.useApp();

  const [scanning, setScanning] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [purposeMode, setPurposeMode] = useState<PurposeMode>("same");
  const [bulkPurpose, setBulkPurpose] = useState<Purpose | null>(null);
  const [loading, setLoading] = useState(false);

  async function resolveMember(qrValue: string) {
    setResolving(true);
    try {
      const res = await apiFetch<{ members: MemberInfo[]; total: number }>(
        `/api/members?search=${encodeURIComponent(qrValue)}&limit=1`
      );
      const found = res.members[0];
      if (!found) { message.error(t("memberNotFound")); return; }

      if (rows.some((r) => r.member.id === found.id)) {
        message.info(t("bulk.duplicate"));
        return;
      }

      const logRes = await apiFetch<{ logs: OpenVisit[]; total: number }>(
        `/api/visitor-log?openOnly=true&search=${encodeURIComponent(qrValue)}&limit=1`
      );
      const openVisit = logRes.logs[0] ?? null;

      setRows((prev) => [...prev, { member: found, openVisit, purpose: null }]);
    } catch {
      message.error(t("memberNotFound"));
    } finally {
      setResolving(false);
    }
  }

  function setRowPurpose(memberId: string, purpose: Purpose) {
    setRows((prev) => prev.map((r) => r.member.id === memberId ? { ...r, purpose } : r));
  }

  function removeRow(memberId: string) {
    setRows((prev) => prev.filter((r) => r.member.id !== memberId));
  }

  async function handleSubmit() {
    if (rows.length === 0) { message.warning(t("bulk.membersRequired")); return; }

    if (purposeMode === "same" && !bulkPurpose) {
      message.warning(t("bulk.purposeRequired"));
      return;
    }

    if (purposeMode === "individual") {
      const missing = rows.find((r) => !r.openVisit && !r.purpose);
      if (missing) {
        message.warning(t("bulk.individualPurposeRequired", { name: missing.member.nameKh ?? missing.member.nameEn ?? missing.member.memberId }));
        return;
      }
    }

    setLoading(true);
    const results = await Promise.allSettled(
      rows.map((row) => {
        if (row.openVisit) {
          return apiFetch(`/api/visitor-log/${row.openVisit.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "checkout" }),
          });
        }
        const purpose = purposeMode === "same" ? bulkPurpose! : row.purpose!;
        return apiFetch("/api/visitor-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: row.member.id, purpose, bookIds: [] }),
        });
      })
    );
    setLoading(false);

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    const failedSuffix = failed > 0 ? t("bulk.resultFailed", { count: failed }) : "";
    message.success(t("bulk.result", { success, failed: failedSuffix }));

    onCheckedIn();
    handleClose();
  }

  function handleClose() {
    setRows([]);
    setPurposeMode("same");
    setBulkPurpose(null);
    setScanning(false);
    onClose();
  }

  const checkInCount = rows.filter((r) => !r.openVisit).length;
  const checkOutCount = rows.filter((r) => !!r.openVisit).length;

  return (
    <>
      <Modal
        open={open}
        onCancel={handleClose}
        title={t("bulk.title")}
        width={560}
        destroyOnHidden
        mask={{ closable: false }}
        footer={
          <Button
            type="primary"
            icon={<LoginOutlined />}
            loading={loading}
            disabled={rows.length === 0}
            onClick={handleSubmit}
            block
            size="large"
          >
            {t("bulk.submitAll", { count: rows.length })}
          </Button>
        }
      >
        <div className="space-y-4 py-2">
          {/* Purpose mode + bulk purpose */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">{t("bulk.purposeMode")}:</span>
            <Segmented
              size="small"
              value={purposeMode}
              onChange={(v) => setPurposeMode(v as PurposeMode)}
              options={[
                { label: t("bulk.sameForAll"), value: "same" },
                { label: t("bulk.individual"), value: "individual" },
              ]}
            />
          </div>

          {purposeMode === "same" && (
            <div className="flex flex-wrap gap-2">
              {PURPOSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setBulkPurpose(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    bulkPurpose === p
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-slate-300 text-slate-600 hover:border-blue-400"
                  }`}
                >
                  {t(`purposes.${p}`)}
                </button>
              ))}
            </div>
          )}

          {/* Scan button + spinner */}
          <div className="flex items-center gap-2">
            <Button
              icon={<QrcodeOutlined />}
              onClick={() => setScanning(true)}
              type="dashed"
            >
              {t("bulk.scanToAdd")}
            </Button>
            {resolving && <Spin size="small" />}
            {rows.length > 0 && (
              <span className="text-xs text-slate-400 ml-auto">
                {t("bulk.memberCount", { count: rows.length })}
                {checkOutCount > 0 && (
                  <span className="text-orange-500 ml-1">({checkOutCount} {t("checkOut")})</span>
                )}
                {checkInCount > 0 && (
                  <span className="text-blue-500 ml-1">({checkInCount} {t("checkIn")})</span>
                )}
              </span>
            )}
          </div>

          {/* Member rows */}
          {rows.length > 0 && (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto rounded-lg border border-slate-100">
              {rows.map((row) => (
                <div key={row.member.id} className="flex items-start gap-3 px-3 py-2.5">
                  {/* Avatar */}
                  {row.member.photo ? (
                    <Image
                      src={row.member.photo}
                      alt=""
                      width={36}
                      height={36}
                      className="rounded-full object-cover shrink-0"
                      style={{ borderRadius: "50%" }}
                      preview={{ mask: false }}
                    />
                  ) : (
                    <Avatar size={36} icon={<UserOutlined />} className="bg-slate-100 text-slate-400 shrink-0" />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 leading-snug truncate">
                      {row.member.nameKh ?? row.member.nameEn}
                    </p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400">{row.member.memberId}</span>
                      {row.member.class && (
                        <Tag className="border-0 text-xs bg-indigo-50 text-indigo-600 m-0">{row.member.class.name}</Tag>
                      )}
                      {row.openVisit && (
                        <Tag color="orange" className="border-0 text-xs m-0">{t("bulk.alreadyInside")}</Tag>
                      )}
                    </div>

                    {/* Individual purpose picker */}
                    {purposeMode === "individual" && !row.openVisit && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {PURPOSES.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setRowPurpose(row.member.id, p)}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                              row.purpose === p
                                ? (PURPOSE_SELECTED_CLASS[p] ?? "bg-slate-500 border-slate-500 text-white")
                                : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                            }`}
                          >
                            {t(`purposes.${p}`)}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Show selected purpose as tag when in individual mode */}
                    {purposeMode === "individual" && !row.openVisit && row.purpose && (
                      <Tag color={PURPOSE_COLOR[row.purpose]} className="border-0 text-xs mt-1">
                        {t(`purposes.${row.purpose}`)}
                      </Tag>
                    )}
                  </div>

                  {/* Remove */}
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    className="text-slate-400 hover:text-red-500 shrink-0 mt-0.5"
                    onClick={() => removeRow(row.member.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {scanning && (
        <QrScanner
          onScan={resolveMember}
          onClose={() => setScanning(false)}
          title={t("scanMember")}
          persistent
        />
      )}
    </>
  );
}
