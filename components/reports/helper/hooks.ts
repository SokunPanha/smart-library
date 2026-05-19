"use client";

import { makeContext } from "@/lib/context";
import { useState } from "react";

function useReportsHook() {
  const [activeTab, setActiveTab] = useState("popular");
  return { activeTab, setActiveTab };
}

export const [ReportsProvider, useReportsContext] = makeContext(useReportsHook);
