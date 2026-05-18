"use client";

import { makeContext } from "@/libs/hooks/context";
import { useModalForm, useDrawerForm } from "@/libs/hooks/form";
import { useTable } from "@/libs/hooks/table";

export const [CatalogProvider, useCatalogContext] = makeContext(() => {
  return {
    table: useTable(["books"]),
    createForm: useDrawerForm(),
    editForm: useDrawerForm(),
  };
});
