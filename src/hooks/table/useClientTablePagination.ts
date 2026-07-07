"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_TABLE_PAGE_SIZE } from "@/constants/ui/table-pagination";

export function useClientTablePagination<T>(
  rows: readonly T[],
  pageSize: number = DEFAULT_TABLE_PAGE_SIZE,
  resetKey?: string | number,
) {
  const [page, setPage] = useState(1);
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    setPage(1);
  }, [resetKey, totalItems]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize],
  );

  return {
    paginatedRows,
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    setPage,
  };
}
