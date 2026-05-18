"use client";

import { Drawer, Form, Input, Select, Button, Space, DatePicker } from "antd";
import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { useMembersContext } from "../helper/hooks";
import { useMembers, type MemberPayload } from "../helper/useMembers";

function MemberFields() {
  const t = useTranslations("members");

  return (
    <>
      <Form.Item label={t("memberId")} name="memberId" rules={[{ required: true }]}>
        <Input placeholder="e.g. LIB-2024-001" />
      </Form.Item>
      <Form.Item label={t("nameEn")} name="nameEn">
        <Input />
      </Form.Item>
      <Form.Item label={t("nameKh")} name="nameKh">
        <Input placeholder="ឈ្មោះពេញ" />
      </Form.Item>
      <Form.Item label={t("type")} name="type" rules={[{ required: true }]} initialValue="PUBLIC">
        <Select
          options={[
            { label: t("types.STUDENT"), value: "STUDENT" },
            { label: t("types.TEACHER"), value: "TEACHER" },
            { label: t("types.PUBLIC"), value: "PUBLIC" },
            { label: t("types.RESEARCHER"), value: "RESEARCHER" },
          ]}
        />
      </Form.Item>
      <Form.Item label={t("phone")} name="phone">
        <Input placeholder="+855 xx xxx xxxx" />
      </Form.Item>
      <Form.Item label={t("email")} name="email" rules={[{ type: "email" }]}>
        <Input placeholder="email@example.com" />
      </Form.Item>
      <Form.Item label={t("expiresAt")} name="expiresAt">
        <DatePicker className="w-full" format="DD/MM/YYYY" />
      </Form.Item>
    </>
  );
}

function normalizeValues(values: MemberPayload & { expiresAt?: dayjs.Dayjs }): MemberPayload {
  return { ...values, expiresAt: values.expiresAt?.toISOString() ?? null };
}

export function CreateMemberDrawer() {
  const { createForm } = useMembersContext();
  const { createMember } = useMembers();
  const t = useTranslations("members");
  const tc = useTranslations("common");

  return (
    <Drawer
      title={t("addMember")}
      open={createForm.isOpen}
      onClose={createForm.close}
      styles={{ wrapper: { width: 440 } }}
      forceRender
      extra={
        <Space>
          <Button onClick={createForm.close}>{tc("cancel")}</Button>
          <Button type="primary" onClick={() => createForm.form.submit()}>{tc("save")}</Button>
        </Space>
      }
    >
      <Form
        form={createForm.form}
        layout="vertical"
        onFinish={(v) => createMember(normalizeValues(v))}
        requiredMark={false}
      >
        <MemberFields />
      </Form>
    </Drawer>
  );
}

export function EditMemberDrawer() {
  const { editForm } = useMembersContext();
  const { updateMember } = useMembers();
  const t = useTranslations("members");
  const tc = useTranslations("common");

  return (
    <Drawer
      title={t("editMember")}
      open={editForm.isOpen}
      onClose={editForm.close}
      styles={{ wrapper: { width: 440 } }}
      forceRender
      extra={
        <Space>
          <Button onClick={editForm.close}>{tc("cancel")}</Button>
          <Button type="primary" onClick={() => editForm.form.submit()}>{tc("save")}</Button>
        </Space>
      }
    >
      <Form
        form={editForm.form}
        layout="vertical"
        onFinish={(v) => updateMember(normalizeValues(v))}
        requiredMark={false}
      >
        <MemberFields />
      </Form>
    </Drawer>
  );
}
