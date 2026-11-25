"use client";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";

import { useCallback } from "react";
import { crearSnapshotReagrupacion } from "../utils/ot/reagrupar-ordenes-trabajo";
import { origenCorreoDePropuesta, type PropuestaCorreccionCorreoApi } from "../utils/ot/aplicar-correccion-correo";
import { buildPedidoExtraidoFromOrigenCorreo } from "../utils/origen/pedido-from-origen-correo";
import { mapPedidoExtraidoToForm } from "../utils/pedido/map-pedido-extraido-to-form";
import { todayIsoDate, tomorrowIsoDate } from "../utils/pedido/build-orden-venta-captura-observaciones";
import { withNotasGeneralesOnHijas } from "../utils/ot/notas-generales-ot";
import { groupOrigenCorreoToOrdenesTrabajo } from "../utils/origen/origen-correo-ordenes-trabajo";
import { lineaFormDesdeIa } from "../utils/pedido/orden-venta-create-helpers";

export function useAplicarCorreccionCorreoOv(estado: OrdenVentaFormEstado) {
  const { correo, syncActiveOtFromForm, lineas, origenTexto, observaciones, productos, centroConsumo, ventanaDesde, ventanaHasta, direccion, anden, contacto, telefono, aceptaSustituciones, requiereLote, registrarTemperatura, applyOrdenesTrabajo, setLineas, setFormOtPage, setReagruparAplicada, setReagruparOpen, setError, isEditing, pendingEmitId, pendingDraftSaveAfterReorgRef, showToast } = estado;
  /**
   * REQ-187: aplica como BORRADOR la corrección propuesta tras releer el correo y los
   * archivos de la OV. Reemplaza las OT y las líneas del formulario con la misma
   * interpretación que al abrir una OV externa (renglones → líneas con producto de
   * catálogo); lo que no se reconoce queda marcado para elegir. No escribe en BD.
   */
  const handleAplicarCorreccionCorreo = useCallback(
    (propuesta: PropuestaCorreccionCorreoApi) => {
      const hijasActuales = syncActiveOtFromForm();
      const snapshot = crearSnapshotReagrupacion(hijasActuales, lineas);
      const filas = origenCorreoDePropuesta(propuesta);

      const pedido = buildPedidoExtraidoFromOrigenCorreo({
        origenCorreo: filas,
        origenTexto,
        notasAlmacen: observaciones,
      });
      // El servidor ya fijó la OC de cada documento: la clave de cada línea debe ser
      // exactamente la de su renglón para que caiga en su OT (pedido + almacén).
      pedido.lineas = pedido.lineas.map((linea, indice) => ({
        ...linea,
        numeroPedido: filas[indice]?.["Numero pedido"]?.toString().trim() || null,
      }));

      const mapped = mapPedidoExtraidoToForm({
        pedido,
        productos,
        ficha: {
          centroConsumo,
          ventanaDesde,
          ventanaHasta,
          direccion,
          anden,
          contacto,
          telefono,
          correo,
          aceptaSustituciones,
          requiereLote,
          registrarTemperatura,
          observaciones,
        },
        tomorrowIso: tomorrowIsoDate(),
        todayIso: todayIsoDate(),
      });

      // REQ-141: el origen no debe reinyectar notas que el usuario ya borró de la OV.
      const hijas = withNotasGeneralesOnHijas(
        groupOrigenCorreoToOrdenesTrabajo(filas),
        observaciones,
      );
      if (hijas.length === 0 || mapped.lineas.length === 0) {
        throw new Error("La corrección no trae renglones.");
      }

      applyOrdenesTrabajo(hijas);
      setLineas(mapped.lineas.map(lineaFormDesdeIa));
      setFormOtPage(0);
      setReagruparAplicada({
        snapshot,
        instruccion: "Corrección contra el correo",
        resumen: {
          antes: propuesta.resumen.otAntes,
          despues: propuesta.resumen.otDespues,
          nuevas: propuesta.diff.otNuevas.length,
          vacias: propuesta.diff.otEliminadas.length,
        },
        movimientos: [],
        otNuevas: [],
        correccion: {
          resumen: propuesta.resumen,
          documentos: propuesta.documentos,
        },
      });
      setReagruparOpen(false);
      setError(null);
      // REQ-195: persistir corrección en OV existente.
      if (isEditing || pendingEmitId) {
        pendingDraftSaveAfterReorgRef.current = true;
      }
      showToast({
        title: "Órdenes de trabajo corregidas con el correo",
        content:
          isEditing || pendingEmitId
            ? "Guardando el avance. Revisa productos marcados si quedan pendientes."
            : "El cambio quedó como borrador. Revisa los productos marcados, guarda el pedido para conservarlo o pulsa Deshacer.",
        variant: "success",
        durationMs: 6000,
      });
    },
    [
      aceptaSustituciones,
      anden,
      applyOrdenesTrabajo,
      centroConsumo,
      contacto,
      correo,
      direccion,
      isEditing,
      lineas,
      observaciones,
      origenTexto,
      pendingEmitId,
      productos,
      registrarTemperatura,
      requiereLote,
      showToast,
      syncActiveOtFromForm,
      telefono,
      ventanaDesde,
      ventanaHasta, pendingDraftSaveAfterReorgRef, setError, setFormOtPage, setLineas, setReagruparAplicada, setReagruparOpen,
    ],
  );
  return { handleAplicarCorreccionCorreo };
}


import { useRevisionPendienteOv } from "./aplicar-correccion-correo-ov-revision";

export { useRevisionPendienteOv };

export function useDeshacerReagrupacionOv(estado: OrdenVentaFormEstado) {
  const { reagruparAplicada, applyOrdenesTrabajo, setLineas, setReagruparAplicada, setError } = estado;
  const handleDeshacerReagrupacion = useCallback(() => {
    if (!reagruparAplicada) return;
    applyOrdenesTrabajo(reagruparAplicada.snapshot.hijas);
    setLineas(reagruparAplicada.snapshot.lineas);
    setReagruparAplicada(null);
    setError(null);
  }, [applyOrdenesTrabajo, reagruparAplicada, setError, setLineas, setReagruparAplicada]);
  return { handleDeshacerReagrupacion };
}
