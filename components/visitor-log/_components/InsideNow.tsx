"use client";

import { Tag, Spin, Button, App } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/request";
import { PURPOSE_COLOR } from "../constants";

interface VisitorLog {
  id: string;
  purpose: string;
  arrivedAt: string;
  member: { id: string; memberId: string; nameKh: string | null; nameEn: string | null; type: string; class?: { name: string } | null };
  books: { book: { id: string; titleKh: string | null; titleEn: string | null } }[];
}

function elapsed(arrivedAt: string) {
  const mins = dayjs().diff(dayjs(arrivedAt), "minute");
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function InsideNow() {
  const t = useTranslations("visitorLog");
  const { message } = App.useApp();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["visitor-log", "open"],
    queryFn: () => apiFetch<{ logs: VisitorLog[]; total: number }>("/api/visitor-log?openOnly=true&limit=100"),
    refetchInterval: 30_000,
  });

  const checkoutMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/visitor-log/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "checkout" }) }),
    onSuccess: () => {
      message.success(t("checkoutSuccess"));
      qc.invalidateQueries({ queryKey: ["visitor-log"] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  if (isLoading) return <Spin />;

  const logs = data?.logs ?? [];

  if (logs.length === 0) return <p className="text-sm text-slate-300 py-4">{t("insideEmpty")}</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">{t("insideNow", { count: logs.length })}</p>
      <div className="divide-y divide-slate-100">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center gap-3 py-2 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <p className="font-medium text-slate-800 text-sm leading-snug">
                {log.member.nameKh ?? log.member.nameEn}
              </p>
              <div className="flex gap-1 mt-0.5 flex-wrap">
                <span className="text-xs text-slate-400">{log.member.memberId}</span>
                {log.member.class && (
                  <Tag className="border-0 text-xs bg-indigo-50 text-indigo-600">{log.member.class.name}</Tag>
                )}
              </div>
              {log.books.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {log.books.map(({ book }) => (
                    <span key={book.id} className="text-xs text-slate-400">📖 {book.titleKh ?? book.titleEn}</span>
                  ))}
                </div>
              )}
            </div>
            <Tag color={PURPOSE_COLOR[log.purpose] ?? "default"} className="border-0 text-xs">
              {t(`purposes.${log.purpose}`)}
            </Tag>
            <span className="text-xs text-slate-400 font-mono">{elapsed(log.arrivedAt)}</span>
            <Button
              size="small"
              danger
              icon={<LogoutOutlined />}
              loading={checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate(log.id)}
            >
              {t("checkOut")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
