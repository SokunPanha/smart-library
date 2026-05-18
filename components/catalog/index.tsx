"use client";

import { useState } from "react";
import { Table, Button, Input } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { CatalogProvider, useCatalogContext } from "./helper/hooks";
import { useFetchBooks } from "./helper/useFetchBooks";
import { useBooks } from "./helper/useBooks";
import { buildBookColumns } from "./_components/Columns";
import { CreateBookDrawer, EditBookDrawer } from "./_components/BookDrawerForm";
import { useDebounce, useTableScroll } from "@/lib/hooks";

function CatalogPageInner() {
  const ctx = useCatalogContext();
  const actions = useBooks();

  const [inputVal, setInputVal] = useState("");
  const search = useDebounce(inputVal, 400);

  const t = useTranslations();
  const { data, isLoading } = useFetchBooks(search, ctx.table.page);
  const columns = buildBookColumns({ ctx, actions, t });
  const { ref: tableRef, scrollY } = useTableScroll();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">{t("catalog.title")}</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => ctx.createForm.open()}>
          {t("catalog.addBook")}
        </Button>
      </div>

      <div className="bg-white border border-slate-100 rounded-lg p-4">
        <Input
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder={t("catalog.searchPlaceholder")}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); ctx.table.setPage(1); }}
          className="max-w-sm mb-4"
          allowClear
        />
        <div ref={tableRef}>
          <Table
            columns={columns}
            dataSource={data?.books ?? []}
            rowKey="id"
            loading={isLoading}
            size="small"
            scroll={{ y: scrollY }}
            {...ctx.table.props}
            pagination={{ ...ctx.table.props.pagination, total: data?.total ?? 0 }}
            locale={{ emptyText: "No books found." }}
          />
        </div>
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
