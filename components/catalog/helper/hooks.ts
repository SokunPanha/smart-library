"use client";

import { makeContext } from "@/lib/context";
import { useFormDrawer } from "@/lib/form";
import { useTable } from "@/lib/table";

export const [CatalogProvider, useCatalogContext] = makeContext(() => {
  return {
    table: useTable(["books"]),
    createForm: useFormDrawer(),
    editForm: useFormDrawer(),
  };
});
