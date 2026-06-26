import type { LucideIcon } from "lucide-react";

export type AdminPanelActionId =
  | "assignment-creation"
  | "catalog"
  | "reports";

export interface AdminPanelAction {
  id: AdminPanelActionId;
  title: string;
  icon: LucideIcon;
  href: string;
}

export interface AdminPanelProps {
  onActionClick?: (actionId: AdminPanelActionId) => void;
}
