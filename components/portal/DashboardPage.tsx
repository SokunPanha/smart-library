"use client";

import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Typography, Spin, Tag } from "antd";
import {
  BookOutlined,
  WarningOutlined,
  RightOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface Member {
  memberId: string;
  nameKh: string | null;
  nameEn: string | null;
  type: string;
  expiresAt: string | null;
  createdAt: string;
}

interface Loan {
  id: string;
  status: string;
  dueAt: string;
  book: { titleKh: string | null; titleEn: string; coverImage: string | null };
}

export default function PortalDashboardPage() {
  const t = useTranslations("portal.dashboard");
  const tl = useTranslations("portal.loans");
  const locale = useLocale();

  const { data: member, isLoading: memberLoading } = useQuery<Member>({
    queryKey: ["portal-me"],
    queryFn: () => fetch("/api/portal/me").then((r) => r.json()),
  });

  const { data: loansData, isLoading: loansLoading } = useQuery<{ loans: Loan[] }>({
    queryKey: ["portal-loans-active"],
    queryFn: () => fetch("/api/portal/loans?status=ACTIVE").then((r) => r.json()),
  });

  const { data: visitsData } = useQuery<{ total: number; thisYear: number }>({
    queryKey: ["portal-visits-summary"],
    queryFn: () => fetch("/api/portal/visits").then((r) => r.json()),
  });

  const activeLoans = loansData?.loans ?? [];
  const overdueLoans = activeLoans.filter(
    (l) => l.status === "OVERDUE" || dayjs(l.dueAt).isBefore(dayjs(), "day")
  );

  const displayName = member?.nameKh ?? member?.nameEn ?? member?.memberId ?? "";

  if (memberLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Greeting */}
      <div className="pt-2">
        <Title level={4} className="!mb-0 !text-slate-800">
          {t("greeting", { name: displayName })}
        </Title>
        <Text className="text-slate-500 text-sm">{member?.memberId}</Text>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOutlined className="text-blue-600" />
            <Text className="text-sm text-blue-700 font-medium">{t("activeLoans")}</Text>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {loansLoading ? "—" : activeLoans.length}
          </div>
        </div>
        <div className={`rounded-xl p-4 ${overdueLoans.length > 0 ? "bg-red-50" : "bg-slate-50"}`}>
          <div className="flex items-center gap-2 mb-1">
            <WarningOutlined className={overdueLoans.length > 0 ? "text-red-500" : "text-slate-400"} />
            <Text className={`text-sm font-medium ${overdueLoans.length > 0 ? "text-red-600" : "text-slate-500"}`}>
              {t("overdueLoans")}
            </Text>
          </div>
          <div className={`text-2xl font-bold ${overdueLoans.length > 0 ? "text-red-600" : "text-slate-500"}`}>
            {loansLoading ? "—" : overdueLoans.length}
          </div>
        </div>
        <Link href={`/${locale}/visits`} className="col-span-2">
          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EnvironmentOutlined className="text-slate-500" />
              <div>
                <Text className="text-sm text-slate-600 font-medium">{t("libraryVisits")}</Text>
                <div className="text-xs text-slate-400">{t("thisYear", { year: new Date().getFullYear() })}: {visitsData?.thisYear ?? 0}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-700">{visitsData?.total ?? 0}</span>
              <RightOutlined className="text-slate-300 text-xs" />
            </div>
          </div>
        </Link>
      </div>

      {/* Member info */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-2">
        <div className="flex justify-between items-center">
          <Text className="text-slate-500 text-sm">{t("memberId")}</Text>
          <Text className="font-mono text-sm font-medium">{member?.memberId}</Text>
        </div>
        <div className="flex justify-between items-center">
          <Text className="text-slate-500 text-sm">{t("memberSince")}</Text>
          <Text className="text-sm">{member?.createdAt ? dayjs(member.createdAt).format("DD MMM YYYY") : "—"}</Text>
        </div>
        <div className="flex justify-between items-center">
          <Text className="text-slate-500 text-sm">{t("expires")}</Text>
          <Text className="text-sm">
            {member?.expiresAt ? dayjs(member.expiresAt).format("DD MMM YYYY") : t("noExpiry")}
          </Text>
        </div>
      </div>

      {/* Active loans preview */}
      {activeLoans.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <Text className="font-medium text-slate-800">{t("activeLoans")}</Text>
            <Link href={`/${locale}/loans`} className="text-blue-600 text-sm flex items-center gap-1">
              {t("viewLoans")} <RightOutlined className="text-xs" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {activeLoans.slice(0, 3).map((loan) => {
              const isOverdue = dayjs(loan.dueAt).isBefore(dayjs(), "day");
              return (
                <div key={loan.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-10 bg-slate-100 rounded flex-shrink-0 overflow-hidden">
                    {loan.book.coverImage ? (
                      <img src={loan.book.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BookOutlined className="text-slate-400 text-xs m-auto mt-3 block" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {loan.book.titleKh ?? loan.book.titleEn}
                    </div>
                    <div className={`text-xs ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                      {isOverdue
                        ? tl("overdueDays", { days: dayjs().diff(dayjs(loan.dueAt), "day") })
                        : `${tl("daysLeft", { days: dayjs(loan.dueAt).diff(dayjs(), "day") })}`}
                    </div>
                  </div>
                  {isOverdue && <Tag color="red" className="text-xs">{tl("statuses.OVERDUE")}</Tag>}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 p-6 text-center">
          <Text className="text-slate-400 text-sm">{t("noLoans")}</Text>
          <div className="mt-3">
            <Link href={`/${locale}/books`} className="text-blue-600 text-sm font-medium">
              {t("browseBooks")} →
            </Link>
          </div>
        </div>
      )}

      {/* Quick access to card */}
      <Link href={`/${locale}/card`}>
        <div className="bg-blue-600 rounded-xl p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <IdcardOutlined className="text-xl" />
            <div>
              <div className="font-medium text-sm">My Library Card</div>
              <div className="text-xs text-blue-200">{member?.memberId}</div>
            </div>
          </div>
          <RightOutlined />
        </div>
      </Link>
    </div>
  );
}
