"use client";

import { Drawer, Tag, Avatar, Image, Tabs, Spin, Badge } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/request";

interface BookRef { id: string; titleKh: string | null; titleEn: string | null; author?: string | null }
interface Loan {
  id: string; status: string; borrowedAt: string; dueAt: string;
  returnedAt: string | null; fineAmount: number; finePaid: boolean;
  book: BookRef;
}
interface Reservation {
  id: string; status: string; reservedAt: string;
  book: BookRef;
}
interface VisitorLog {
  id: string; purpose: string; arrivedAt: string; leftAt: string | null;
  books: { book: BookRef }[];
}
interface MemberDetail {
  id: string; memberId: string; nameKh: string | null; nameEn: string | null;
  type: string; photo: string | null; email: string | null; phone: string | null;
  expiresAt: string | null;
  class: { name: string } | null;
  loans: Loan[];
  reservations: Reservation[];
  visitorLogs: VisitorLog[];
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "blue", OVERDUE: "red", RETURNED: "default", LOST: "orange",
  PENDING: "gold", FULFILLED: "green", CANCELLED: "default",
};

const TYPE_COLOR: Record<string, string> = {
  STUDENT: "blue", TEACHER: "green", PUBLIC: "default", RESEARCHER: "purple",
};

function elapsed(arrivedAt: string, leftAt: string | null) {
  const end = leftAt ? dayjs(leftAt) : dayjs();
  const mins = end.diff(dayjs(arrivedAt), "minute");
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

interface Props { memberId: string | null; onClose: () => void }

export function MemberProfileDrawer({ memberId, onClose }: Props) {
  const t = useTranslations("members");
  const tc = useTranslations("circulation");

  const { data: member, isLoading } = useQuery<MemberDetail>({
    queryKey: ["member-profile", memberId],
    queryFn: () => apiFetch<MemberDetail>(`/api/members/${memberId}`),
    enabled: !!memberId,
  });

  const activeLoans = member?.loans.filter((l) => l.status === "ACTIVE" || l.status === "OVERDUE") ?? [];
  const allLoans = member?.loans ?? [];
  const visits = member?.visitorLogs ?? [];
  const reservations = member?.reservations ?? [];

  const isExpired = member?.expiresAt ? dayjs(member.expiresAt).isBefore(dayjs()) : false;
  const isExpiringSoon = !isExpired && member?.expiresAt
    ? dayjs(member.expiresAt).isBefore(dayjs().add(30, "day"))
    : false;

  return (
    <Drawer
      open={!!memberId}
      onClose={onClose}
      title={t("profile.title")}
      styles={{ wrapper: { width: "min(520px, 100vw)" } }}
      destroyOnHidden
    >
      {isLoading || !member ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            {member.photo ? (
              <Image
                src={member.photo}
                alt=""
                width={64}
                height={64}
                className="rounded-full object-cover flex-shrink-0"
                style={{ borderRadius: "50%" }}
                preview={{ mask: false }}
              />
            ) : (
              <Avatar size={64} icon={<UserOutlined />} className="bg-slate-200 text-slate-500 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-base leading-snug">{member.nameKh ?? member.nameEn}</p>
              {member.nameKh && member.nameEn && (
                <p className="text-sm text-slate-400">{member.nameEn}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                  {member.memberId}
                </span>
                <Tag color={TYPE_COLOR[member.type] ?? "default"} className="border-0 text-xs m-0">
                  {t(`types.${member.type}`)}
                </Tag>
                {member.class && (
                  <Tag className="border-0 text-xs bg-indigo-50 text-indigo-600 m-0">{member.class.name}</Tag>
                )}
                {isExpired && (
                  <Tag color="red" className="border-0 text-xs m-0">{t("profile.expired")}</Tag>
                )}
                {isExpiringSoon && (
                  <Tag color="orange" className="border-0 text-xs m-0">{t("profile.expiringSoon")}</Tag>
                )}
              </div>
              {(member.email || member.phone) && (
                <p className="text-xs text-slate-400 mt-1.5">
                  {[member.email, member.phone].filter(Boolean).join(" · ")}
                </p>
              )}
              {member.expiresAt && (
                <p className={`text-xs mt-0.5 ${isExpired ? "text-red-500" : "text-slate-400"}`}>
                  Exp: {dayjs(member.expiresAt).format("DD/MM/YYYY")}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t("profile.statActiveLoans"), value: activeLoans.length, color: activeLoans.length > 0 ? "text-blue-600" : "text-slate-600" },
              { label: t("profile.statTotalLoans"), value: allLoans.length, color: "text-slate-600" },
              { label: t("profile.statVisits"), value: visits.length, color: "text-slate-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs
            size="small"
            items={[
              {
                key: "active",
                label: (
                  <Badge count={activeLoans.length} size="small" offset={[6, -2]}>
                    {t("profile.tabLoans")}
                  </Badge>
                ),
                children: (
                  <div className="space-y-2">
                    {activeLoans.length === 0 ? (
                      <p className="text-sm text-slate-300 py-4">{t("profile.noActiveLoans")}</p>
                    ) : activeLoans.map((loan) => (
                      <div key={loan.id} className="flex items-start gap-2 py-2 border-b border-slate-50 last:border-0">
                        <Tag color={STATUS_COLOR[loan.status]} className="border-0 text-xs mt-0.5 shrink-0">
                          {tc(`statuses.${loan.status}`)}
                        </Tag>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 leading-snug">{loan.book.titleKh ?? loan.book.titleEn}</p>
                          {loan.book.author && <p className="text-xs text-slate-400">{loan.book.author}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-500">{t("profile.dueAt")}</p>
                          <p className={`text-xs font-mono font-medium ${loan.status === "OVERDUE" ? "text-red-500" : "text-slate-600"}`}>
                            {dayjs(loan.dueAt).format("DD/MM/YY")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "history",
                label: t("profile.tabHistory"),
                children: (
                  <div className="space-y-1">
                    {allLoans.length === 0 ? (
                      <p className="text-sm text-slate-300 py-4">{t("profile.noLoanHistory")}</p>
                    ) : allLoans.map((loan) => (
                      <div key={loan.id} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                        <Tag color={STATUS_COLOR[loan.status]} className="border-0 text-xs shrink-0">
                          {tc(`statuses.${loan.status}`)}
                        </Tag>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{loan.book.titleKh ?? loan.book.titleEn}</p>
                          <p className="text-xs text-slate-400">
                            {dayjs(loan.borrowedAt).format("DD/MM/YY")}
                            {loan.returnedAt ? ` → ${dayjs(loan.returnedAt).format("DD/MM/YY")}` : ""}
                          </p>
                        </div>
                        {loan.fineAmount > 0 && (
                          <span className={`text-xs font-mono shrink-0 ${loan.finePaid ? "text-slate-300 line-through" : "text-red-500"}`}>
                            {loan.fineAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "visits",
                label: t("profile.tabVisits"),
                children: (
                  <div className="space-y-1">
                    {visits.length === 0 ? (
                      <p className="text-sm text-slate-300 py-4">{t("profile.noVisits")}</p>
                    ) : visits.map((v) => (
                      <div key={v.id} className="py-2 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-mono">
                            {dayjs(v.arrivedAt).format("DD/MM/YY HH:mm")}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {elapsed(v.arrivedAt, v.leftAt)}
                          </span>
                          <Tag className="border-0 text-xs bg-slate-50 text-slate-500 m-0">
                            {v.purpose}
                          </Tag>
                        </div>
                        {v.books.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {v.books.map(({ book }) => (
                              <span key={book.id} className="text-xs text-slate-400">
                                📖 {book.titleKh ?? book.titleEn}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: "reservations",
                label: t("profile.tabReservations"),
                children: (
                  <div className="space-y-1">
                    {reservations.length === 0 ? (
                      <p className="text-sm text-slate-300 py-4">{t("profile.noReservations")}</p>
                    ) : reservations.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                        <Tag color={STATUS_COLOR[r.status]} className="border-0 text-xs shrink-0">
                          {r.status}
                        </Tag>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{r.book.titleKh ?? r.book.titleEn}</p>
                          <p className="text-xs text-slate-400">{dayjs(r.reservedAt).format("DD/MM/YY")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
    </Drawer>
  );
}
