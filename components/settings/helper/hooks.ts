"use client";

import { makeContext } from "@/libs/hooks/context";
import { useState } from "react";

function useSettingsHook() {
  const [activeTab, setActiveTab] = useState("general");
  return { activeTab, setActiveTab };
}

export const [SettingsProvider, useSettingsContext] = makeContext(useSettingsHook);
