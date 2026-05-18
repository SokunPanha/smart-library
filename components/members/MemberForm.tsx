"use client";

import { Form, Input, Select, Button, Drawer, Space, DatePicker } from "antd";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import dayjs from "dayjs";

export interface MemberFormValues {
  memberId: string;
  nameEn?: string;
  nameKh?: string;
  email?: string;
  phone?: string;
  type: "STUDENT" | "TEACHER" | "PUBLIC" | "RESEARCHER";
  expiresAt?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: MemberFormValues) => Promise<void>;
  initialValues?: Partial<MemberFormValues>;
  loading?: boolean;
}

export default function MemberForm({ open, onClose, onSubmit, initialValues, loading }: Props) {
  const t = useTranslations("members");
  const tc = useTranslations("common");
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        type: "PUBLIC",
        ...initialValues,
        expiresAt: initialValues?.expiresAt ? dayjs(initialValues.expiresAt) : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  const handleFinish = (values: MemberFormValues & { expiresAt?: dayjs.Dayjs }) => {
    onSubmit({
      ...values,
      expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
    });
  };

  const typeOptions = [
    { label: t("types.STUDENT"), value: "STUDENT" },
    { label: t("types.TEACHER"), value: "TEACHER" },
    { label: t("types.PUBLIC"), value: "PUBLIC" },
    { label: t("types.RESEARCHER"), value: "RESEARCHER" },
  ];

  return (
    <Drawer
      title={initialValues?.memberId ? t("editMember") : t("addMember")}
      open={open}
      onClose={onClose}
      width={440}
      extra={
        <Space>
          <Button onClick={onClose}>{tc("cancel")}</Button>
          <Button type="primary" loading={loading} onClick={() => form.submit()}>
            {tc("save")}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <Form.Item label={t("memberId")} name="memberId" rules={[{ required: true }]}>
          <Input placeholder="e.g. LIB-2024-001" />
        </Form.Item>
        <Form.Item label={t("nameEn")} name="nameEn">
          <Input placeholder="Full name in English" />
        </Form.Item>
        <Form.Item label={t("nameKh")} name="nameKh">
          <Input placeholder="ឈ្មោះពេញជាភាសាខ្មែរ" />
        </Form.Item>
        <Form.Item label={t("type")} name="type" rules={[{ required: true }]}>
          <Select options={typeOptions} />
        </Form.Item>
        <Form.Item label={t("phone")} name="phone">
          <Input placeholder="+855 xx xxx xxxx" />
        </Form.Item>
        <Form.Item
          label={t("email")}
          name="email"
          rules={[{ type: "email", message: "Enter a valid email" }]}
        >
          <Input placeholder="email@example.com" />
        </Form.Item>
        <Form.Item label={t("expiresAt")} name="expiresAt">
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
