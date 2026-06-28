import { CONFIGURATOR_ACTIONS } from "../constants/configurator-actions";
import type { ConfiguratorActionId } from "../types/configurator.types";
import { ConfiguratorActionCard } from "./ConfiguratorActionCard";

interface ConfiguratorActionsGridProps {
  onActionClick?: (actionId: ConfiguratorActionId) => void;
}

export function ConfiguratorActionsGrid({
  onActionClick,
}: ConfiguratorActionsGridProps) {
  const featuredActions = CONFIGURATOR_ACTIONS.filter((action) => action.featured);
  const standardActions = CONFIGURATOR_ACTIONS.filter((action) => !action.featured);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 sm:gap-5 sm:px-6 lg:gap-6">
      {featuredActions.length > 0 ? (
        <section aria-label="Acción destacada del configurador" className="w-full">
          {featuredActions.map((action) => (
            <ConfiguratorActionCard
              key={action.id}
              action={action}
              onClick={onActionClick}
              featured
            />
          ))}
        </section>
      ) : null}

      <section
        aria-label="Acciones del configurador"
        className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6"
      >
        {standardActions.map((action) => (
          <ConfiguratorActionCard
            key={action.id}
            action={action}
            onClick={onActionClick}
          />
        ))}
      </section>
    </div>
  );
}
