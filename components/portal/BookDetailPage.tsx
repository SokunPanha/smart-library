"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Spinner, Badge } from "./ui";

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

function ArrowLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0 7-7m-7 7h18" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg className="w-16 h-16 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0z"/>
    </svg>
  );
}

export default function PortalBookDetailPage({ id }: { id: string }) {
  const t      = useTranslations("portal.books");
  const router = useRouter();

  const { data: book, isLoading } = useQuery<BookDetail>({
    queryKey: ["portal-book", id],
    queryFn: () => fetch(`/api/portal/books/${id}`).then((r) => r.json()),
  });

  if (isLoading) return <Spinner className="py-16" />;

  if (!book) return (
    <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">{t("empty")}</div>
  );

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 mb-4 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-medium transition"
      >
        <ArrowLeftIcon />
        {t("backToList")}
      </button>

      {/* Cover */}
      <div className="bg-indigo-50 dark:bg-slate-700 rounded-2xl h-56 flex items-center justify-center overflow-hidden mb-5 shadow-sm">
        {book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverImage} alt="" className="h-full object-contain" />
        ) : (
          <BookIcon />
        )}
      </div>

      {/* Title + availability */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-snug mb-0.5">
          {book.titleKh ?? book.titleEn}
        </h1>
        {book.titleKh && book.titleEn && (
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-2">{book.titleEn}</p>
        )}
        {book.availableCopies > 0 ? (
          <Badge color="green">{t("copies", { available: book.availableCopies, total: book.totalCopies })}</Badge>
        ) : (
          <Badge color="red">{t("unavailable")}</Badge>
        )}
      </div>

      {/* Details card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700/60 shadow-sm mb-4">
        {[
          { label: t("author"),      value: book.author },
          { label: t("publisher"),   value: book.publisher },
          { label: t("publishYear"), value: book.publishYear?.toString() },
          { label: t("category"),    value: book.category },
          { label: t("isbn"),        value: book.isbn },
        ]
          .filter((r) => r.value)
          .map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
              <span className="text-sm text-slate-800 dark:text-slate-100 font-medium">{value}</span>
            </div>
          ))}

        {/* Shelf location */}
        {book.shelf ? (
          <div className="flex items-start justify-between px-4 py-3">
            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <PinIcon />
              {t("shelfLocation")}
            </span>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{book.shelf.code}</p>
              {book.shelf.zone && (
                <p className="text-xs text-slate-400 dark:text-slate-500">{book.shelf.zone}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">{t("shelfLocation")}</span>
            <span className="text-sm text-slate-400 dark:text-slate-500">{t("noShelf")}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {book.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {book.tags.map((tag) => (
            <Badge key={tag} color="default">{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
