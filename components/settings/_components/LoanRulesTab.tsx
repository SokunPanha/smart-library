"use client";

import { Form, InputNumber, Button, Skeleton, Divider } from "antd";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useFetchSettings } from "../helper/useFetchSettings";
import { useSettings } from "../helper/useSettings";

export function LoanRulesTab() {
  const [form] = Form.useForm();
  const t = useTranslations("settings");
  const { data, isLoading } = useFetchSettings();
  const { saveSettings } = useSettings();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        loanDaysStudent: Number(data.loanDaysStudent),
        loanDaysTeacher: Number(data.loanDaysTeacher),
        loanDaysPublic: Number(data.loanDaysPublic),
        loanDaysResearcher: Number(data.loanDaysResearcher),
        finePerDay: Number(data.finePerDay),
        maxLoansPerMember: Number(data.maxLoansPerMember),
      });
    }
  }, [data, form]);

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} className="max-w-lg" />;

  function handleFinish(values: Record<string, number>) {
    saveSettings(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])));
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false} className="max-w-lg">
      <Divider plain>{t("loanRules.loanDuration")}</Divider>
      <div className="grid grid-cols-2 gap-3">
        <Form.Item label={t("loanRules.student")} name="loanDaysStudent" rules={[{ required: true }]}>
          <InputNumber className="w-full" min={1} addonAfter={t("loanRules.days")} />
        </Form.Item>
        <Form.Item label={t("loanRules.teacher")} name="loanDaysTeacher" rules={[{ required: true }]}>
          <InputNumber className="w-full" min={1} addonAfter={t("loanRules.days")} />
        </Form.Item>
        <Form.Item label={t("loanRules.public")} name="loanDaysPublic" rules={[{ required: true }]}>
          <InputNumber className="w-full" min={1} addonAfter={t("loanRules.days")} />
        </Form.Item>
        <Form.Item label={t("loanRules.researcher")} name="loanDaysResearcher" rules={[{ required: true }]}>
          <InputNumber className="w-full" min={1} addonAfter={t("loanRules.days")} />
        </Form.Item>
      </div>

      <Divider plain>{t("loanRules.fines")}</Divider>
      <Form.Item label={t("loanRules.finePerDay")} name="finePerDay" rules={[{ required: true }]}>
        <InputNumber className="w-full max-w-xs" min={0} addonAfter="KHR" />
      </Form.Item>

      <Divider plain>{t("loanRules.limits")}</Divider>
      <Form.Item label={t("loanRules.maxLoans")} name="maxLoansPerMember" rules={[{ required: true }]}>
        <InputNumber className="w-full max-w-xs" min={1} max={20} />
      </Form.Item>

      <Button type="primary" htmlType="submit">{t("save")}</Button>
    </Form>
  );
}
