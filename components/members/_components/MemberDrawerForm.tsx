"use client";

import { useState, useEffect, useRef } from "react";
import { Drawer, Form, Input, Select, Button, Space, DatePicker, Upload, App } from "antd";
import { UploadOutlined, DeleteOutlined, CameraOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { UploadRequestOption } from "@rc-component/upload/lib/interface";
import { apiFetch } from "@/lib/request";
import { useMembersContext } from "../helper/hooks";
import { useMembers, type MemberPayload } from "../helper/useMembers";

interface ClassItem { id: string; name: string; grade: string | null }

function PhotoUpload() {
  const t = useTranslations("members");
  const { message } = App.useApp();
  const form = Form.useFormInstance();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sessionPublicId, setSessionPublicId] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const formValue = Form.useWatch("photo", form);
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
      const res = await fetch("/api/upload?folder=library/members", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url, publicId } = (await res.json()) as { url: string; publicId: string };
      setPreviewUrl(url);
      setSessionPublicId(publicId);
      form.setFieldValue("photo", url);
    } catch {
      message.error(t("uploadError"));
      setPreviewUrl(formValue ?? null);
    } finally {
      setUploading(false);
    }
  }

  function handleUpload({ file }: UploadRequestOption) {
    processFile(file as File);
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
    form.setFieldValue("photo", null);
  }

  const displayUrl = previewUrl ?? formValue ?? null;

  return (
    <>
      <Form.Item name="photo" noStyle><Input type="hidden" /></Form.Item>
      <Form.Item label={t("photo")}>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {displayUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayUrl}
                  alt="profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <DeleteOutlined style={{ fontSize: 10 }} />
                </button>
              </>
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-300">
                <UserOutlined style={{ fontSize: 24 }} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <Upload accept="image/*" showUploadList={false} customRequest={handleUpload}>
              <Button icon={<UploadOutlined />} loading={uploading} size="small" block>
                {displayUrl ? t("changePhoto") : t("uploadPhoto")}
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
              size="small"
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

function MemberFields() {
  const t = useTranslations("members");
  const memberType = Form.useWatch("type");

  const { data: classes = [] } = useQuery<ClassItem[]>({
    queryKey: ["classes"],
    queryFn: () => apiFetch<ClassItem[]>("/api/classes"),
  });

  const classOptions = Object.entries(
    classes.reduce<Record<string, ClassItem[]>>((acc, c) => {
      const key = c.grade ?? t("classOther");
      (acc[key] ??= []).push(c);
      return acc;
    }, {})
  ).map(([grade, items]) => ({
    label: `${t("grade")} ${grade}`,
    options: items.map((c) => ({ label: c.name, value: c.id })),
  }));

  return (
    <>
      <PhotoUpload />
      <Form.Item label={t("nameKh")} name="nameKh" rules={[{ required: true }]}>
        <Input placeholder="ឈ្មោះពេញ" />
      </Form.Item>
      <Form.Item label={t("nameEn")} name="nameEn">
        <Input />
      </Form.Item>
      <Form.Item label={t("type")} name="type" rules={[{ required: true }]} initialValue="PUBLIC">
        <Select
          options={[
            { label: t("types.STUDENT"), value: "STUDENT" },
            { label: t("types.TEACHER"), value: "TEACHER" },
            { label: t("types.PUBLIC"), value: "PUBLIC" },
            { label: t("types.RESEARCHER"), value: "RESEARCHER" },
          ]}
        />
      </Form.Item>
      {memberType === "STUDENT" && (
        <Form.Item label={t("class")} name="classId">
          <Select
            showSearch
            allowClear
            placeholder={t("classPlaceholder")}
            options={classOptions}
            optionFilterProp="label"
          />
        </Form.Item>
      )}
      <Form.Item label={t("phone")} name="phone">
        <Input placeholder="+855 xx xxx xxxx" />
      </Form.Item>
      <Form.Item label={t("email")} name="email" rules={[{ type: "email" }]}>
        <Input placeholder="email@example.com" />
      </Form.Item>
      <Form.Item label={t("expiresAt")} name="expiresAt">
        <DatePicker className="w-full" format="DD/MM/YYYY" />
      </Form.Item>
    </>
  );
}

function normalizeValues(values: MemberPayload & { expiresAt?: dayjs.Dayjs }): MemberPayload {
  return { ...values, photo: values.photo ?? null, expiresAt: values.expiresAt?.toISOString() ?? null };
}

export function CreateMemberDrawer() {
  const { createForm } = useMembersContext();
  const { createMember } = useMembers();
  const t = useTranslations("members");
  const tc = useTranslations("common");

  return (
    <Drawer
      title={t("addMember")}
      open={createForm.isOpen}
      onClose={createForm.close}
      styles={{ wrapper: { width: "min(440px, 100vw)" } }}
      extra={
        <Space>
          <Button onClick={createForm.close}>{tc("cancel")}</Button>
          <Button type="primary" onClick={() => createForm.form.submit()}>{tc("save")}</Button>
        </Space>
      }
    >
      <Form
        form={createForm.form}
        layout="vertical"
        onFinish={(v) => createMember(normalizeValues(v))}
        requiredMark="optional"
      >
        <MemberFields />
      </Form>
    </Drawer>
  );
}

export function EditMemberDrawer() {
  const { editForm } = useMembersContext();
  const { updateMember } = useMembers();
  const t = useTranslations("members");
  const tc = useTranslations("common");

  return (
    <Drawer
      title={t("editMember")}
      open={editForm.isOpen}
      onClose={editForm.close}
      styles={{ wrapper: { width: "min(440px, 100vw)" } }}
      extra={
        <Space>
          <Button onClick={editForm.close}>{tc("cancel")}</Button>
          <Button type="primary" onClick={() => editForm.form.submit()}>{tc("save")}</Button>
        </Space>
      }
    >
      <Form
        form={editForm.form}
        layout="vertical"
        onFinish={(v) => updateMember(normalizeValues(v))}
        requiredMark="optional"
      >
        <MemberFields />
      </Form>
    </Drawer>
  );
}
