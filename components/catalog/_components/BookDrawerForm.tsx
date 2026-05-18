"use client";

import { Drawer, Form, Input, InputNumber, Select, Button, Space } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/libs/utils/request";
import { useCatalogContext } from "../helper/hooks";
import { useBooks } from "../helper/useBooks";

function BookFields() {
  const t = useTranslations("catalog");
  const { data: categories = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["categories"],
    queryFn: () => apiFetch<{ id: string; name: string }[]>("/api/categories"),
  });

  return (
    <>
      <Form.Item label={t("isbn")} name="isbn">
        <Input placeholder="978-xxx-xxx" />
      </Form.Item>
      <Form.Item label={t("titleEn")} name="titleEn" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label={t("titleKh")} name="titleKh">
        <Input placeholder="ចំណងជើងសៀវភៅ" />
      </Form.Item>
      <Form.Item label={t("author")} name="author">
        <Input />
      </Form.Item>
      <Form.Item label={t("publisher")} name="publisher">
        <Input />
      </Form.Item>
      <div className="flex gap-3">
        <Form.Item label={t("publishYear")} name="publishYear" className="flex-1">
          <InputNumber className="w-full" placeholder="2024" min={1000} max={9999} />
        </Form.Item>
        <Form.Item label={t("totalCopies")} name="totalCopies" className="flex-1" initialValue={1} rules={[{ required: true }]}>
          <InputNumber className="w-full" min={1} />
        </Form.Item>
      </div>
      <Form.Item label={t("category")} name="category">
        <Select
          showSearch
          options={categories.map((c) => ({ label: c.name, value: c.name }))}
          allowClear
        />
      </Form.Item>
      <Form.Item label={t("deweyCode")} name="deweyCode">
        <Input placeholder="e.g. 020" />
      </Form.Item>
      <Form.Item label={t("tags")} name="tags">
        <Select mode="tags" tokenSeparators={[","]} />
      </Form.Item>
    </>
  );
}

export function CreateBookDrawer() {
  const { createForm } = useCatalogContext();
  const { createBook } = useBooks();
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  return (
    <Drawer
      title={t("addBook")}
      open={createForm.isOpen}
      onClose={createForm.close}
      styles={{ wrapper: { width: 480 } }}
      extra={
        <Space>
          <Button onClick={createForm.close}>{tc("cancel")}</Button>
          <Button type="primary" onClick={() => createForm.form.submit()}>{tc("save")}</Button>
        </Space>
      }
    >
      <Form form={createForm.form} layout="vertical" onFinish={createBook} requiredMark="optional">
        <BookFields />
      </Form>
    </Drawer>
  );
}

export function EditBookDrawer() {
  const { editForm } = useCatalogContext();
  const { updateBook } = useBooks();
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  return (
    <Drawer
      title={t("editBook")}
      open={editForm.isOpen}
      onClose={editForm.close}
      styles={{ wrapper: { width: 480 } }}
      extra={
        <Space>
          <Button onClick={editForm.close}>{tc("cancel")}</Button>
          <Button type="primary" onClick={() => editForm.form.submit()}>{tc("save")}</Button>
        </Space>
      }
    >
      <Form form={editForm.form} layout="vertical" onFinish={updateBook} requiredMark="optional">
        <BookFields />
      </Form>
    </Drawer>
  );
}
