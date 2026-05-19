"use client";

import { App } from "antd";
import { useTranslations } from "next-intl";
import { useCatalogContext } from "./hooks";
import { apiFetch, filterRequestParam } from "@/lib/request";
import type { Book } from "./useFetchBooks";

export interface BookPayload {
  isbn?: string | null;
  titleEn?: string;
  titleKh: string;
  author?: string | null;
  publisher?: string | null;
  publishYear?: number | null;
  category?: string | null;
  deweyCode?: string | null;
  totalCopies: number;
  tags?: string[];
  coverImage?: string | null;
  shelfId?: string | null;
}

export function useBooks() {
  const { message, modal } = App.useApp();
  const ctx = useCatalogContext();
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  const createBook = async (values: BookPayload) => {
    await apiFetch("/api/books", {
      method: "POST",
      body: JSON.stringify(filterRequestParam(values)),
    });
    message.success(t("bookAdded"));
    ctx.createForm.close();
    ctx.table.reload();
  };

  const createBookAndContinue = async (values: BookPayload, onSuccess: () => void) => {
    await apiFetch("/api/books", {
      method: "POST",
      body: JSON.stringify(filterRequestParam(values)),
    });
    message.success(t("bookAddedContinue"));
    ctx.table.reload();
    onSuccess();
  };

  const updateBook = async (values: BookPayload) => {
    const book = ctx.editForm.getData() as Book | undefined;
    if (!book) return;
    const payload = {
      ...filterRequestParam(values),
      shelfId: values.shelfId ?? null,
    };
    await apiFetch(`/api/books/${book.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    message.success(t("bookUpdated"));
    ctx.editForm.close();
    ctx.table.reload();
  };

  const deleteBook = (book: Book) => {
    modal.confirm({
      title: t("deleteTitle"),
      content: t("deleteContent", { title: book.titleKh ?? book.titleEn }),
      okText: tc("delete"),
      okButtonProps: { danger: true },
      cancelText: tc("cancel"),
      onOk: async () => {
        await apiFetch(`/api/books/${book.id}`, { method: "DELETE" });
        message.success(t("bookDeleted"));
        ctx.table.reload();
      },
    });
  };

  return { createBook, createBookAndContinue, updateBook, deleteBook };
}
