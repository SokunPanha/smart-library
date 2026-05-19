"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Manages table pagination + search state, and a reload trigger.
 * Spread .props into AntD <Table> pagination prop.
 */
export function useTable(queryKey: string[]) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(100);

  const reload = useCallback(() => {
    qc.invalidateQueries({ queryKey });
  }, [qc, queryKey]);

  const onSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onPageChange = (newPage: number, newSize: number) => {
    setPage(newPage);
    if (newSize !== pageSize) {
      setPageSize(newSize);
      setPage(1);
    }
  };

  return {
    page,
    search,
    pageSize,
    reload,
    onSearch,
    setPage,
    props: {
      pagination: {
        current: page,
        pageSize,
        onChange: onPageChange,
        showSizeChanger: true,
        pageSizeOptions: [10, 50, 100, 200, 300],
        showTotal: (total: number) => `${total} records`,
      },
    },
  };
}
