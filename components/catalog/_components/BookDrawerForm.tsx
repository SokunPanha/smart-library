"use client";

import { useState, useEffect } from "react";
import { Drawer, Form, Input, InputNumber, Select, Button, Space, Upload, App, Image } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { UploadRequestOption } from "rc-upload/lib/interface";
import { apiFetch } from "@/libs/utils/request";
import { useCatalogContext } from "../helper/hooks";
import { useBooks } from "../helper/useBooks";

function CoverUpload() {
  const t = useTranslations("catalog");
  const { message } = App.useApp();
  const form = Form.useFormInstance();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Tracks the Cloudinary public_id of an image uploaded in this session (not from DB).
  // Cleared when the form resets so we don't try to delete already-saved images.
  const [sessionPublicId, setSessionPublicId] = useState<string | null>(null);

  // Sync preview when form is reset (drawer close) or populated (edit mode).
  // Also clears sessionPublicId so a post-save reset doesn't delete the saved image.
  const formValue = Form.useWatch("coverImage", form);
  useEffect(() => {
    setPreviewUrl(formValue ?? null);
    if (!formValue) setSessionPublicId(null);
  }, [formValue]);

  async function deleteFromCloudinary(publicId: string) {
    await fetch(`/api/upload?publicId=${encodeURIComponent(publicId)}`, { method: "DELETE" });
  }

  async function handleUpload({ file }: UploadRequestOption) {
    // If a session-uploaded image exists, delete it from Cloudinary before uploading the new one
    if (sessionPublicId) {
      deleteFromCloudinary(sessionPublicId);
      setSessionPublicId(null);
    }
    // Show instant local preview before upload completes
    const objectUrl = URL.createObjectURL(file as Blob);
    setPreviewUrl(objectUrl);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file as File);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url, publicId } = (await res.json()) as { url: string; publicId: string };
      setPreviewUrl(url);
      setSessionPublicId(publicId);
      form.setFieldValue("coverImage", url);
    } catch {
      message.error("Failed to upload image.");
      setPreviewUrl(formValue ?? null);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (sessionPublicId) {
      await deleteFromCloudinary(sessionPublicId);
      setSessionPublicId(null);
    }
    setPreviewUrl(null);
    form.setFieldValue("coverImage", null);
  }

  const displayUrl = previewUrl ?? formValue ?? null;

  return (
    <>
      {/* Hidden field stores the URL in the form */}
      <Form.Item name="coverImage" noStyle><Input type="hidden" /></Form.Item>

      <Form.Item label={t("coverImage")}>
        <div className="flex flex-col gap-2">
          {displayUrl && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayUrl}
                alt="cover"
                className="w-24 h-32 object-cover rounded border border-slate-200"
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                className="absolute top-0 right-0 bg-white shadow-sm"
                onClick={handleRemove}
              />
            </div>
          )}
          <Upload accept="image/*" showUploadList={false} customRequest={handleUpload}>
            <Button icon={<UploadOutlined />} loading={uploading} size="small">
              {displayUrl ? t("changeCover") : t("uploadCover")}
            </Button>
          </Upload>
        </div>
      </Form.Item>
    </>
  );
}

function BookFields({ autoFocusIsbn }: { autoFocusIsbn?: boolean }) {
  const t = useTranslations("catalog");
  const { data: categories = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["categories"],
    queryFn: () => apiFetch<{ id: string; name: string }[]>("/api/categories"),
  });

  return (
    <>
      <CoverUpload />
      <Form.Item label={t("isbn")} name="isbn">
        <Input placeholder="978-xxx-xxx" autoFocus={autoFocusIsbn} />
      </Form.Item>
      <Form.Item label={t("titleEn")} name="titleEn">
        <Input />
      </Form.Item>
      <Form.Item label={t("titleKh")} name="titleKh" rules={[{ required: true }]}>
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
      <Form.Item label={t("category")} name="category" rules={[{ required: true }]}>
        <Select
          showSearch
          options={categories.map((c) => ({ label: c.name, value: c.name }))}
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
  const { createBook, createBookAndContinue } = useBooks();
  const t = useTranslations("catalog");
  const tc = useTranslations("common");

  async function handleSaveAndAdd() {
    const values = await createForm.form.validateFields().catch(() => null);
    if (!values) return;
    await createBookAndContinue(values, () => {
      setTimeout(() => createForm.form.resetFields(), 0);
    });
  }

  return (
    <Drawer
      title={t("addBook")}
      open={createForm.isOpen}
      onClose={createForm.close}
      styles={{ wrapper: { width: "min(480px, 100vw)" } }}
      extra={
        <Space>
          <Button onClick={createForm.close}>{tc("cancel")}</Button>
          <Button onClick={handleSaveAndAdd}>{t("saveAndAddAnother")}</Button>
          <Button type="primary" onClick={() => createForm.form.submit()}>{tc("save")}</Button>
        </Space>
      }
    >
      <Form form={createForm.form} layout="vertical" onFinish={createBook} requiredMark="optional">
        <BookFields autoFocusIsbn />
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
      styles={{ wrapper: { width: "min(480px, 100vw)" } }}
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
