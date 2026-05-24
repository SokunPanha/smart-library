"use client";

import { useState } from "react";
import { Form, Input, Button, Alert, Typography } from "antd";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const { Title, Text } = Typography;

export default function SetPasswordPage() {
  const t = useTranslations("portal.setPassword");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { password: string; confirm: string }) => {
    if (values.password !== values.confirm) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portal/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password: values.password }),
      });

      if (!res.ok) {
        setError(t("error"));
        setLoading(false);
        return;
      }

      // Auto-login after setting password
      const signInRes = await signIn("member-credentials", {
        phone,
        password: values.password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError(t("error"));
        setLoading(false);
        return;
      }

      router.push(`/${locale}/dashboard`);
    } catch {
      setError(t("error"));
      setLoading(false);
    }
  };

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

          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
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
      </div>
    </div>
  );
}
