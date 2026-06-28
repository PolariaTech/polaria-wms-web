import type { LucideIcon } from "lucide-react";

export type ConfiguratorActionId =
  | "onboarding"
  | "creation"
  | "creation-assignment"
  | "integration";

export interface ConfiguratorAction {
  id: ConfiguratorActionId;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  featured?: boolean;
}

export interface ConfiguratorPanelProps {
  onActionClick?: (actionId: ConfiguratorActionId) => void;
}
