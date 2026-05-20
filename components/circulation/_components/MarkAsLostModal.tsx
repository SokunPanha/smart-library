"use client";

import { useState } from "react";
import { Modal, Button, InputNumber, Input, Avatar, Space } from "antd";
import { StopOutlined, BookOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import type { Loan } from "../helper/useFetchLoans";

interface Props {
  loan: Loan | null;
  onConfirm: (loan: Loan, fineAmount: number, fineNote: string) => Promise<void>;
  onClose: () => void;
}

export function MarkAsLostModal({ loan, onConfirm, onClose }: Props) {
  const t = useTranslations("circulation");
  const [fineAmount, setFineAmount] = useState<number | null>(null);
  const [fineNote, setFineNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!loan) return;
    setLoading(true);
    try {
      await onConfirm(loan, fineAmount ?? 0, fineNote);
      handleClose();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setFineAmount(null);
    setFineNote("");
    onClose();
  }

  const bookTitle = loan ? (loan.book.titleKh ?? loan.book.titleEn) : "";
  const memberName = loan ? (loan.member.nameKh ?? loan.member.nameEn ?? loan.member.memberId) : "";

  return (
    <Modal
      open={!!loan}
      onCancel={handleClose}
      title={
        <span className="text-red-600 flex items-center gap-2">
          <StopOutlined />
          {t("lostTitle")}
        </span>
      }
      width={440}
      mask={{ closable: false }}
      destroyOnHidden
      footer={
        <div className="flex gap-2 justify-end">
          <Button onClick={handleClose}>{t("cancel")}</Button>
          <Button
            danger
            type="primary"
            icon={<StopOutlined />}
            loading={loading}
            onClick={handleConfirm}
          >
            {t("lostConfirm")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {/* Book + member info */}
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-3">
          {loan?.book.coverImage ? (
            <img src={loan.book.coverImage} alt="" className="w-10 h-14 object-cover rounded shrink-0" />
          ) : (
            <Avatar shape="square" size={40} icon={<BookOutlined />} className="bg-slate-100 text-slate-400 shrink-0" />
          )}
          <div>
            <p className="font-semibold text-slate-800 leading-snug">{bookTitle}</p>
            <p className="text-sm text-slate-500 mt-0.5">{memberName}</p>
            <p className="text-xs font-mono text-slate-400">{loan?.member.memberId}</p>
          </div>
        </div>

        {/* Fine amount */}
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">
            {t("lostFineAmount")} <span className="text-slate-400 font-normal">({t("lostFineOptional")})</span>
          </label>
          <Space.Compact className="w-full">
            <InputNumber
              value={fineAmount}
              onChange={(v) => setFineAmount(v)}
              min={0}
              step={1000}
              className="w-full"
              placeholder="0"
              formatter={(v) => (v ? Number(v).toLocaleString() : "")}
              parser={(v) => Number((v ?? "").replace(/,/g, "")) as 0}
            />
            <Button disabled className="cursor-default!">៛</Button>
          </Space.Compact>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">
            {t("lostFineNote")} <span className="text-slate-400 font-normal">({t("optional")})</span>
          </label>
          <Input.TextArea
            value={fineNote}
            onChange={(e) => setFineNote(e.target.value)}
            placeholder={t("lostFineNotePlaceholder")}
            rows={2}
            maxLength={200}
            showCount
          />
        </div>
      </div>
    </Modal>
  );
}
