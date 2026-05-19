"use client";

import { App } from "antd";
import { useTranslations } from "next-intl";
import { useCirculationContext } from "./hooks";
import { apiFetch } from "@/libs/utils/request";
import type { Loan } from "./useFetchLoans";

export function useLoans() {
  const { message } = App.useApp();
  const ctx = useCirculationContext();
  const t = useTranslations("circulation");

  const closeLoan = async (loan: Loan, status: "RETURNED" | "LOST") => {
    const updated = await apiFetch<{ fineAmount: number }>(`/api/loans/${loan.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, finePaid: false }),
    });

    if (status === "RETURNED" && updated.fineAmount > 0) {
      message.warning(t("returnedWithFine", { amount: updated.fineAmount.toLocaleString() }));
    } else if (status === "RETURNED") {
      message.success(t("returnSuccess"));
    } else {
      message.warning(t("lostMarked"));
    }

    ctx.table.reload();
  };

  return { closeLoan };
}
