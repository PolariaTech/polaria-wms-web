import { CONFIGURATOR_ACTIONS } from "@/modules/configurator/shared/constants/configurator-actions";
import type { ConfiguratorActionId } from "@/modules/configurator/shared/types/configurator.types";
import { ConfiguratorActionCard } from "@/modules/configurator/shared/components/ConfiguratorActionCard";
import { PolariaSelectionGrid } from "@/components/shared/cards/PolariaSelectionGrid";

interface ConfiguratorActionsGridProps {
  onActionClick?: (actionId: ConfiguratorActionId) => void;
}

export function ConfiguratorActionsGrid({
  onActionClick,
}: ConfiguratorActionsGridProps) {
  return (
    <PolariaSelectionGrid aria-label="Acciones del configurador">
      {CONFIGURATOR_ACTIONS.map((action) => (
        <ConfiguratorActionCard
          key={action.id}
          action={action}
          onClick={onActionClick}
        />
      ))}
    </PolariaSelectionGrid>
  );
}
