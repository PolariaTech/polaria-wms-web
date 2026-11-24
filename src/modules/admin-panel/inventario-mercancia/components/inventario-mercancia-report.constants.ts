import { cn } from "@/lib/utils/cn";

export type InventarioMercanciaStep =
  | "flow"
  | "bodegas"
  | "detalle"
  | "reportes";

export const toolbarButtonClassName = cn(
  "inline-flex items-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-4 py-2.5",
  "polaria-text-body-sm font-medium text-polaria-w",
  "transition hover:border-polaria-teal hover:text-polaria-teal",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal",
);
