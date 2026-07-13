import {
  OPERARIO_A_BODEGA_EMPTY_HINT,
  OPERARIO_A_BODEGA_EMPTY_MESSAGE,
  formatOperarioTareasCount,
} from "@/modules/operario/constants/operario-a-bodega";

export const PROCESADOR_OPERACION_PAGE_TITLE = "Procesamiento" as const;

export const PROCESADOR_OPERACION_PAGE_HINT =
  "Órdenes en curso en la zona de procesamiento. Declara la merma y cierra cada transformación." as const;

export const PROCESADOR_OPERACION_PANEL_PROCESAR = "Procesar" as const;
export const PROCESADOR_OPERACION_PANEL_VACIO = "A bodega" as const;

export const PROCESADOR_OPERACION_EMPTY_MESSAGE = OPERARIO_A_BODEGA_EMPTY_MESSAGE;
export const PROCESADOR_OPERACION_EMPTY_HINT = OPERARIO_A_BODEGA_EMPTY_HINT;

export const PROCESADOR_SOLICITUD_CARD_HINT =
  "Tocá para marcar como pendiente (merma)." as const;

export const formatProcesadorTareasCount = formatOperarioTareasCount;
