"use client";

import { useState } from "react";
import { Form, Input, Button, Alert, Typography } from "antd";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

const { Title, Text } = Typography;

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    const res = await signIn("admin-credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push(`/${locale}/admin/dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/LibraCore.png" alt="LibraCore" className="w-16 h-16 object-contain mb-2" />
          <Title level={4} className="!mb-1 !text-slate-800">
            {t("loginTitle")}
          </Title>
          <Text className="text-slate-500 text-sm">{t("loginSubtitle")}</Text>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {error && (
            <Alert
              title={error}
              type="error"
              showIcon
              className="mb-4"
              closable
              onClose={() => setError(null)}
            />
          )}

          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              label={<span className="text-sm font-medium text-slate-700">{t("email")}</span>}
              name="email"
              rules={[{ required: true, type: "email" }]}
            >
              <Input
                placeholder={t("emailPlaceholder")}
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-medium text-slate-700">{t("password")}</span>}
              name="password"
              rules={[{ required: true }]}
            >
              <Input.Password
                placeholder={t("passwordPlaceholder")}
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item className="mb-0 mt-6">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                className="rounded-lg font-medium"
              >
                {t("loginButton")}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
