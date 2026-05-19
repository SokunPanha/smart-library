"use client";

import { makeContext } from "@/lib/context";
import { useFormDrawer } from "@/lib/form";
import { useTable } from "@/lib/table";

export const [MembersProvider, useMembersContext] = makeContext(() => {
  return {
    table: useTable(["members"]),
    createForm: useFormDrawer(),
    editForm: useFormDrawer(),
  };
});
