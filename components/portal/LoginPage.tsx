"use client";

import { useState } from "react";
import { Form, Input, Button, Alert, Typography } from "antd";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

const { Title, Text } = Typography;

export default function PortalLoginPage() {
  const t = useTranslations("portal.login");
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { phone: string; password: string }) => {
    setLoading(true);
    setError(null);

    const phone = values.phone.trim();

    // Check member status before attempting sign-in
    const check = await fetch(`/api/portal/check-member?phone=${encodeURIComponent(phone)}`).then((r) => r.json());

    if (!check.exists) {
      setLoading(false);
      setError(t("notFound"));
      return;
    }
    if (!check.approved) {
      setLoading(false);
      setError(t("pendingError"));
      return;
    }
    if (check.needsPassword) {
      // First login — redirect to set-password
      router.push(`/${locale}/set-password?phone=${encodeURIComponent(phone)}`);
      return;
    }

    const res = await signIn("member-credentials", {
      phone,
      password: values.password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError(t("error"));
    } else {
      router.push(`/${locale}/dashboard`);
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
              label={<span className="text-sm font-medium text-slate-700">{t("phone")}</span>}
              name="phone"
              rules={[{ required: true }]}
            >
              <Input placeholder={t("phonePlaceholder")} size="large" className="rounded-lg" />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium text-slate-700">{t("password")}</span>}
              name="password"
            >
              <Input.Password placeholder={t("passwordPlaceholder")} size="large" className="rounded-lg" />
            </Form.Item>

            <Form.Item className="mb-0 mt-6">
              <Button type="primary" htmlType="submit" size="large" loading={loading} block className="rounded-lg font-medium">
                {t("loginButton")}
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="text-center mt-4">
          <Text className="text-slate-500 text-sm">
            {t("noAccount")}{" "}
            <Link href={`/${locale}/register`} className="text-blue-600 font-medium">
              {t("register")}
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
}
