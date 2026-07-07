import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";
import { ADMIN_PANEL_ACTIONS } from "@/modules/admin-panel/shared/constants/admin-panel-actions";
import type { AdminPanelActionId } from "@/modules/admin-panel/shared/types/admin-panel.types";

interface AdminPanelActionsGridProps {
  onActionClick?: (actionId: AdminPanelActionId) => void;
}

export function AdminPanelActionsGrid({
  onActionClick,
}: AdminPanelActionsGridProps) {
  return (
    <section
      aria-label="Acciones del panel administrativo"
      className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:gap-5 sm:px-6 lg:grid-cols-3 lg:gap-6"
    >
      {ADMIN_PANEL_ACTIONS.map((action) => (
        <PolariaSelectionCard
          key={action.id}
          option={{
            id: action.id,
            title: action.title,
            icon: action.icon,
          }}
          onClick={(optionId) =>
            onActionClick?.(optionId as AdminPanelActionId)
          }
        />
      ))}
    </section>
  );
}
