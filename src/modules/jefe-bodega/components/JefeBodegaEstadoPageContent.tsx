"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EstadoBodegaPageContent } from "@/modules/warehouses";
import { listUbicacionesEstadoBodega } from "@/modules/warehouses/estado-bodega/services/estado-bodega.service";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import { OrdenProcesamientoCreateModal } from "@/modules/processing";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import type { JefeBodegaActionId } from "../constants/jefe-bodega-actions";
import { JefeBodegaActionBar } from "./JefeBodegaActionBar";
import { JefeBodegaActionModals } from "./JefeBodegaActionModals";

function tipoUbicacionFlags(
  tipo: UbicacionEstadoBodegaDbRow["tipo_ubicacion"],
): { es_almacenamiento: boolean; es_picking: boolean } {
  const row = Array.isArray(tipo) ? tipo[0] : tipo;
  return {
    es_almacenamiento: row?.es_almacenamiento === true,
    es_picking: row?.es_picking === true,
  };
}

function filterAlmacenamiento(rows: UbicacionEstadoBodegaDbRow[]) {
  return rows.filter(
    (u) => tipoUbicacionFlags(u.tipo_ubicacion).es_almacenamiento,
  );
}

function filterPicking(rows: UbicacionEstadoBodegaDbRow[]) {
  return rows.filter((u) => tipoUbicacionFlags(u.tipo_ubicacion).es_picking);
}

export function JefeBodegaEstadoPageContent() {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const [activeModal, setActiveModal] = useState<JefeBodegaActionId | null>(
    null,
  );
  const [ubicaciones, setUbicaciones] = useState<UbicacionEstadoBodegaDbRow[]>(
    [],
  );
  const [layoutNonce, setLayoutNonce] = useState(0);

  const loadUbicaciones = useCallback(async () => {
    if (!activeBodegaId) {
      setUbicaciones([]);
      return;
    }
    try {
      const rows = await listUbicacionesEstadoBodega(activeBodegaId);
      setUbicaciones(rows);
    } catch {
      setUbicaciones([]);
    }
  }, [activeBodegaId]);

  useEffect(() => {
    void loadUbicaciones();
  }, [loadUbicaciones, layoutNonce]);

  const almacen = useMemo(() => filterAlmacenamiento(ubicaciones), [ubicaciones]);
  const picking = useMemo(() => filterPicking(ubicaciones), [ubicaciones]);

  const handleOrdenCreated = useCallback(() => {
    setLayoutNonce((n) => n + 1);
  }, []);

  return (
    <>
      <EstadoBodegaPageContent
        key={layoutNonce}
        operacionTabs={
          <JefeBodegaActionBar onActionClick={setActiveModal} />
        }
      />
      <JefeBodegaActionModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        codigoCuenta={codigoCuenta}
        idBodega={activeBodegaId}
        ubicacionesAlmacen={almacen}
        ubicacionesPicking={picking}
        onOrdenCreated={handleOrdenCreated}
      />
      {activeModal === "procesamiento" ? (
        <OrdenProcesamientoCreateModal
          open
          onClose={() => setActiveModal(null)}
          onCreated={handleOrdenCreated}
        />
      ) : null}
    </>
  );
}
