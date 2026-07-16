import { PolariaSelectionCard } from "@/components/shared/cards/PolariaSelectionCard";
import { PolariaSelectionGrid } from "@/components/shared/cards/PolariaSelectionGrid";
import { ADMIN_PANEL_ACTIONS } from "@/modules/admin-panel/shared/constants/admin-panel-actions";
import type { AdminPanelActionId } from "@/modules/admin-panel/shared/types/admin-panel.types";

interface AdminPanelActionsGridProps {
  onActionClick?: (actionId: AdminPanelActionId) => void;
}

export function AdminPanelActionsGrid({
  onActionClick,
}: AdminPanelActionsGridProps) {
  return (
    <PolariaSelectionGrid aria-label="Acciones del panel administrativo">
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
    </PolariaSelectionGrid>
  );
}
