import type { LucideIcon } from "lucide-react";

export type AdminCreationOptionId =
  | "proveedores"
  | "compradores"
  | "camiones";

export type AdminAssignmentOptionId =
  | "usuarios"
  | "bodega-interna"
  | "bodega-externa";

export interface AdminMenuOption {
  id: AdminCreationOptionId | AdminAssignmentOptionId;
  title: string;
  icon: LucideIcon;
  href: string;
}

export interface AdminAssignmentCreationPanelProps {
  onCreationOptionClick?: (optionId: AdminCreationOptionId) => void;
  onAssignmentOptionClick?: (optionId: AdminAssignmentOptionId) => void;
}
