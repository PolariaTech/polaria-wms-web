"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CreationPanelConnected,
  getCreationOptionHref,
  type CreationOptionId,
} from "@/modules/configurator";

export default function ConfiguradorCreacionPage() {
  const router = useRouter();

  const handleOptionClick = useCallback(
    (optionId: CreationOptionId) => {
      router.push(getCreationOptionHref(optionId));
    },
    [router],
  );

  return <CreationPanelConnected onOptionClick={handleOptionClick} />;
}
