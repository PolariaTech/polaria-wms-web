import type { LucideIcon } from "lucide-react";

export type ConfiguratorActionId =
  | "creation"
  | "creation-assignment"
  | "integration";

export interface ConfiguratorAction {
  id: ConfiguratorActionId;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

export interface ConfiguratorPanelProps {
  onActionClick?: (actionId: ConfiguratorActionId) => void;
}
