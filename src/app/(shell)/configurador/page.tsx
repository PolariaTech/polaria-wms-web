"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ConfiguratorPanelConnected,
  getConfiguratorActionHref,
  type ConfiguratorActionId,
} from "@/modules/configurator";

export default function ConfiguradorPage() {
  const router = useRouter();

  const handleActionClick = useCallback(
    (actionId: ConfiguratorActionId) => {
      router.push(getConfiguratorActionHref(actionId));
    },
    [router],
  );

  return <ConfiguratorPanelConnected onActionClick={handleActionClick} />;
}
