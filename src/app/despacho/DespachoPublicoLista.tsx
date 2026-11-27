"use client";

import { DespachoQuienDespacha } from "./despacho-publico-ui";
import { PantallaOrdenes } from "./despacho-publico-listas";
import { useFlujoDespacho } from "./despacho-publico-flujo";
import type { OrdenDespachoPublico } from "@/modules/sales/ordenes/despacho/despacho-publico";

interface DespachoPublicoListaProps {
  alistada: OrdenDespachoPublico[];
  alistamiento: OrdenDespachoPublico[];
  errorCarga: string | null;
}

export function DespachoPublicoLista({
  alistada,
  alistamiento,
  errorCarga,
}: DespachoPublicoListaProps) {
  const flujo = useFlujoDespacho();
  if (!flujo.defecto) {
    return (
      <DespachoQuienDespacha
        nombre={flujo.despachador}
        errorCarga={errorCarga}
        error={flujo.error}
        onNombre={flujo.setDespachador}
        onContinuar={flujo.guardar}
      />
    );
  }
  return (
    <PantallaOrdenes
      alistada={alistada}
      alistamiento={alistamiento}
      errorCarga={errorCarga}
      flujo={flujo}
    />
  );
}
