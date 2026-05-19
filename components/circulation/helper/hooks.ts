"use client";

import { useState } from "react";
import { makeContext } from "@/lib/context";
import { useFormDrawer } from "@/lib/form";
import { useTable } from "@/lib/table";

export const [CirculationProvider, useCirculationContext] = makeContext(() => {
  return {
    table: useTable(["loans"]),
    checkoutModal: useFormDrawer(),
    statusFilter: useState(""),
  };
});
