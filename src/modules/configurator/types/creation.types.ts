import type { LucideIcon } from "lucide-react";

export type CreationOptionId =
  | "empresas"
  | "cuentas"
  | "bodega-interna"
  | "bodega-externa";

export interface CreationOption {
  id: CreationOptionId;
  title: string;
  icon: LucideIcon;
  href?: string;
}

export interface CreationPanelProps {
  onOptionClick?: (optionId: CreationOptionId) => void;
}
