"use client";

import { makeContext } from "@/libs/hooks/context";
import { useDrawerForm } from "@/libs/hooks/form";
import { useTable } from "@/libs/hooks/table";

export const [MembersProvider, useMembersContext] = makeContext(() => {
  return {
    table: useTable(["members"]),
    createForm: useDrawerForm(),
    editForm: useDrawerForm(),
  };
});
