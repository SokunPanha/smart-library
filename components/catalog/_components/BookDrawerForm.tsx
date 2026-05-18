"use client";

import { Drawer, Form, Input, InputNumber, Select, Button, Space } from "antd";
import { useCatalogContext } from "../helper/hooks";
import { useBooks } from "../helper/useBooks";

const CATEGORIES = [
  "Fiction", "Non-Fiction", "Science", "History", "Religion",
  "Philosophy", "Education", "Health", "Arts", "Technology",
  "Law", "Economics", "Agriculture", "Literature", "Language",
];

function BookFields() {
  return (
    <>
      <Form.Item label="ISBN" name="isbn">
        <Input placeholder="978-xxx-xxx" />
      </Form.Item>
      <Form.Item label="Title (English)" name="titleEn" rules={[{ required: true }]}>
        <Input placeholder="Book title in English" />
      </Form.Item>
      <Form.Item label="Title (Khmer)" name="titleKh">
        <Input placeholder="ចំណងជើងសៀវភៅ" />
      </Form.Item>
      <Form.Item label="Author" name="author">
        <Input placeholder="Author name" />
      </Form.Item>
      <Form.Item label="Publisher" name="publisher">
        <Input placeholder="Publisher name" />
      </Form.Item>
      <div className="flex gap-3">
        <Form.Item label="Publish Year" name="publishYear" className="flex-1">
          <InputNumber className="w-full" placeholder="2024" min={1000} max={9999} />
        </Form.Item>
        <Form.Item label="Total Copies" name="totalCopies" className="flex-1" initialValue={1}>
          <InputNumber className="w-full" min={1} />
        </Form.Item>
      </div>
      <Form.Item label="Category" name="category">
        <Select
          placeholder="Select category"
          options={CATEGORIES.map((c) => ({ label: c, value: c }))}
          allowClear
        />
      </Form.Item>
      <Form.Item label="Dewey Code" name="deweyCode">
        <Input placeholder="e.g. 020" />
      </Form.Item>
      <Form.Item label="Tags" name="tags">
        <Select mode="tags" placeholder="Add tags" tokenSeparators={[","]} />
      </Form.Item>
    </>
  );
}

export function CreateBookDrawer() {
  const { createForm } = useCatalogContext();
  const { createBook } = useBooks();

  return (
    <Drawer
      title="Add Book"
      open={createForm.isOpen}
      onClose={createForm.close}
      styles={{ wrapper: { width: 480 } }}
      forceRender
      extra={
        <Space>
          <Button onClick={createForm.close}>Cancel</Button>
          <Button type="primary" onClick={() => createForm.form.submit()}>Save</Button>
        </Space>
      }
    >
      <Form form={createForm.form} layout="vertical" onFinish={createBook} requiredMark={false}>
        <BookFields />
      </Form>
    </Drawer>
  );
}

export function EditBookDrawer() {
  const { editForm } = useCatalogContext();
  const { updateBook } = useBooks();

  return (
    <Drawer
      title="Edit Book"
      open={editForm.isOpen}
      onClose={editForm.close}
      styles={{ wrapper: { width: 480 } }}
      forceRender
      extra={
        <Space>
          <Button onClick={editForm.close}>Cancel</Button>
          <Button type="primary" onClick={() => editForm.form.submit()}>Save</Button>
        </Space>
      }
    >
      <Form form={editForm.form} layout="vertical" onFinish={updateBook} requiredMark={false}>
        <BookFields />
      </Form>
    </Drawer>
  );
}
