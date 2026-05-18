"use client";

import { Drawer, Form, Input, Select, Button, Space, DatePicker } from "antd";
import dayjs from "dayjs";
import { useMembersContext } from "../helper/hooks";
import { useMembers, type MemberPayload } from "../helper/useMembers";

function MemberFields() {
  return (
    <>
      <Form.Item label="Member ID" name="memberId" rules={[{ required: true }]}>
        <Input placeholder="e.g. LIB-2024-001" />
      </Form.Item>
      <Form.Item label="Name (English)" name="nameEn">
        <Input placeholder="Full name" />
      </Form.Item>
      <Form.Item label="Name (Khmer)" name="nameKh">
        <Input placeholder="ឈ្មោះពេញ" />
      </Form.Item>
      <Form.Item label="Member Type" name="type" rules={[{ required: true }]} initialValue="PUBLIC">
        <Select
          options={[
            { label: "Student / និស្សិត", value: "STUDENT" },
            { label: "Teacher / គ្រូ", value: "TEACHER" },
            { label: "Public / សាធារណជន", value: "PUBLIC" },
            { label: "Researcher / អ្នកស្រាវជ្រាវ", value: "RESEARCHER" },
          ]}
        />
      </Form.Item>
      <Form.Item label="Phone" name="phone">
        <Input placeholder="+855 xx xxx xxxx" />
      </Form.Item>
      <Form.Item label="Email" name="email" rules={[{ type: "email" }]}>
        <Input placeholder="email@example.com" />
      </Form.Item>
      <Form.Item label="Membership Expires" name="expiresAt">
        <DatePicker className="w-full" format="DD/MM/YYYY" />
      </Form.Item>
    </>
  );
}

function normalizeValues(values: MemberPayload & { expiresAt?: dayjs.Dayjs }): MemberPayload {
  return { ...values, expiresAt: values.expiresAt?.toISOString() ?? null };
}

export function CreateMemberDrawer() {
  const { createForm } = useMembersContext();
  const { createMember } = useMembers();

  return (
    <Drawer
      title="Add Member"
      open={createForm.isOpen}
      onClose={createForm.close}
      styles={{ wrapper: { width: 440 } }}
      forceRender
      extra={
        <Space>
          <Button onClick={createForm.close}>Cancel</Button>
          <Button type="primary" onClick={() => createForm.form.submit()}>Save</Button>
        </Space>
      }
    >
      <Form
        form={createForm.form}
        layout="vertical"
        onFinish={(v) => createMember(normalizeValues(v))}
        requiredMark={false}
      >
        <MemberFields />
      </Form>
    </Drawer>
  );
}

export function EditMemberDrawer() {
  const { editForm } = useMembersContext();
  const { updateMember } = useMembers();

  return (
    <Drawer
      title="Edit Member"
      open={editForm.isOpen}
      onClose={editForm.close}
      styles={{ wrapper: { width: 440 } }}
      forceRender
      extra={
        <Space>
          <Button onClick={editForm.close}>Cancel</Button>
          <Button type="primary" onClick={() => editForm.form.submit()}>Save</Button>
        </Space>
      }
    >
      <Form
        form={editForm.form}
        layout="vertical"
        onFinish={(v) => updateMember(normalizeValues(v))}
        requiredMark={false}
      >
        <MemberFields />
      </Form>
    </Drawer>
  );
}
