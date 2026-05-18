"use client";

import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Drawer,
  Space,
  Tag,
} from "antd";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

const CATEGORIES = [
  "Fiction", "Non-Fiction", "Science", "History", "Religion",
  "Philosophy", "Education", "Health", "Arts", "Technology",
  "Law", "Economics", "Agriculture", "Literature", "Language",
];

export interface BookFormValues {
  isbn?: string;
  titleEn: string;
  titleKh?: string;
  author?: string;
  publisher?: string;
  publishYear?: number;
  category?: string;
  deweyCode?: string;
  totalCopies: number;
  tags?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: BookFormValues) => Promise<void>;
  initialValues?: Partial<BookFormValues>;
  loading?: boolean;
}

export default function BookForm({ open, onClose, onSubmit, initialValues, loading }: Props) {
  const t = useTranslations("catalog");
  const [form] = Form.useForm<BookFormValues>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues ?? { totalCopies: 1, tags: [] });
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  return (
    <Drawer
      title={initialValues ? t("editBook") : t("addBook")}
      open={open}
      onClose={onClose}
      width={480}
      extra={
        <Space>
          <Button onClick={onClose}>{useTranslations("common")("cancel")}</Button>
          <Button type="primary" loading={loading} onClick={() => form.submit()}>
            {useTranslations("common")("save")}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        requiredMark={false}
      >
        <Form.Item label={t("isbn")} name="isbn">
          <Input placeholder="978-xxx-xxx" />
        </Form.Item>
        <Form.Item label={t("titleEn")} name="titleEn" rules={[{ required: true }]}>
          <Input placeholder="Book title in English" />
        </Form.Item>
        <Form.Item label={t("titleKh")} name="titleKh">
          <Input placeholder="ចំណងជើងសៀវភៅ" />
        </Form.Item>
        <Form.Item label={t("author")} name="author">
          <Input placeholder="Author name" />
        </Form.Item>
        <Form.Item label={t("publisher")} name="publisher">
          <Input placeholder="Publisher name" />
        </Form.Item>
        <div className="flex gap-3">
          <Form.Item label={t("publishYear")} name="publishYear" className="flex-1">
            <InputNumber className="w-full" placeholder="2024" min={1000} max={9999} />
          </Form.Item>
          <Form.Item label={t("totalCopies")} name="totalCopies" className="flex-1">
            <InputNumber className="w-full" min={1} />
          </Form.Item>
        </div>
        <Form.Item label={t("category")} name="category">
          <Select
            placeholder="Select category"
            options={CATEGORIES.map((c) => ({ label: c, value: c }))}
            allowClear
          />
        </Form.Item>
        <Form.Item label={t("deweyCode")} name="deweyCode">
          <Input placeholder="e.g. 020" />
        </Form.Item>
        <Form.Item label={t("tags")} name="tags">
          <Select mode="tags" placeholder="Add tags" tokenSeparators={[","]} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
