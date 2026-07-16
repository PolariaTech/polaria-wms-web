import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";
import type { ConfiguratorAction } from "@/modules/configurator/shared/types/configurator.types";

interface ConfiguratorActionCardProps {
  action: ConfiguratorAction;
  onClick?: (actionId: ConfiguratorAction["id"]) => void;
}

export function ConfiguratorActionCard({
  action,
  onClick,
}: ConfiguratorActionCardProps) {
  return (
    <PolariaSelectionCard
      option={{
        id: action.id,
        title: action.title,
        icon: action.icon,
      }}
      onClick={(optionId) => onClick?.(optionId as ConfiguratorAction["id"])}
    />
  );
}
