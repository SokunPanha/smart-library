"use client";

import { useState } from "react";
import { Table, Button, Input } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { CatalogProvider, useCatalogContext } from "./helper/hooks";
import { useFetchBooks } from "./helper/useFetchBooks";
import { useBooks } from "./helper/useBooks";
import { buildBookColumns } from "./_components/Columns";
import { CreateBookDrawer, EditBookDrawer } from "./_components/BookDrawerForm";
import { useDebounce } from "@/lib/hooks";

function CatalogPageInner() {
  const ctx = useCatalogContext();
  const actions = useBooks();

  const [inputVal, setInputVal] = useState("");
  const search = useDebounce(inputVal, 400);

  const { data, isLoading } = useFetchBooks(search, ctx.table.page);
  const columns = buildBookColumns({ ctx, actions });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Catalog</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => ctx.createForm.open()}>
          Add Book
        </Button>
      </div>

      <div className="bg-white border border-slate-100 rounded-lg p-4">
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Search by title, author, ISBN…"
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); ctx.table.setPage(1); }}
          className="max-w-sm mb-4"
          allowClear
        />
        <Table
          columns={columns}
          dataSource={data?.books ?? []}
          rowKey="id"
          loading={isLoading}
          size="small"
          {...ctx.table.props}
          pagination={{ ...ctx.table.props.pagination, total: data?.total ?? 0 }}
          locale={{ emptyText: "No books found." }}
        />
      </div>

      <CreateBookDrawer />
      <EditBookDrawer />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <CatalogProvider>
      <CatalogPageInner />
    </CatalogProvider>
  );
}
