import { type ReactNode } from "react";

export interface PolariaDataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface PolariaDataTableProps<T> {
  title: string;
  subtitle?: string;
  isLoading: boolean;
  error: string | null;
  rows: readonly T[];
  columns: readonly PolariaDataTableColumn<T>[];
  getRowKey: (row: T) => string;
  emptyMessage: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void;
    /** false = solo el texto (p. ej. “+ Cliente”). */
    showIcon?: boolean;
  };
  additionalActions?: readonly {
    label: string;
    onClick?: () => void;
    variant?: "primary" | "outline";
    disabled?: boolean;
    title?: string;
    icon?: ReactNode;
    iconOnly?: boolean;
  }[];
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  className?: string;
  /** Fila clickeable (p. ej. abrir detalle). */
  onRowClick?: (row: T) => void;
  getRowAriaLabel?: (row: T) => string;
  pageSize?: number;
  pagination?: boolean;
  tableClassName?: string;
}
