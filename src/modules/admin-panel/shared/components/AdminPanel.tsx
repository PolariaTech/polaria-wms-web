"use client";

import type { AdminPanelActionId, AdminPanelProps } from "@/modules/admin-panel/shared/types/admin-panel.types";
import { AdminPanelActionsGrid } from "./AdminPanelActionsGrid";
import { AdminPanelHeader } from "./AdminPanelHeader";

export function AdminPanel({ onActionClick }: AdminPanelProps) {
  return (
    <main className="flex flex-1 flex-col justify-start gap-8 pt-8 pb-10 sm:gap-10 sm:pt-12 sm:pb-14 lg:gap-12 lg:pt-16 lg:pb-20">
      <AdminPanelHeader />
      <AdminPanelActionsGrid onActionClick={onActionClick} />
    </main>
  );
}

interface AdminPanelConnectedProps {
  onActionClick?: (actionId: AdminPanelActionId) => void;
}

export function AdminPanelConnected({
  onActionClick,
}: AdminPanelConnectedProps) {
  return <AdminPanel onActionClick={onActionClick} />;
}
