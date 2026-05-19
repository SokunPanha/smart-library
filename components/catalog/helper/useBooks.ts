"use client";

import { App } from "antd";
import { useCatalogContext } from "./hooks";
import { apiFetch, filterRequestParam } from "@/libs/utils/request";
import type { Book } from "./useFetchBooks";

export interface BookPayload {
  isbn?: string | null;
  titleEn: string;
  titleKh?: string | null;
  author?: string | null;
  publisher?: string | null;
  publishYear?: number | null;
  category?: string | null;
  deweyCode?: string | null;
  totalCopies: number;
  tags?: string[];
  coverImage?: string | null;
}

export function useBooks() {
  const { message, modal } = App.useApp();
  const ctx = useCatalogContext();

  const createBook = async (values: BookPayload) => {
    await apiFetch("/api/books", {
      method: "POST",
      body: JSON.stringify(filterRequestParam(values)),
    });
    message.success("Book added successfully.");
    ctx.createForm.close();
    ctx.table.reload();
  };

  const createBookAndContinue = async (values: BookPayload, onSuccess: () => void) => {
    await apiFetch("/api/books", {
      method: "POST",
      body: JSON.stringify(filterRequestParam(values)),
    });
    message.success("Book added. Ready for next entry.");
    ctx.table.reload();
    onSuccess();
  };

  const updateBook = async (values: BookPayload) => {
    const book = ctx.editForm.getData() as Book | undefined;
    if (!book) return;
    await apiFetch(`/api/books/${book.id}`, {
      method: "PUT",
      body: JSON.stringify(filterRequestParam(values)),
    });
    message.success("Book updated.");
    ctx.editForm.close();
    ctx.table.reload();
  };

  const deleteBook = (book: Book) => {
    modal.confirm({
      title: "Delete Book?",
      content: `"${book.titleEn}" will be permanently removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        await apiFetch(`/api/books/${book.id}`, { method: "DELETE" });
        message.success("Book deleted.");
        ctx.table.reload();
      },
    });
  };

  return { createBook, createBookAndContinue, updateBook, deleteBook };
}
