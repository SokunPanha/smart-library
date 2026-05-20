"use client";

import { useState, useEffect, useRef } from "react";
import { Drawer, Form, Input, InputNumber, Select, Button, Space, Upload, App, Tooltip } from "antd";
import { UploadOutlined, DeleteOutlined, CameraOutlined, BarcodeOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { UploadRequestOption } from "@rc-component/upload/lib/interface";
import { apiFetch } from "@/lib/request";
import { useCatalogContext } from "../helper/hooks";
import { useBooks } from "../helper/useBooks";
import { IsbnScanModal, type IsbnBookData } from "./IsbnScanModal";

function CoverUpload() {
  const t = useTranslations("catalog");
  const { message } = App.useApp();
  const form = Form.useFormInstance();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sessionPublicId, setSessionPublicId] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const formValue = Form.useWatch("coverImage", form);
  useEffect(() => {
    setPreviewUrl(formValue ?? null);
    if (!formValue) setSessionPublicId(null);
  }, [formValue]);

  async function deleteFromCloudinary(publicId: string) {
    await fetch(`/api/upload?publicId=${encodeURIComponent(publicId)}`, { method: "DELETE" });
  }

  async function processFile(file: File) {
    if (sessionPublicId) {
      deleteFromCloudinary(sessionPublicId);
      setSessionPublicId(null);
    }
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url, publicId } = (await res.json()) as { url: string; publicId: string };
      setPreviewUrl(url);
      setSessionPublicId(publicId);
      form.setFieldValue("coverImage", url);
    } catch {
      message.error(t("uploadError"));
      setPreviewUrl(formValue ?? null);
    } finally {
      setUploading(false);
    }
  }

  async function handleUpload({ file }: UploadRequestOption) {
    await processFile(file as File);
  }

  function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
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
      <Form.Item name="coverImage" noStyle><Input type="hidden" /></Form.Item>

      <Form.Item label={t("coverImage")}>
        <div className="flex items-start gap-3">
          {/* Preview / placeholder */}
          <div className="relative flex-shrink-0">
            {displayUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayUrl}
                  alt="cover"
                  className="w-20 h-28 object-cover rounded border border-slate-200"
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  className="absolute top-0 right-0 bg-white shadow-sm"
                  onClick={handleRemove}
                />
              </>
            ) : (
              <div className="w-20 h-28 rounded border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 text-xs text-center leading-tight px-1">
                {t("coverImage")}
              </div>
            )}
          </div>

          {/* Action buttons — stack vertically, full width */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <Upload accept="image/*" showUploadList={false} customRequest={handleUpload} className="block">
              <Button icon={<UploadOutlined />} loading={uploading} block>
                {displayUrl ? t("changeCover") : t("uploadCover")}
              </Button>
            </Upload>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCameraChange}
            />
            <Button
              icon={<CameraOutlined />}
              loading={uploading}
              block
              onClick={() => cameraInputRef.current?.click()}
            >
              {t("takePhoto")}
            </Button>
          </div>
        </div>
      </Form.Item>
    </>
  );
}

function BookFields({ autoFocusIsbn }: { autoFocusIsbn?: boolean }) {
  const t = useTranslations("catalog");
  const form = Form.useFormInstance();
  const [scanOpen, setScanOpen] = useState(false);

  const { data: categories = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["categories"],
    queryFn: () => apiFetch<{ id: string; name: string }[]>("/api/categories"),
  });

  function handleScanned(data: IsbnBookData) {
    form.setFieldsValue({
      isbn: data.isbn,
      titleEn: data.titleEn ?? undefined,
      author: data.author ?? undefined,
      publisher: data.publisher ?? undefined,
      publishYear: data.publishYear ?? undefined,
      coverImage: data.coverImage ?? undefined,
    });
  }

  return (
    <>
      <IsbnScanModal open={scanOpen} onClose={() => setScanOpen(false)} onScanned={handleScanned} />
      <CoverUpload />
      <Form.Item label={t("isbn")} name="isbn">
        <Space.Compact className="w-full">
          <Input placeholder="978-xxx-xxx" autoFocus={autoFocusIsbn} />
          <Tooltip title={t("isbnScan.scanBarcode")}>
            <Button icon={<BarcodeOutlined />} onClick={() => setScanOpen(true)} />
          </Tooltip>
        </Space.Compact>
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
      <Form.Item label={t("shelf")} name="shelfId">
        <ShelfSelect />
      </Form.Item>
    </>
  );
}

function ShelfSelect({ value, onChange }: { value?: string | null; onChange?: (v: string | null) => void }) {
  const ts = useTranslations("settings.shelves");
  const { data: shelves = [] } = useQuery<{
    id: string;
    code: string;
    label: string | null;
    section: string | null;
    cabinet: string | null;
    level: number | null;
    block: number | null;
  }[]>({
    queryKey: ["shelves"],
    queryFn: () => apiFetch("/api/shelves"),
  });
  return (
    <Select
      allowClear
      showSearch
      placeholder={ts("shelfPlaceholder")}
      optionFilterProp="label"
      value={value ?? undefined}
      onChange={(v) => onChange?.(v ?? null)}
      options={shelves.map((s) => {
        const levelLetter = s.level ? String.fromCharCode(64 + s.level) : null;
        let locationPrefix = "";
        if (s.cabinet) {
          locationPrefix = `${ts("colCabinet")} ${s.cabinet}`;
          if (levelLetter) locationPrefix += `, ${ts("colLevel")} ${levelLetter}`;
          if (s.block) locationPrefix += `, ${ts("colBlock")} ${s.block}`;
          locationPrefix += " — ";
        }
        return {
          value: s.id,
          label: `${locationPrefix}${s.code}${s.label ? ` (${s.label})` : ""}`,
        };
      })}
    />
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
