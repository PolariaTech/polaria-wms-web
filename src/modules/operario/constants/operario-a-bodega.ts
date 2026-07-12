export const OPERARIO_PAGE_TITLE = "Operación de bodega" as const;

export const OPERARIO_PAGE_HINT =
  "Ingresos, salidas, traslados y tareas asignadas a tu usuario en la bodega activa." as const;

export const OPERARIO_A_BODEGA_PANEL_TITLE = "A bodega" as const;

export const OPERARIO_A_BODEGA_EMPTY_MESSAGE =
  "No hay solicitudes pendientes." as const;

export const OPERARIO_A_BODEGA_EMPTY_HINT =
  "Las nuevas órdenes aparecerán aquí automáticamente." as const;

export const OPERARIO_TAREA_CARD_HINT =
  "Tarea de bodega · tocá para ejecutar y cerrar." as const;

export function formatOperarioTareasCount(count: number): string {
  return `${count} tarea${count === 1 ? "" : "s"}`;
}

/** @deprecated Usar OPERARIO_PAGE_TITLE */
export const OPERARIO_A_BODEGA_PAGE_TITLE = OPERARIO_PAGE_TITLE;

/** @deprecated Usar OPERARIO_PAGE_HINT */
export const OPERARIO_A_BODEGA_PAGE_HINT = OPERARIO_PAGE_HINT;
