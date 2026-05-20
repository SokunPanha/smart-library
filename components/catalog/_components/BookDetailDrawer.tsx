"use client";

import { Drawer, Tag, Avatar, Image, Tabs, Spin, Badge } from "antd";
import { UserOutlined, BookOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/request";

interface MemberRef {
  id: string; memberId: string; nameKh: string | null; nameEn: string | null;
  type: string; photo: string | null;
}
interface MemberRefSmall {
  id: string; memberId: string; nameKh: string | null; nameEn: string | null;
}
interface Loan {
  id: string; status: string; borrowedAt: string; dueAt: string;
  returnedAt: string | null; fineAmount: number; finePaid: boolean;
  member: MemberRef;
}
interface Reservation {
  id: string; status: string; reservedAt: string;
  member: MemberRefSmall;
}
interface BookDetail {
  id: string; titleKh: string | null; titleEn: string; author: string | null;
  publisher: string | null; publishYear: number | null; isbn: string | null;
  deweyCode: string | null; category: string | null; tags: string[];
  coverImage: string | null; totalCopies: number; availableCopies: number;
  shelf: { code: string; label: string | null; zone: string | null; cabinet: string; side: string | null; shelfNo: number; sectionNo: number } | null;
  loans: Loan[];
  reservations: Reservation[];
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "blue", OVERDUE: "red", RETURNED: "default", LOST: "orange",
  PENDING: "gold", FULFILLED: "green", CANCELLED: "default",
};

interface Props { bookId: string | null; onClose: () => void }

export function BookDetailDrawer({ bookId, onClose }: Props) {
  const t = useTranslations("catalog");
  const tc = useTranslations("circulation");

  const { data: book, isLoading } = useQuery<BookDetail>({
    queryKey: ["book-detail", bookId],
    queryFn: () => apiFetch<BookDetail>(`/api/books/${bookId}`),
    enabled: !!bookId,
  });

  const currentLoans = book?.loans.filter((l) => l.status === "ACTIVE" || l.status === "OVERDUE") ?? [];
  const allLoans = book?.loans ?? [];
  const pendingReservations = book?.reservations.filter((r) => r.status === "PENDING") ?? [];
  const allReservations = book?.reservations ?? [];

  const isAllOut = book ? book.availableCopies === 0 : false;

  return (
    <Drawer
      open={!!bookId}
      onClose={onClose}
      title={t("detail.title")}
      styles={{ wrapper: { width: "min(520px, 100vw)" } }}
      destroyOnHidden
    >
      {isLoading || !book ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            {book.coverImage ? (
              <Image
                src={book.coverImage}
                alt=""
                width={72}
                height={96}
                className="object-cover rounded flex-shrink-0"
                style={{ borderRadius: 6 }}
                preview={{ mask: false }}
              />
            ) : (
              <div className="w-[72px] h-[96px] bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                <BookOutlined className="text-slate-300 text-2xl" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-base leading-snug">{book.titleKh ?? book.titleEn}</p>
              {book.titleKh && book.titleEn && (
                <p className="text-sm text-slate-400 mt-0.5">{book.titleEn}</p>
              )}
              {book.author && <p className="text-sm text-slate-500 mt-1">{book.author}</p>}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {book.category && (
                  <Tag className="border-0 text-xs bg-blue-50 text-blue-600 m-0">{book.category}</Tag>
                )}
                {book.isbn && (
                  <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                    {book.isbn}
                  </span>
                )}
                {book.deweyCode && (
                  <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                    {book.deweyCode}
                  </span>
                )}
              </div>
              {book.shelf && (
                <p className="text-xs text-slate-400 mt-1.5">
                  📍 {[
                    `Cabinet ${book.shelf.cabinet}`,
                    book.shelf.side && `Side ${book.shelf.side}`,
                    `Shelf ${book.shelf.shelfNo}`,
                    `Section ${book.shelf.sectionNo}`,
                    book.shelf.label,
                  ].filter(Boolean).join(" · ")}
                  <span className="font-mono ml-1">({book.shelf.code})</span>
                </p>
              )}
              {(book.publisher || book.publishYear) && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {[book.publisher, book.publishYear].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${isAllOut ? "bg-red-50" : "bg-green-50"}`}>
            <div className={`text-2xl font-bold ${isAllOut ? "text-red-500" : "text-green-600"}`}>
              {book.availableCopies}
            </div>
            <div>
              <p className={`text-sm font-medium ${isAllOut ? "text-red-600" : "text-green-700"}`}>
                {isAllOut
                  ? t("detail.allOut")
                  : t("detail.availability", { available: book.availableCopies, total: book.totalCopies })}
              </p>
              {!isAllOut && (
                <p className="text-xs text-green-500">{`${book.totalCopies - book.availableCopies} checked out`}</p>
              )}
            </div>
            {pendingReservations.length > 0 && (
              <Tag color="gold" className="border-0 text-xs ml-auto">
                {pendingReservations.length} hold{pendingReservations.length > 1 ? "s" : ""}
              </Tag>
            )}
          </div>

          {/* Tabs */}
          <Tabs
            size="small"
            items={[
              {
                key: "current",
                label: (
                  <Badge count={currentLoans.length} size="small" offset={[6, -2]}>
                    {t("detail.tabCurrentLoans")}
                  </Badge>
                ),
                children: (
                  <div className="space-y-1">
                    {currentLoans.length === 0 ? (
                      <p className="text-sm text-slate-300 py-4">{t("detail.noCurrentLoans")}</p>
                    ) : currentLoans.map((loan) => (
                      <div key={loan.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                        {loan.member.photo ? (
                          <Image
                            src={loan.member.photo}
                            alt=""
                            width={32}
                            height={32}
                            className="rounded-full object-cover flex-shrink-0"
                            style={{ borderRadius: "50%" }}
                            preview={{ mask: false }}
                          />
                        ) : (
                          <Avatar size={32} icon={<UserOutlined />} className="bg-slate-100 text-slate-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 leading-snug">{loan.member.nameKh ?? loan.member.nameEn}</p>
                          <p className="text-xs text-slate-400 font-mono">{loan.member.memberId}</p>
                        </div>
                        <Tag color={STATUS_COLOR[loan.status]} className="border-0 text-xs shrink-0">
                          {tc(`statuses.${loan.status}`)}
                        </Tag>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-400">{t("detail.dueAt")}</p>
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
                label: t("detail.tabHistory"),
                children: (
                  <div className="space-y-1">
                    {allLoans.length === 0 ? (
                      <p className="text-sm text-slate-300 py-4">{t("detail.noHistory")}</p>
                    ) : allLoans.map((loan) => (
                      <div key={loan.id} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                        <Tag color={STATUS_COLOR[loan.status]} className="border-0 text-xs shrink-0">
                          {tc(`statuses.${loan.status}`)}
                        </Tag>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{loan.member.nameKh ?? loan.member.nameEn}</p>
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
                key: "reservations",
                label: (
                  <Badge count={pendingReservations.length} size="small" offset={[6, -2]}>
                    {t("detail.tabReservations")}
                  </Badge>
                ),
                children: (
                  <div className="space-y-1">
                    {allReservations.length === 0 ? (
                      <p className="text-sm text-slate-300 py-4">{t("detail.noReservations")}</p>
                    ) : allReservations.map((r, idx) => (
                      <div key={r.id} className="flex items-center gap-2 py-2 border-b border-slate-50 last:border-0">
                        {r.status === "PENDING" && (
                          <span className="text-xs text-slate-400 font-mono w-6 shrink-0 text-center">
                            #{idx + 1}
                          </span>
                        )}
                        <Tag color={STATUS_COLOR[r.status]} className="border-0 text-xs shrink-0">
                          {r.status}
                        </Tag>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{r.member.nameKh ?? r.member.nameEn}</p>
                          <p className="text-xs text-slate-400 font-mono">{r.member.memberId}</p>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{dayjs(r.reservedAt).format("DD/MM/YY")}</span>
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
