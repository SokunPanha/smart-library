"use client";

import { useState, useEffect } from "react";
import { Table, Button, Input, Space, Popconfirm, Drawer, Form, App } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/libs/utils/request";
import { useTableScroll } from "@/lib/hooks";
import type { ColumnsType } from "antd/es/table";

type Category = { id: string; name: string; createdAt: string };

function CategoryDrawer({
  open,
  category,
  onClose,
}: {
  open: boolean;
  category: Category | null;
  onClose: () => void;
}) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const qc = useQueryClient();
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (category) form.setFieldsValue({ name: category.name });
    }
  }, [open, category, form]);

  async function handleFinish({ name }: { name: string }) {
    try {
      if (category) {
        await apiFetch(`/api/categories/${category.id}`, { method: "PUT", body: JSON.stringify({ name }) });
      } else {
        await apiFetch("/api/categories", { method: "POST", body: JSON.stringify({ name }) });
      }
      message.success(t("categories.savedSuccess"));
      qc.invalidateQueries({ queryKey: ["categories"] });
      form.resetFields();
      onClose();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "Failed to save.");
    }
  }

  return (
    <Drawer
      title={category ? t("categories.editCategory") : t("categories.addCategory")}
      open={open}
      onClose={() => { form.resetFields(); onClose(); }}
      styles={{ wrapper: { width: 360 } }}
      extra={
        <Space>
          <Button onClick={() => { form.resetFields(); onClose(); }}>{tc("cancel")}</Button>
          <Button type="primary" onClick={() => form.submit()}>{tc("save")}</Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark="optional"
      >
        <Form.Item label={t("categories.name")} name="name" rules={[{ required: true }]}>
          <Input autoFocus />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

export function CategoriesTab() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const { ref: tableRef, scrollY } = useTableScroll();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Category[]>("/api/categories"),
  });

  const filtered = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  async function handleDelete(cat: Category) {
    try {
      await apiFetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      message.success(t("categories.deletedSuccess"));
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "Failed to delete.");
    }
  }

  const columns: ColumnsType<Category> = [
    {
      title: t("categories.colName"),
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: tc("actions"),
      key: "actions",
      width: 100,
      align: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setEditCategory(record); setDrawerOpen(true); }}
          />
          <Popconfirm
            title={t("categories.deleteConfirm")}
            description={t("categories.deleteDescription")}
            onConfirm={() => handleDelete(record)}
            okText={tc("delete")}
            okType="danger"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <Input.Search
          placeholder={t("categories.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          allowClear
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditCategory(null); setDrawerOpen(true); }}
        >
          {t("categories.addCategory")}
        </Button>
      </div>

      <div ref={tableRef}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ y: scrollY }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => t("categories.total", { total }),
          }}
          locale={{ emptyText: tc("noData") }}
        />
      </div>

      <CategoryDrawer
        open={drawerOpen}
        category={editCategory}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
