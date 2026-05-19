"use client";

import { Form, Input, Button, Skeleton } from "antd";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useFetchSettings } from "../helper/useFetchSettings";
import { useSettings } from "../helper/useSettings";

export function GeneralTab() {
  const [form] = Form.useForm();
  const t = useTranslations("settings");
  const { data, isLoading } = useFetchSettings();
  const { saveSettings } = useSettings();

  useEffect(() => {
    if (data) form.setFieldsValue(data);
  }, [data, form]);

  if (isLoading) return <Skeleton active paragraph={{ rows: 6 }} className="max-w-lg" />;

  return (
    <Form form={form} layout="vertical" onFinish={saveSettings} requiredMark={false} className="max-w-lg">
      <Form.Item label={t("general.libraryNameKh")} name="libraryNameKh" rules={[{ required: true }]}>
        <Input placeholder="ឈ្មោះបណ្ណាល័យ" />
      </Form.Item>
      <Form.Item label={t("general.libraryNameEn")} name="libraryName">
        <Input />
      </Form.Item>
      <Form.Item label={t("general.address")} name="address">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item label={t("general.phone")} name="phone">
        <Input placeholder="+855 xx xxx xxxx" />
      </Form.Item>
      <Form.Item label={t("general.email")} name="email" rules={[{ type: "email" }]}>
        <Input placeholder="library@example.com" />
      </Form.Item>
      <Button type="primary" htmlType="submit">{t("save")}</Button>
    </Form>
  );
}
