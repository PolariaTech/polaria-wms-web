"use client";

import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import type { JefeBodegaActionId } from "../constants/jefe-bodega-actions";
import { JefeBodegaIngresoModal } from "./modals/JefeBodegaIngresoModal";
import { JefeBodegaRevisarModal } from "./modals/JefeBodegaRevisarModal";
import type { JefeBodegaSalidaOrdenVentaPrefill } from "../types/jefe-bodega-salida.types";
import { JefeBodegaSalidaModal } from "./modals/JefeBodegaSalidaModal";
import { JefeBodegaTransferenciaModal } from "./modals/JefeBodegaTransferenciaModal";

interface JefeBodegaActionModalsProps {
  activeModal: JefeBodegaActionId | null;
  onClose: () => void;
  codigoCuenta: string | null;
  idBodega: string | null;
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[];
  ubicacionesIngreso: UbicacionEstadoBodegaDbRow[];
  ubicacionesPicking: UbicacionEstadoBodegaDbRow[];
  ubicacionesProcesamiento: UbicacionEstadoBodegaDbRow[];
  salidaPrefillOrdenVenta?: JefeBodegaSalidaOrdenVentaPrefill | null;
  onOrdenCreated?: () => void;
}

export function JefeBodegaActionModals({
  activeModal,
  onClose,
  codigoCuenta,
  idBodega,
  ubicacionesAlmacen,
  ubicacionesIngreso,
  ubicacionesPicking,
  ubicacionesProcesamiento,
  salidaPrefillOrdenVenta = null,
  onOrdenCreated,
}: JefeBodegaActionModalsProps) {
  return (
    <>
      <JefeBodegaIngresoModal
        open={activeModal === "ingresos"}
        onClose={onClose}
        codigoCuenta={codigoCuenta}
        idBodega={idBodega}
        ubicacionesAlmacen={ubicacionesAlmacen}
        ubicacionesIngreso={ubicacionesIngreso}
        onCreated={onOrdenCreated}
      />
      <JefeBodegaTransferenciaModal
        open={activeModal === "bodega-a-bodega"}
        onClose={onClose}
        codigoCuenta={codigoCuenta}
        idBodega={idBodega}
        ubicacionesAlmacen={ubicacionesAlmacen}
        ubicacionesProcesamiento={ubicacionesProcesamiento}
        onCreated={onOrdenCreated}
      />
      <JefeBodegaRevisarModal
        open={activeModal === "revisar"}
        onClose={onClose}
        codigoCuenta={codigoCuenta}
        idBodega={idBodega}
        ubicacionesAlmacen={ubicacionesAlmacen}
        onCreated={onOrdenCreated}
      />
      <JefeBodegaSalidaModal
        open={activeModal === "crear-salida"}
        onClose={onClose}
        codigoCuenta={codigoCuenta}
        idBodega={idBodega}
        ubicacionesAlmacen={ubicacionesAlmacen}
        ubicacionesPicking={ubicacionesPicking}
        prefillOrdenVenta={salidaPrefillOrdenVenta}
        onCreated={onOrdenCreated}
      />
    </>
  );
}
