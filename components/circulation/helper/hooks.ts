"use client";

import { useState } from "react";
import { makeContext } from "@/libs/hooks/context";
import { useModalForm } from "@/libs/hooks/form";
import { useTable } from "@/libs/hooks/table";

export const [CirculationProvider, useCirculationContext] = makeContext(() => {
  return {
    table: useTable(["loans"]),
    checkoutModal: useModalForm(),
    statusFilter: useState(""),
  };
});
