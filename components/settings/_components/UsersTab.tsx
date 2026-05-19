"use client";

import { useState, useEffect } from "react";
import { Table, Button, Tag, Space, Popconfirm, Drawer, Form, Input, Select, App } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/libs/utils/request";
import { useTableScroll } from "@/lib/hooks";
import type { ColumnsType } from "antd/es/table";

type StaffUser = {
  id: string;
  email: string;
  nameEn: string;
  nameKh: string | null;
  role: "ADMIN" | "LIBRARIAN" | "STAFF";
  createdAt: string;
};

const ROLE_COLOR: Record<string, string> = { ADMIN: "red", LIBRARIAN: "blue", STAFF: "default" };

function UserDrawer({ open, user, onClose }: { open: boolean; user: StaffUser | null; onClose: () => void }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const qc = useQueryClient();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const isEdit = !!user;

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      form.resetFields();
      if (user) form.setFieldsValue(user);
      else form.setFieldsValue({ role: "LIBRARIAN" });
    }, 0);
    return () => clearTimeout(id);
  }, [open, user, form]);

  async function handleFinish(values: Record<string, string>) {
    try {
      if (isEdit) {
        await apiFetch(`/api/users/${user!.id}`, { method: "PUT", body: JSON.stringify(values) });
      } else {
        await apiFetch("/api/users", { method: "POST", body: JSON.stringify(values) });
      }
      message.success(t("users.savedSuccess"));
      qc.invalidateQueries({ queryKey: ["staff-users"] });
      form.resetFields();
      onClose();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "Failed to save user.");
    }
  }

  return (
    <Drawer
      title={isEdit ? t("users.editUser") : t("users.addUser")}
      open={open}
      onClose={() => { form.resetFields(); onClose(); }}
      styles={{ wrapper: { width: 420 } }}
      extra={
        <Space>
          <Button onClick={() => { form.resetFields(); onClose(); }}>{tc("cancel")}</Button>
          <Button type="primary" onClick={() => form.submit()}>{tc("save")}</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark="optional">
        <Form.Item label={t("users.nameEn")} name="nameEn" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={t("users.nameKh")} name="nameKh">
          <Input placeholder="ឈ្មោះពេញ" />
        </Form.Item>
        {!isEdit && (
          <Form.Item label={t("users.email")} name="email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
        )}
        <Form.Item
          label={isEdit ? t("users.newPassword") : t("users.password")}
          name="password"
          rules={isEdit ? [] : [{ required: true, min: 6 }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item label={t("users.role")} name="role" rules={[{ required: true }]}>
          <Select
            options={[
              { label: t("users.roles.ADMIN"), value: "ADMIN" },
              { label: t("users.roles.LIBRARIAN"), value: "LIBRARIAN" },
              { label: t("users.roles.STAFF"), value: "STAFF" },
            ]}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

export function UsersTab() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const { ref: tableRef, scrollY } = useTableScroll();

  const { data: users = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ["staff-users"],
    queryFn: () => apiFetch<StaffUser[]>("/api/users"),
  });

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      message.success(t("users.deletedSuccess"));
      qc.invalidateQueries({ queryKey: ["staff-users"] });
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "Failed to delete user.");
    }
  }

  const columns: ColumnsType<StaffUser> = [
    { title: t("users.colName"), dataIndex: "nameEn", key: "nameEn" },
    { title: t("users.colEmail"), dataIndex: "email", key: "email" },
    {
      title: t("users.colRole"),
      dataIndex: "role",
      key: "role",
      render: (r: string) => <Tag color={ROLE_COLOR[r]}>{t(`users.roles.${r}`)}</Tag>,
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setEditUser(record); setDrawerOpen(true); }}
          >
            {tc("edit")}
          </Button>
          <Popconfirm
            title={t("users.deleteConfirm")}
            onConfirm={() => handleDelete(record.id)}
            okText={tc("delete")}
            okType="danger"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>{tc("delete")}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditUser(null); setDrawerOpen(true); }}>
          {t("users.addUser")}
        </Button>
      </div>
      <div ref={tableRef}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ y: scrollY }}
          pagination={false}
        />
      </div>
      <UserDrawer open={drawerOpen} user={editUser} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
