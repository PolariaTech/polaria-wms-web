"use client";

import { BodegaOperacionTabs } from "@/modules/warehouses";
import { CUSTODIO_TABS } from "../constants/custodio-tabs";
import type { CustodioTabId } from "../constants/custodio-routes";

interface CustodioOperacionTabsProps {
  activeTab: CustodioTabId;
}

export function CustodioOperacionTabs({ activeTab }: CustodioOperacionTabsProps) {
  return (
    <BodegaOperacionTabs
      tabs={CUSTODIO_TABS}
      activeTab={activeTab}
      ariaLabel="Operación custodio"
    />
  );
}
