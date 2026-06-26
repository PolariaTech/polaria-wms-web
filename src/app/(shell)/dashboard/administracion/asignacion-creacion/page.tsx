"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminAssignmentCreationPanelConnected,
  getAdminAssignmentOptionHref,
  getAdminCreationOptionHref,
  type AdminAssignmentOptionId,
  type AdminCreationOptionId,
} from "@/modules/admin-panel";

export default function DashboardAdminAssignmentCreationPage() {
  const router = useRouter();

  const handleCreationOptionClick = useCallback(
    (optionId: AdminCreationOptionId) => {
      router.push(getAdminCreationOptionHref(optionId));
    },
    [router],
  );

  const handleAssignmentOptionClick = useCallback(
    (optionId: AdminAssignmentOptionId) => {
      router.push(getAdminAssignmentOptionHref(optionId));
    },
    [router],
  );

  return (
    <AdminAssignmentCreationPanelConnected
      onCreationOptionClick={handleCreationOptionClick}
      onAssignmentOptionClick={handleAssignmentOptionClick}
    />
  );
}
