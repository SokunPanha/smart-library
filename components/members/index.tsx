"use client";

import { useState } from "react";
import { Table, Button, Input } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { MembersProvider, useMembersContext } from "./helper/hooks";
import { useFetchMembers } from "./helper/useFetchMembers";
import { useMembers } from "./helper/useMembers";
import { buildMemberColumns } from "./_components/Columns";
import { CreateMemberDrawer, EditMemberDrawer } from "./_components/MemberDrawerForm";
import { useDebounce } from "@/lib/hooks";

function MembersPageInner() {
  const ctx = useMembersContext();
  const actions = useMembers();

  const [inputVal, setInputVal] = useState("");
  const search = useDebounce(inputVal, 400);

  const { data, isLoading } = useFetchMembers(search, ctx.table.page);
  const columns = buildMemberColumns({ ctx, actions });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Members</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => ctx.createForm.open()}>
          Add Member
        </Button>
      </div>

      <div className="bg-white border border-slate-100 rounded-lg p-4">
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Search by name, ID, phone…"
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); ctx.table.setPage(1); }}
          className="max-w-sm mb-4"
          allowClear
        />
        <Table
          columns={columns}
          dataSource={data?.members ?? []}
          rowKey="id"
          loading={isLoading}
          size="small"
          {...ctx.table.props}
          pagination={{ ...ctx.table.props.pagination, total: data?.total ?? 0 }}
          locale={{ emptyText: "No members found." }}
        />
      </div>

      <CreateMemberDrawer />
      <EditMemberDrawer />
    </div>
  );
}

export default function MembersPage() {
  return (
    <MembersProvider>
      <MembersPageInner />
    </MembersProvider>
  );
}
