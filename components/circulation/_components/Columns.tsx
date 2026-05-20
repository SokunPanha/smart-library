"use client";

import { Button, Space, Tag, Tooltip } from "antd";
import { CheckOutlined, StopOutlined, SyncOutlined, DollarOutlined, MinusCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { Loan } from "../helper/useFetchLoans";
import type { useLoans } from "../helper/useLoans";

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "blue",
  RETURNED: "green",
  OVERDUE: "red",
  LOST: "volcano",
};

interface ColumnArgs {
  actions: ReturnType<typeof useLoans>;
  onReturn: (loan: Loan) => void;
  onLost: (loan: Loan) => void;
  onRenew: (loan: Loan) => void;
  onPayFine: (loan: Loan) => void;
  onWaiveFine: (loan: Loan) => void;
  maxRenewals: number;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function buildLoanColumns({ onReturn, onLost, onRenew, onPayFine, onWaiveFine, maxRenewals, t }: ColumnArgs): ColumnsType<Loan> {
  return [
    {
      title: t("circulation.colBook"),
      key: "book",
      render: (_, row) => (
        <div className="flex gap-2 items-start">
          {row.book.coverImage ? (
            <img src={row.book.coverImage} alt="cover" className="w-8 h-11 object-cover rounded flex-shrink-0" />
          ) : (
            <div className="w-8 h-11 bg-slate-100 rounded flex-shrink-0" />
          )}
          <div>
            <p className="font-medium text-slate-800 leading-snug">{row.book.titleKh ?? row.book.titleEn}</p>
            {row.book.titleKh && row.book.titleEn && (
              <p className="text-xs text-slate-400">{row.book.titleEn}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t("circulation.colMember"),
      key: "member",
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800 leading-snug">{row.member.nameKh ?? row.member.nameEn ?? "—"}</p>
          {row.member.nameKh && row.member.nameEn && (
            <p className="text-xs text-slate-500">{row.member.nameEn}</p>
          )}
          <p className="text-xs font-mono text-slate-400">{row.member.memberId}</p>
        </div>
      ),
    },
    {
      title: t("circulation.colBorrowed"),
      dataIndex: "borrowedAt",
      key: "borrowedAt",
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: t("circulation.colDue"),
      dataIndex: "dueAt",
      key: "dueAt",
      render: (v, row) => {
        const overdue = row.status === "ACTIVE" && dayjs(v).isBefore(dayjs());
        return (
          <span className={overdue ? "text-red-500 font-medium" : "text-slate-600"}>
            {dayjs(v).format("DD/MM/YYYY")}
          </span>
        );
      },
    },
    {
      title: t("circulation.colDaysLeft"),
      key: "daysLeft",
      render: (_, row) => {
        if (row.status === "RETURNED" || row.status === "LOST") {
          return <span className="text-slate-300">—</span>;
        }
        const days = dayjs(row.dueAt).startOf("day").diff(dayjs().startOf("day"), "day");
        if (days < 0) {
          return <span className="text-red-500 font-medium">{t("circulation.daysOverdue", { count: Math.abs(days) })}</span>;
        }
        if (days === 0) {
          return <span className="text-orange-500 font-medium">{t("circulation.dueToday")}</span>;
        }
        return <span className={days <= 3 ? "text-orange-400 font-medium" : "text-slate-600"}>{t("circulation.daysLeft", { count: days })}</span>;
      },
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      render: (v) => (
        <Tag color={STATUS_COLOR[v]} className="border-0">
          {t(`circulation.statuses.${v}`)}
        </Tag>
      ),
    },
    {
      title: t("circulation.colFine"),
      key: "fine",
      render: (_, row) => (
        <div>
          {row.fineAmount > 0 ? (
            <div className="flex items-center gap-1 flex-wrap">
              <span className={row.finePaid ? "text-slate-400 line-through text-xs" : "text-red-500 font-medium"}>
                {row.fineAmount.toLocaleString()} ៛
              </span>
              {row.finePaid && !row.fineWaived && (
                <Tag color="success" className="border-0 text-[10px] px-1 leading-tight m-0">
                  {t("circulation.finePaid")}
                </Tag>
              )}
              {row.fineWaived && (
                <Tag color="default" className="border-0 text-[10px] px-1 leading-tight m-0">
                  {t("circulation.fineWaived")}
                </Tag>
              )}
              {row.fineNote && (
                <p className="text-[10px] text-slate-400 w-full mt-0.5 truncate max-w-[120px]">{row.fineNote}</p>
              )}
            </div>
          ) : (
            <span className="text-slate-300">—</span>
          )}
          {row.renewalCount > 0 && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              {t("circulation.renewals", { count: row.renewalCount })}
            </p>
          )}
        </div>
      ),
    },
    {
      title: t("common.createdBy"),
      key: "by",
      render: (_, row) => (
        <div className="min-w-[110px]">
          {row.checkedOutBy && (
            <>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{t("circulation.checkedOutBy")}</p>
              <p className="text-xs text-slate-700 leading-snug">{row.checkedOutBy}</p>
              <p className="text-[10px] text-slate-400">{dayjs(row.borrowedAt).format("DD/MM/YY HH:mm")}</p>
            </>
          )}
          {row.closedBy && (
            <div className="mt-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{t("circulation.closedBy")}</p>
              <p className="text-xs text-slate-700 leading-snug">{row.closedBy}</p>
              {row.returnedAt && <p className="text-[10px] text-slate-400">{dayjs(row.returnedAt).format("DD/MM/YY HH:mm")}</p>}
            </div>
          )}
          {!row.checkedOutBy && !row.closedBy && <span className="text-slate-300 text-xs">—</span>}
        </div>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 120,
      render: (_, row) => {
        if (row.status === "ACTIVE" || row.status === "OVERDUE") {
          return (
            <Space size="small">
              <Tooltip title={t("circulation.returnTooltip")}>
                <Button type="text" size="small" icon={<CheckOutlined />} onClick={() => onReturn(row)} />
              </Tooltip>
              <Tooltip
                title={
                  row.renewalCount >= maxRenewals
                    ? t("circulation.renewMaxReached")
                    : t("circulation.renewTooltip", { current: row.renewalCount, max: maxRenewals })
                }
              >
                <Button
                  type="text"
                  size="small"
                  icon={<SyncOutlined />}
                  onClick={() => onRenew(row)}
                  disabled={row.renewalCount >= maxRenewals}
                  className={row.renewalCount >= maxRenewals ? "" : "text-blue-500"}
                />
              </Tooltip>
              <Tooltip title={t("circulation.lostTooltip")}>
                <Button type="text" size="small" danger icon={<StopOutlined />} onClick={() => onLost(row)} />
              </Tooltip>
            </Space>
          );
        }
        if (row.fineAmount > 0 && !row.finePaid) {
          return (
            <Space size="small">
              <Tooltip title={t("circulation.payFineTooltip", { amount: row.fineAmount.toLocaleString() })}>
                <Button
                  type="text"
                  size="small"
                  icon={<DollarOutlined />}
                  onClick={() => onPayFine(row)}
                  className="text-amber-500"
                />
              </Tooltip>
              <Tooltip title={t("circulation.waiveFineTooltip")}>
                <Button
                  type="text"
                  size="small"
                  icon={<MinusCircleOutlined />}
                  onClick={() => onWaiveFine(row)}
                  className="text-slate-400"
                />
              </Tooltip>
            </Space>
          );
        }
        return null;
      },
    },
  ];
}
