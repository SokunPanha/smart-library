"use client";

import { App } from "antd";
import { useTranslations } from "next-intl";
import { useMembersContext } from "./hooks";
import { apiFetch, filterRequestParam } from "@/lib/request";
import type { Member } from "./useFetchMembers";
import type { MemberType } from "@prisma/client";

export interface MemberPayload {
  memberId: string;
  nameEn?: string | null;
  nameKh?: string | null;
  email?: string | null;
  phone?: string | null;
  photo?: string | null;
  type: MemberType;
  expiresAt?: string | null;
}

export function useMembers() {
  const { message, modal } = App.useApp();
  const ctx = useMembersContext();
  const t = useTranslations("members");
  const tc = useTranslations("common");

  const createMember = async (values: MemberPayload) => {
    await apiFetch("/api/members", {
      method: "POST",
      body: JSON.stringify(filterRequestParam(values)),
    });
    message.success(t("memberAdded"));
    ctx.createForm.close();
    ctx.table.reload();
  };

  const updateMember = async (values: MemberPayload) => {
    const member = ctx.editForm.getData() as Member | undefined;
    if (!member) return;
    await apiFetch(`/api/members/${member.id}`, {
      method: "PUT",
      body: JSON.stringify(filterRequestParam(values)),
    });
    message.success(t("memberUpdated"));
    ctx.editForm.close();
    ctx.table.reload();
  };

  const deleteMember = (member: Member) => {
    modal.confirm({
      title: t("deleteTitle"),
      content: t("deleteContent", { name: member.nameKh ?? member.nameEn ?? member.memberId }),
      okText: tc("delete"),
      okButtonProps: { danger: true },
      cancelText: tc("cancel"),
      onOk: async () => {
        await apiFetch(`/api/members/${member.id}`, { method: "DELETE" });
        message.success(t("memberDeleted"));
        ctx.table.reload();
      },
    });
  };

  return { createMember, updateMember, deleteMember };
}
