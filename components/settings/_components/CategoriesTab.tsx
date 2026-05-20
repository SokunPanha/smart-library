"use client";

import { useState, useEffect } from "react";
import { Table, Button, Input, Space, Popconfirm, Modal, Form, App, Tag, Tabs } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/request";
import { useTableScroll } from "@/lib/hooks";
import type { ColumnsType } from "antd/es/table";

type Category = { id: string; name: string; createdAt: string };

function parseBulkNames(raw: string): string[] {
  return [...new Set(raw.split("\n").map((l) => l.trim()).filter(Boolean))];
}

function CreateCategoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const qc = useQueryClient();
  const t = useTranslations("settings");
  const tc = useTranslations("common");

  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);

  const bulkNames = parseBulkNames(bulkText);

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBulkText("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab("single");
    }
  }, [open]);

  async function handleSingleFinish({ name }: { name: string }) {
    setSaving(true);
    try {
      await apiFetch("/api/categories", { method: "POST", body: JSON.stringify({ name }) });
      message.success(t("categories.savedSuccess"));
      qc.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : t("categories.failedToSave"));
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkSubmit() {
    if (!bulkNames.length) {
      message.warning(t("categories.noNames"));
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch<{ created: number; skipped: number }>(
        "/api/categories",
        { method: "POST", body: JSON.stringify({ names: bulkNames }) }
      );
      let msg = t("categories.bulkCreated", { created: res.created });
      if (res.skipped > 0) msg += " " + t("categories.bulkSkipped", { skipped: res.skipped });
      message.success(msg);
      qc.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : t("categories.failedToSave"));
    } finally {
      setSaving(false);
    }
  }

  function handleOk() {
    if (tab === "single") {
      form.submit();
    } else {
      handleBulkSubmit();
    }
  }

  return (
    <Modal
      open={open}
      title={t("categories.addCategory")}
      onCancel={onClose}
      onOk={handleOk}
      okText={tc("save")}
      cancelText={tc("cancel")}
      confirmLoading={saving}
      destroyOnHidden
      width={440}
    >
      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as "single" | "bulk")}
        size="small"
        className="mt-2"
        items={[
          {
            key: "single",
            label: t("categories.tabSingle"),
            children: (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSingleFinish}
                requiredMark="optional"
                className="mt-3"
              >
                <Form.Item
                  label={t("categories.name")}
                  name="name"
                  rules={[{ required: true }]}
                >
                  <Input autoFocus placeholder="e.g. Fiction" />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: "bulk",
            label: t("categories.tabBulk"),
            children: (
              <div className="mt-3 space-y-3">
                <Input.TextArea
                  rows={7}
                  placeholder={t("categories.bulkPlaceholder")}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-slate-400">{t("categories.bulkHint")}</p>

                {bulkNames.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">
                      {t("categories.bulkPreview", { count: bulkNames.length })}
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded border border-slate-200">
                      {bulkNames.map((name) => (
                        <Tag key={name} className="border-0 bg-blue-50 text-blue-700 text-xs">
                          {name}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}

function EditCategoryModal({
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      form.resetFields();
      if (category) form.setFieldsValue({ name: category.name });
    }, 0);
    return () => clearTimeout(id);
  }, [open, category, form]);

  async function handleFinish({ name }: { name: string }) {
    if (!category) return;
    setSaving(true);
    try {
      await apiFetch(`/api/categories/${category.id}`, { method: "PUT", body: JSON.stringify({ name }) });
      message.success(t("categories.savedSuccess"));
      qc.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : t("categories.failedToSave"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={t("categories.editCategory")}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={tc("save")}
      cancelText={tc("cancel")}
      confirmLoading={saving}
      destroyOnHidden
      width={400}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark="optional"
        className="mt-4"
      >
        <Form.Item label={t("categories.name")} name="name" rules={[{ required: true }]}>
          <Input autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function CategoriesTab() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
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
      message.error(e instanceof Error ? e.message : t("categories.failedToDelete"));
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
            onClick={() => setEditCategory(record)}
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
      <div className="flex flex-wrap items-center gap-3 mb-4">
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
          onClick={() => setCreateOpen(true)}
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
          scroll={{ x: "max-content", y: scrollY }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => t("categories.total", { total }),
          }}
          locale={{ emptyText: tc("noData") }}
        />
      </div>

      <CreateCategoryModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditCategoryModal
        open={!!editCategory}
        category={editCategory}
        onClose={() => setEditCategory(null)}
      />
    </>
  );
}
