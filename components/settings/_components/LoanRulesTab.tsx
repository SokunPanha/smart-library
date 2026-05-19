"use client";

import { Form, InputNumber, Button, Skeleton, Divider, Space, Input } from "antd";
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
        maxRenewalsPerLoan: Number(data.maxRenewalsPerLoan ?? 2),
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
        <Form.Item label={t("loanRules.student")} required>
          <Space.Compact className="w-full">
            <Form.Item name="loanDaysStudent" rules={[{ required: true }]} noStyle>
              <InputNumber className="w-full" min={1} />
            </Form.Item>
            <Input readOnly value={t("loanRules.days")} className="w-auto !cursor-default" style={{ pointerEvents: "none" }} />
          </Space.Compact>
        </Form.Item>
        <Form.Item label={t("loanRules.teacher")} required>
          <Space.Compact className="w-full">
            <Form.Item name="loanDaysTeacher" rules={[{ required: true }]} noStyle>
              <InputNumber className="w-full" min={1} />
            </Form.Item>
            <Input readOnly value={t("loanRules.days")} className="w-auto !cursor-default" style={{ pointerEvents: "none" }} />
          </Space.Compact>
        </Form.Item>
        <Form.Item label={t("loanRules.public")} required>
          <Space.Compact className="w-full">
            <Form.Item name="loanDaysPublic" rules={[{ required: true }]} noStyle>
              <InputNumber className="w-full" min={1} />
            </Form.Item>
            <Input readOnly value={t("loanRules.days")} className="w-auto !cursor-default" style={{ pointerEvents: "none" }} />
          </Space.Compact>
        </Form.Item>
        <Form.Item label={t("loanRules.researcher")} required>
          <Space.Compact className="w-full">
            <Form.Item name="loanDaysResearcher" rules={[{ required: true }]} noStyle>
              <InputNumber className="w-full" min={1} />
            </Form.Item>
            <Input readOnly value={t("loanRules.days")} className="w-auto !cursor-default" style={{ pointerEvents: "none" }} />
          </Space.Compact>
        </Form.Item>
      </div>

      <Divider plain>{t("loanRules.fines")}</Divider>
      <Form.Item label={t("loanRules.finePerDay")} required>
        <Space.Compact className="w-full max-w-xs">
          <Form.Item name="finePerDay" rules={[{ required: true }]} noStyle>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Input readOnly value="KHR" className="w-auto !cursor-default" style={{ pointerEvents: "none" }} />
        </Space.Compact>
      </Form.Item>

      <Divider plain>{t("loanRules.limits")}</Divider>
      <Form.Item label={t("loanRules.maxLoans")} name="maxLoansPerMember" rules={[{ required: true }]}>
        <InputNumber className="w-full max-w-xs" min={1} max={20} />
      </Form.Item>
      <Form.Item label={t("loanRules.maxRenewals")} name="maxRenewalsPerLoan" rules={[{ required: true }]}>
        <InputNumber className="w-full max-w-xs" min={0} max={10} />
      </Form.Item>

      <Button type="primary" htmlType="submit">{t("save")}</Button>
    </Form>
  );
}
