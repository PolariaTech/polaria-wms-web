"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { JEFE_BODEGA_HOME_ROUTE } from "../constants/jefe-bodega-actions";

export function JefeBodegaEstadoRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(JEFE_BODEGA_HOME_ROUTE);
  }, [router]);

  return null;
}
