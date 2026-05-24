"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Tag, Spin, Button } from "antd";
import { BookOutlined, ArrowLeftOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

interface BookDetail {
  id: string;
  titleEn: string;
  titleKh: string | null;
  author: string | null;
  publisher: string | null;
  publishYear: number | null;
  category: string | null;
  isbn: string | null;
  deweyCode: string | null;
  coverImage: string | null;
  totalCopies: number;
  availableCopies: number;
  tags: string[];
  shelf: { code: string; zone: string | null; label: string | null } | null;
}

export default function PortalBookDetailPage({ id }: { id: string }) {
  const t = useTranslations("portal.books");
  const router = useRouter();

  const { data: book, isLoading } = useQuery<BookDetail>({
    queryKey: ["portal-book", id],
    queryFn: () => fetch(`/api/portal/books/${id}`).then((r) => r.json()),
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spin /></div>;
  }

  if (!book) {
    return <div className="text-center py-16 text-slate-400">{t("empty")}</div>;
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        className="mb-3 -ml-2 text-slate-500"
      >
        {t("backToList")}
      </Button>

      {/* Cover */}
      <div className="bg-slate-100 rounded-xl h-56 flex items-center justify-center overflow-hidden mb-4">
        {book.coverImage ? (
          <img src={book.coverImage} alt="" className="h-full object-contain" />
        ) : (
          <BookOutlined className="text-6xl text-slate-300" />
        )}
      </div>

      {/* Title + availability */}
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-800 leading-snug mb-0.5">
          {book.titleKh ?? book.titleEn}
        </h1>
        {book.titleKh && book.titleEn && (
          <p className="text-sm text-slate-400">{book.titleEn}</p>
        )}
        <div className="mt-2">
          {book.availableCopies > 0 ? (
            <Tag color="green">{t("copies", { available: book.availableCopies, total: book.totalCopies })}</Tag>
          ) : (
            <Tag color="red">{t("unavailable")}</Tag>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
        {[
          { label: t("author"), value: book.author },
          { label: t("publisher"), value: book.publisher },
          { label: t("publishYear"), value: book.publishYear?.toString() },
          { label: t("category"), value: book.category },
          { label: t("isbn"), value: book.isbn },
        ]
          .filter((r) => r.value)
          .map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm text-slate-800 font-medium">{value}</span>
            </div>
          ))}

        {book.shelf && (
          <div className="flex items-start justify-between px-4 py-3">
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <EnvironmentOutlined /> {t("shelfLocation")}
            </span>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-800">{book.shelf.code}</div>
              {book.shelf.zone && (
                <div className="text-xs text-slate-400">{book.shelf.zone}</div>
              )}
            </div>
          </div>
        )}

        {!book.shelf && (
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-slate-500">{t("shelfLocation")}</span>
            <span className="text-sm text-slate-400">{t("noShelf")}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {book.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {book.tags.map((tag) => (
            <Tag key={tag} className="text-xs">{tag}</Tag>
          ))}
        </div>
      )}
    </div>
  );
}
