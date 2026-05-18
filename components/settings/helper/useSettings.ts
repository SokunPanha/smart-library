"use client";

import { App } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/libs/utils/request";

export function useSettings() {
  const { message } = App.useApp();
  const qc = useQueryClient();

  async function saveSettings(values: Record<string, string>) {
    try {
      await apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify(values) });
      message.success("Settings saved.");
      qc.invalidateQueries({ queryKey: ["settings"] });
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "Failed to save settings.");
    }
  }

  return { saveSettings };
}
