"use client";

import { useState, useEffect } from "react";
import { Form, Input, Select, Button, Alert, Typography, Result } from "antd";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

const { Title, Text } = Typography;

interface ClassOption {
  id: string;
  name: string;
}

export default function PortalRegisterPage() {
  const t = useTranslations("portal.register");
  const tm = useTranslations("members");
  const locale = useLocale();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const memberType = Form.useWatch("type", form);

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((d) => setClasses(d.classes ?? []))
      .catch(() => {});
  }, []);

  const onFinish = async (values: {
    nameKh: string;
    nameEn?: string;
    phone: string;
    password: string;
    confirm: string;
    email?: string;
    type: string;
    classId?: string;
  }) => {
    if (values.password !== values.confirm) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { confirm, ...payload } = values;
      void confirm;
      const res = await fetch("/api/portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "PHONE_EXISTS") {
          setError(t("errorPhoneExists"));
        } else if (data.error === "EMAIL_EXISTS") {
          setError(t("errorEmailExists"));
        } else {
          setError(t("error"));
        }
        return;
      }
      setSubmitted(true);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Result
            status="success"
            title={t("successTitle")}
            subTitle={t("successMessage")}
            extra={
              <Link href={`/${locale}/login`}>
                <Button type="primary">{t("backToLogin")}</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/LibraCore.png" alt="LibraCore" className="w-16 h-16 object-contain mb-3" />
          <Title level={4} className="!mb-1 !text-slate-800">{t("title")}</Title>
          <Text className="text-slate-500 text-sm text-center">{t("subtitle")}</Text>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {error && (
            <Alert title={error} type="error" showIcon className="mb-4" closable onClose={() => setError(null)} />
          )}

          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              label={<span className="text-sm font-medium text-slate-700">{t("nameKh")}</span>}
              name="nameKh"
              rules={[{ required: true }]}
            >
              <Input size="large" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium text-slate-700">{t("nameEn")}</span>}
              name="nameEn"
            >
              <Input size="large" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium text-slate-700">{t("phone")}</span>}
              name="phone"
              rules={[{ required: true }]}
            >
              <Input placeholder={t("phonePlaceholder")} size="large" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium text-slate-700">{t("email")}</span>}
              name="email"
            >
              <Input placeholder={t("emailPlaceholder")} size="large" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium text-slate-700">{t("type")}</span>}
              name="type"
              initialValue="PUBLIC"
              rules={[{ required: true }]}
            >
              <Select size="large">
                {(["STUDENT", "TEACHER", "PUBLIC", "RESEARCHER"] as const).map((v) => (
                  <Select.Option key={v} value={v}>{tm(`types.${v}`)}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            {memberType === "STUDENT" && classes.length > 0 && (
              <Form.Item
                label={<span className="text-sm font-medium text-slate-700">{t("class")}</span>}
                name="classId"
              >
                <Select size="large" placeholder={t("classPlaceholder")} allowClear>
                  {classes.map((c) => (
                    <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item
              label={<span className="text-sm font-medium text-slate-700">{t("password")}</span>}
              name="password"
              rules={[{ required: true }, { min: 6 }]}
            >
              <Input.Password placeholder={t("passwordPlaceholder")} size="large" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium text-slate-700">{t("confirmPassword")}</span>}
              name="confirm"
              rules={[{ required: true }]}
            >
              <Input.Password placeholder={t("passwordPlaceholder")} size="large" className="rounded-lg" />
            </Form.Item>

            <Form.Item className="mb-0 mt-6">
              <Button type="primary" htmlType="submit" size="large" loading={loading} block className="rounded-lg font-medium">
                {t("submit")}
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="text-center mt-4">
          <Text className="text-slate-500 text-sm">
            {t("haveAccount")}{" "}
            <Link href={`/${locale}/login`} className="text-blue-600 font-medium">
              {t("loginLink")}
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
}
