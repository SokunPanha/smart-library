"use client";

import { useState } from "react";
import { Modal, Form, Select, DatePicker, Button, App } from "antd";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { apiFetch } from "@/lib/request";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BookOption {
  id: string;
  titleEn: string;
  titleKh: string | null;
  totalCopies: number;
  availableCopies: number;
}

interface MemberOption {
  id: string;
  nameEn: string | null;
  nameKh: string | null;
  memberId: string;
}

export default function CheckoutModal({ open, onClose, onSuccess }: Props) {
  const t = useTranslations("circulation");
  const tc = useTranslations("common");
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [bookSearch, setBookSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const { data: booksData } = useQuery({
    queryKey: ["books-select", bookSearch],
    queryFn: () =>
      apiFetch<{ books: BookOption[] }>(`/api/books?search=${encodeURIComponent(bookSearch)}&limit=20`)
        .then((d) => d.books),
    enabled: open,
  });

  const { data: membersData } = useQuery({
    queryKey: ["members-select", memberSearch],
    queryFn: () =>
      apiFetch<{ members: MemberOption[] }>(`/api/members?search=${encodeURIComponent(memberSearch)}&limit=20`)
        .then((d) => d.members),
    enabled: open,
  });

  const handleSubmit = async (values: {
    bookId: string;
    memberId: string;
    dueAt?: dayjs.Dayjs;
  }) => {
    setLoading(true);
    try {
      await apiFetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: values.bookId,
          memberId: values.memberId,
          dueAt: values.dueAt?.toISOString(),
        }),
      });
      message.success(t("checkoutSuccess"));
      form.resetFields();
      onSuccess();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : t("checkoutError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t("checkout")}
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      footer={null}
      width={440}
      style={{ maxWidth: "calc(100vw - 32px)" }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
        className="mt-4"
      >
        <Form.Item label={t("bookLabel")} name="bookId" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder={t("bookSearchPlaceholder")}
            filterOption={false}
            onSearch={setBookSearch}
            options={(booksData ?? [])
              .filter((b) => b.totalCopies > 2 && b.availableCopies > 2)
              .map((b) => ({
                label: (
                  <div>
                    <span>{b.titleEn}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      ({b.availableCopies - 2} {t("available")})
                    </span>
                  </div>
                ),
                value: b.id,
              }))}
            notFoundContent={t("noBooks")}
          />
        </Form.Item>

        <Form.Item label={t("memberLabel")} name="memberId" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder={t("memberSearchPlaceholder")}
            filterOption={false}
            onSearch={setMemberSearch}
            options={(membersData ?? []).map((m) => ({
              label: (
                <div>
                  <span>{m.nameEn ?? m.nameKh ?? m.memberId}</span>
                  <span className="text-xs font-mono text-slate-400 ml-2">
                    {m.memberId}
                  </span>
                </div>
              ),
              value: m.id,
            }))}
            notFoundContent={t("noMembers")}
          />
        </Form.Item>

        <Form.Item label={t("customDueDate")} name="dueAt">
          <DatePicker
            className="w-full"
            format="DD/MM/YYYY"
            disabledDate={(d) => d.isBefore(dayjs(), "day")}
          />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose}>{tc("cancel")}</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t("checkout")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
