import { CONFIGURATOR_ACTIONS } from "@/modules/configurator/shared/constants/configurator-actions";
import type { ConfiguratorActionId } from "@/modules/configurator/shared/types/configurator.types";
import { ConfiguratorActionCard } from "@/modules/configurator/shared/components/ConfiguratorActionCard";

interface ConfiguratorActionsGridProps {
  onActionClick?: (actionId: ConfiguratorActionId) => void;
}

export function ConfiguratorActionsGrid({
  onActionClick,
}: ConfiguratorActionsGridProps) {
  return (
    <section
      aria-label="Acciones del configurador"
      className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:gap-5 sm:px-6 lg:grid-cols-3 lg:gap-6"
    >
      {CONFIGURATOR_ACTIONS.map((action) => (
        <ConfiguratorActionCard
          key={action.id}
          action={action}
          onClick={onActionClick}
        />
      ))}
    </section>
  );
}
