"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AssignmentPanelConnected,
  getAssignmentOptionHref,
  type AssignmentOptionId,
} from "@/modules/configurator";

export default function ConfiguradorAsignacionPage() {
  const router = useRouter();

  const handleOptionClick = useCallback(
    (optionId: AssignmentOptionId) => {
      router.push(getAssignmentOptionHref(optionId));
    },
    [router],
  );

  return <AssignmentPanelConnected onOptionClick={handleOptionClick} />;
}
