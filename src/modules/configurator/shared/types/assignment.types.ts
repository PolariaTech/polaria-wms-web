import type { LucideIcon } from "lucide-react";

export type AssignmentOptionId = "usuarios" | "impresoras";

export interface AssignmentOption {
  id: AssignmentOptionId;
  title: string;
  icon: LucideIcon;
  href?: string;
}

export interface AssignmentPanelProps {
  onOptionClick?: (optionId: AssignmentOptionId) => void;
}
