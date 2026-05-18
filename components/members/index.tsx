"use client";

import { useState } from "react";
import { Table, Button, Input } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { MembersProvider, useMembersContext } from "./helper/hooks";
import { useFetchMembers } from "./helper/useFetchMembers";
import { useMembers } from "./helper/useMembers";
import { buildMemberColumns } from "./_components/Columns";
import { CreateMemberDrawer, EditMemberDrawer } from "./_components/MemberDrawerForm";
import { useDebounce, useTableScroll } from "@/lib/hooks";

function MembersPageInner() {
  const ctx = useMembersContext();
  const actions = useMembers();

  const [inputVal, setInputVal] = useState("");
  const search = useDebounce(inputVal, 400);

  const t = useTranslations();
  const { data, isLoading } = useFetchMembers(search, ctx.table.page);
  const columns = buildMemberColumns({ ctx, actions, t });
  const { ref: tableRef, scrollY } = useTableScroll();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">{t("members.title")}</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => ctx.createForm.open()}>
          {t("members.addMember")}
        </Button>
      </div>

      <div className="bg-white border border-slate-100 rounded-lg p-4">
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder={t("members.searchPlaceholder")}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); ctx.table.setPage(1); }}
          className="max-w-sm mb-4"
          allowClear
        />
        <div ref={tableRef}>
          <Table
            columns={columns}
            dataSource={data?.members ?? []}
            rowKey="id"
            loading={isLoading}
            size="small"
            scroll={{ y: scrollY }}
            {...ctx.table.props}
            pagination={{ ...ctx.table.props.pagination, total: data?.total ?? 0 }}
            locale={{ emptyText: "No members found." }}
          />
        </div>
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
