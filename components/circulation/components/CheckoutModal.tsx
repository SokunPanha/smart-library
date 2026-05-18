"use client";

import { useState } from "react";
import { Modal, Form, Select, DatePicker, Button, App } from "antd";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/libs/utils/request";
import { useLoans } from "../helper/useLoans";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckoutModal({ open, onClose, onSuccess }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const { checkout } = useLoans();
  const [loading, setLoading] = useState(false);
  const [bookSearch, setBookSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const { data: books } = useQuery({
    queryKey: ["books-select", bookSearch],
    queryFn: () =>
      apiFetch<{ books: { id: string; titleEn: string; availableCopies: number }[] }>(
        `/api/books?search=${encodeURIComponent(bookSearch)}&limit=20`
      ).then((d) => d.books.filter((b) => b.availableCopies > 0)),
    enabled: open,
  });

  const { data: members } = useQuery({
    queryKey: ["members-select", memberSearch],
    queryFn: () =>
      apiFetch<{ members: { id: string; nameEn: string | null; memberId: string }[] }>(
        `/api/members?search=${encodeURIComponent(memberSearch)}&limit=20`
      ).then((d) => d.members),
    enabled: open,
  });

  const handleFinish = async (values: { bookId: string; memberId: string; dueAt?: dayjs.Dayjs }) => {
    setLoading(true);
    try {
      await checkout({ bookId: values.bookId, memberId: values.memberId, dueAt: values.dueAt?.toISOString() });
      form.resetFields();
      onSuccess();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "Failed to check out.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Check Out Book"
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      footer={null}
      width={440}
      forceRender
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false} className="mt-4">
        <Form.Item label="Book" name="bookId" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Search book by title or ISBN"
            filterOption={false}
            onSearch={setBookSearch}
            options={(books ?? []).map((b) => ({
              label: `${b.titleEn} (${b.availableCopies} available)`,
              value: b.id,
            }))}
            notFoundContent="No available books"
          />
        </Form.Item>

        <Form.Item label="Member" name="memberId" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Search member by name or ID"
            filterOption={false}
            onSearch={setMemberSearch}
            options={(members ?? []).map((m) => ({
              label: `${m.nameEn ?? m.memberId} — ${m.memberId}`,
              value: m.id,
            }))}
            notFoundContent="No members found"
          />
        </Form.Item>

        <Form.Item label="Custom Due Date (optional)" name="dueAt">
          <DatePicker className="w-full" format="DD/MM/YYYY" disabledDate={(d) => d.isBefore(dayjs(), "day")} />
        </Form.Item>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>Check Out</Button>
        </div>
      </Form>
    </Modal>
  );
}
