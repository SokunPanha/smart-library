"use client";

import { App } from "antd";
import { useCirculationContext } from "./hooks";
import { apiFetch } from "@/libs/utils/request";
import type { Loan } from "./useFetchLoans";

export function useLoans() {
  const { message } = App.useApp();
  const ctx = useCirculationContext();

  const returnBook = (loan: Loan) => {
    const { modal } = App.useApp();
    // We call this outside hooks so we import modal inline via useApp above
    // — handled in the component using App.useApp() directly
  };

  const closeLoan = async (loan: Loan, status: "RETURNED" | "LOST") => {
    const updated = await apiFetch<{ fineAmount: number }>(`/api/loans/${loan.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, finePaid: false }),
    });

    if (status === "RETURNED" && updated.fineAmount > 0) {
      message.warning(`Returned. Fine: ${updated.fineAmount.toLocaleString()} ៛`);
    } else if (status === "RETURNED") {
      message.success("Book returned successfully.");
    } else {
      message.warning("Book marked as lost.");
    }

    ctx.table.reload();
  };

  const checkout = async (values: {
    bookId: string;
    memberId: string;
    dueAt?: string;
  }) => {
    await apiFetch("/api/loans", {
      method: "POST",
      body: JSON.stringify(values),
    });
    message.success("Book checked out successfully.");
    ctx.checkoutModal.close();
    ctx.table.reload();
  };

  return { closeLoan, checkout };
}
