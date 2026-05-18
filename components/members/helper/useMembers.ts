"use client";

import { App } from "antd";
import { useMembersContext } from "./hooks";
import { apiFetch, filterRequestParam } from "@/libs/utils/request";
import type { Member } from "./useFetchMembers";

export interface MemberPayload {
  memberId: string;
  nameEn?: string | null;
  nameKh?: string | null;
  email?: string | null;
  phone?: string | null;
  type: "STUDENT" | "TEACHER" | "PUBLIC" | "RESEARCHER";
  expiresAt?: string | null;
}

export function useMembers() {
  const { message, modal } = App.useApp();
  const ctx = useMembersContext();

  const createMember = async (values: MemberPayload) => {
    await apiFetch("/api/members", {
      method: "POST",
      body: JSON.stringify(filterRequestParam(values)),
    });
    message.success("Member added successfully.");
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
    message.success("Member updated.");
    ctx.editForm.close();
    ctx.table.reload();
  };

  const deleteMember = (member: Member) => {
    modal.confirm({
      title: "Delete Member?",
      content: `"${member.nameEn ?? member.memberId}" will be permanently removed.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        await apiFetch(`/api/members/${member.id}`, { method: "DELETE" });
        message.success("Member deleted.");
        ctx.table.reload();
      },
    });
  };

  return { createMember, updateMember, deleteMember };
}
