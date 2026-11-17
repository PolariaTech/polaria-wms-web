"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  escribirEstadoLista,
  leerEstadoLista,
  type EstadoListaCorreos,
} from "../utils/estado-lista-url";

export function useEstadoListaEnUrl() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [inicial] = useState(() => leerEstadoLista(params));

  const guardar = useCallback(
    (estado: EstadoListaCorreos) => {
      const query = escribirEstadoLista(estado);
      if (query === params.toString()) return;
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return { inicial, guardar };
}
