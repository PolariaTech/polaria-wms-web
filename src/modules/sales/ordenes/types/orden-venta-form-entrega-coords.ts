import type { Dispatch, SetStateAction } from "react";

/** REQ-251: pin de entrega en el estado del formulario OV. */
export type OrdenVentaFormEntregaCoords = {
  entregaLat: number | null;
  entregaLng: number | null;
  setEntregaLat: Dispatch<SetStateAction<number | null>>;
  setEntregaLng: Dispatch<SetStateAction<number | null>>;
};
