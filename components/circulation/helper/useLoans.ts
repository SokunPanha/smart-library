"use client";

import { App } from "antd";
import { useTranslations } from "next-intl";
import { useCirculationContext } from "./hooks";
import { apiFetch } from "@/lib/request";
import type { Loan } from "./useFetchLoans";

export function useLoans() {
  const { message } = App.useApp();
  const ctx = useCirculationContext();
  const t = useTranslations("circulation");

  const closeLoan = async (loan: Loan, status: "RETURNED") => {
    const updated = await apiFetch<{ fineAmount: number }>(`/api/loans/${loan.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (updated.fineAmount > 0) {
      message.warning(t("returnedWithFine", { amount: updated.fineAmount.toLocaleString() }));
    } else {
      message.success(t("returnSuccess"));
    }
    ctx.table.reload();
  };

  const markAsLost = async (loan: Loan, fineAmount: number, fineNote: string) => {
    await apiFetch(`/api/loans/${loan.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "LOST", fineAmount, fineNote: fineNote || null }),
    });
    message.warning(fineAmount > 0 ? t("lostMarkedWithFine", { amount: fineAmount.toLocaleString() }) : t("lostMarked"));
    ctx.table.reload();
  };

  const renewLoan = async (loan: Loan) => {
    try {
      await apiFetch(`/api/loans/${loan.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "renew" }),
      });
      message.success(t("renewSuccess"));
      ctx.table.reload();
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "MAX_RENEWALS_REACHED") {
        message.error(t("renewMaxReached"));
      } else {
        message.error(t("renewError"));
      }
    }
  };

  const payFine = async (loan: Loan) => {
    await apiFetch(`/api/loans/${loan.id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "payFine" }),
    });
    message.success(t("finePaySuccess", { amount: loan.fineAmount.toLocaleString() }));
    ctx.table.reload();
  };

  const waiveFine = async (loan: Loan, fineNote: string) => {
    await apiFetch(`/api/loans/${loan.id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "waiveFine", fineNote: fineNote || null }),
    });
    message.success(t("fineWaiveSuccess", { amount: loan.fineAmount.toLocaleString() }));
    ctx.table.reload();
  };

  return { closeLoan, markAsLost, renewLoan, payFine, waiveFine };
}
