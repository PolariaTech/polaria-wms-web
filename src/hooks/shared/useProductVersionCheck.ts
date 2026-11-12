"use client";

import { useCallback, useEffect, useState } from "react";
import { POLARIA_PRODUCT_VERSION } from "@/constants/brand/brand";
import { fetchDeployProductVersion } from "@/lib/product-version/fetch-deploy-product-version";
import { isProductVersionCheckEnabled } from "@/lib/product-version/is-product-version-check-enabled";
import { PRODUCT_VERSION_CHECK_INTERVAL_MS } from "@/lib/product-version/product-version-constants";
import { useVisibleInterval } from "./useVisibleInterval";

/**
 * Compara la versión del bundle con la del deploy. Solo en producción.
 */
export function useProductVersionCheck(enabled = true): {
  updateAvailable: boolean;
} {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const checkEnabled = enabled && isProductVersionCheckEnabled();

  const checkVersion = useCallback(() => {
    if (!checkEnabled || updateAvailable) return;
    void (async () => {
      const deployVersion = await fetchDeployProductVersion();
      if (!deployVersion) return;
      if (deployVersion !== POLARIA_PRODUCT_VERSION) {
        setUpdateAvailable(true);
      }
    })();
  }, [checkEnabled, updateAvailable]);

  useEffect(() => {
    checkVersion();
  }, [checkVersion]);

  useVisibleInterval(
    checkVersion,
    PRODUCT_VERSION_CHECK_INTERVAL_MS,
    checkEnabled && !updateAvailable,
  );

  return { updateAvailable };
}
