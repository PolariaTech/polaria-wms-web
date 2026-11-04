import { DomainServiceError } from "@/lib/utils/domain-service-error";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { emitirOrdenVentaApi } from "../../shared/services/sales-api.service";
import {
  createOrdenVenta,
  getOrdenVentaDetalle,
  updateOrdenVenta,
} from "../../shared/services/sales.service";
import {
  postOrdenVentaLog,
  postOrdenVentaLogForOts,
} from "../services/orden-venta-log.client";
import { describirReagrupacionParaBitacora } from "../utils/ot/reagrupar-ordenes-trabajo";
import { describirCorreccionParaBitacora } from "../utils/ot/aplicar-correccion-correo";
import {
  autoPrintOrdenVentaTrasEmitir,
  fetchAutoImprimirFlag,
} from "../print/auto-print-ov-tras-emitir";

export async function ejecutarPersistenciaEnvio(input: OrdenVentaFormEstado) {
  const { onOrdenIdReady, isDraft, codigoCuenta, hasProductos, step, isEditing, pendingEmitId, idComprador, setError, showToast, startMode, avisosCatalogoValidacion, skipDiscrepanciaConfirmRef, setConfirmDiscrepanciasOpen, exigeOc, ordenCompraHotel, syncActiveOtFromForm, ordenesTrabajoForm, applyOrdenesTrabajo, lineas, fechaEntrega, origenCorreoDraft, setFechaEntrega, setMissingFields, ventanaDesde, ventanaHasta, formScrollRef, bodegasDestino, idBodegaDestino, skipSaveConfirmRef, setConfirmSaveOpen, setIsSaving, setMateoBusyMessage, origenTexto, origenAdjuntos, origenArchivoFiles, setOrigenAdjuntos, compradorNombreIa, compradorLabel, prioridad, moneda, centroConsumo, vendedorNombre, direccion, anden, contacto, telefono, correo, turno, horaSalida, chofer, unidad, aceptaSustituciones, requiereLote, registrarTemperatura, observaciones, idCreador, editingId, editingEstado, session, setPendingEmitId, setEditingEstado, reagruparAplicada, setReagruparAplicada, folioFactura, onEmitSuccess, onAutoPrintResult, onCreated, onClose } = input;
  const { payload, fechaEntregaPersist } = input;
let idOrdenVenta = isEditing ? editingId : pendingEmitId;
      // Solo el botón principal (no el icono de avance) puede pasar a Confirmada.
      const shouldEmit =
        !isDraft && (!isEditing || editingEstado === "por_confirmar");
      let listRowForPrint: OrdenVentaOperadorRow | null = null;

      try {
        const autorLog =
          session?.nombre?.trim() ||
          payload.vendedor?.trim() ||
          "usuario";
        const otIds = ordenesTrabajoForm.map((ot: { id: string }) => ot.id);
        const otCount = otIds.length;

        if (isEditing && editingId) {
          listRowForPrint = await updateOrdenVenta({
            ...payload,
            idOrdenVenta: editingId,
          });
          idOrdenVenta = editingId;
          if (editingEstado === "por_confirmar") {
            setPendingEmitId(editingId);
          }
          void postOrdenVentaLogForOts({
            idOrdenVenta: editingId,
            codigoCuenta,
            accion: "actualizacion",
            mensaje: isDraft
              ? `Avance del pedido guardado por ${autorLog}.`
              : `Orden de trabajo editada por ${autorLog}.`,
            idUsuario: idCreador || null,
            autorNombre: session?.nombre ?? null,
            idBodega: payload.idBodega ?? null,
            idOrdenesTrabajo: otIds,
          });
        } else if (pendingEmitId) {
          listRowForPrint = await updateOrdenVenta({
            ...payload,
            idOrdenVenta: pendingEmitId,
          });
          idOrdenVenta = pendingEmitId;
          setEditingEstado("por_confirmar");
          void postOrdenVentaLogForOts({
            idOrdenVenta: pendingEmitId,
            codigoCuenta,
            accion: "actualizacion",
            mensaje: isDraft
              ? `Avance del pedido guardado por ${autorLog}.`
              : `Orden de trabajo editada por ${autorLog}.`,
            idUsuario: idCreador || null,
            autorNombre: session?.nombre ?? null,
            idBodega: payload.idBodega ?? null,
            idOrdenesTrabajo: otIds,
          });
        } else if (!idOrdenVenta) {
          listRowForPrint = await createOrdenVenta(payload);
          idOrdenVenta = listRowForPrint.idOrdenVenta;
          setPendingEmitId(idOrdenVenta);
          // REQ-199: el listado fija editingId y puede abrir Cypher con este id.
          onOrdenIdReady?.(idOrdenVenta);
          setEditingEstado("por_confirmar");
          void postOrdenVentaLogForOts({
            idOrdenVenta,
            codigoCuenta,
            accion: "creacion",
            mensaje: isDraft
              ? `Avance del pedido guardado por ${autorLog}.`
              : otCount > 1
                ? `Esta orden de trabajo fue creada por ${autorLog} (${otCount} órdenes de trabajo).`
                : `Esta orden de trabajo fue creada por ${autorLog}.`,
            idUsuario: idCreador || null,
            autorNombre: session?.nombre || payload.vendedor || null,
            idBodega: payload.idBodega ?? null,
            idOrdenesTrabajo: otIds,
            payloadExtra: otCount > 0 ? { ordenesTrabajo: otCount } : undefined,
          });
        }

        if (idOrdenVenta && codigoCuenta) {
          await folioFactura.guardar(idOrdenVenta, codigoCuenta);
        }

        if (reagruparAplicada && idOrdenVenta) {
          const detalle = reagruparAplicada.correccion
            ? describirCorreccionParaBitacora({
                autor: autorLog,
                resumen: reagruparAplicada.correccion.resumen,
                documentos: reagruparAplicada.correccion.documentos,
              })
            : describirReagrupacionParaBitacora({
                autor: autorLog,
                instruccion: reagruparAplicada.instruccion,
                resumen: reagruparAplicada.resumen,
                movimientos: reagruparAplicada.movimientos,
                otNuevas: reagruparAplicada.otNuevas,
              });
          // Evento a nivel de OV (sin OT): se ve al filtrar por cualquier OT.
          void postOrdenVentaLog({
            idOrdenVenta,
            codigoCuenta,
            accion: "actualizacion",
            mensaje: detalle.mensaje,
            idUsuario: idCreador || null,
            autorNombre: session?.nombre ?? null,
            idBodega: payload.idBodega ?? null,
            idOrdenTrabajo: null,
            payloadExtra: detalle.payloadExtra,
          });
          setReagruparAplicada(null);
        }

        if (shouldEmit && !isDraft) {
          if (!idOrdenVenta) {
            throw new DomainServiceError(
              "La orden de venta no es válida.",
              "INVALID_ARGUMENT",
            );
          }

          let codigoEmitida = "";
          try {
            listRowForPrint = await emitirOrdenVentaApi(idOrdenVenta);
            codigoEmitida = listRowForPrint.venta?.trim() || "";
            // Bitácora de emisión: la escribe el API (por OT) al confirmar.
          } catch (emitErr: unknown) {
            // Si el pedido ya salió a bodega en un intento previo, no bloquear.
            const emitMessage =
              emitErr instanceof DomainServiceError ? emitErr.message : "";
            const maybeAlreadyEmitted =
              emitMessage.includes("por confirmar") ||
              emitMessage.includes("por_confirmar") ||
              emitMessage.includes("estado");

            if (!maybeAlreadyEmitted || !codigoCuenta) {
              throw emitErr;
            }

            const detalleEmit = await getOrdenVentaDetalle({
              codigoCuenta,
              idOrdenVenta,
            });
            if (detalleEmit.estado === "por_confirmar") {
              throw emitErr;
            }
            codigoEmitida =
              detalleEmit.codigo?.trim() || codigoEmitida;
          }

          onEmitSuccess?.({
            idOrdenVenta,
            codigo:
              listRowForPrint?.venta?.trim() ||
              codigoEmitida ||
              "OV",
          });

          // Autoimpresión: flag por API (service role); feedback visible al fallar.
          if (codigoCuenta) {
            let shouldAutoPrint = false;
            try {
              shouldAutoPrint = await fetchAutoImprimirFlag(codigoCuenta);
            } catch (flagErr) {
              console.error(
                "[ov] no se pudo leer autoimprimir:",
                flagErr instanceof Error ? flagErr.message : flagErr,
              );
              onAutoPrintResult?.({
                status: "error",
                message:
                  flagErr instanceof Error
                    ? flagErr.message
                    : "No se pudo leer la configuración de autoimpresión.",
              });
            }
            if (shouldAutoPrint) {
              setMateoBusyMessage("Imprimiendo…");
              const autoPrintResult = await autoPrintOrdenVentaTrasEmitir({
                codigoCuenta,
                idOrdenVenta: idOrdenVenta!,
                listRowFallback: listRowForPrint,
                autorNombre: session?.nombre ?? autorLog,
                idUsuario: idCreador || null,
                autoImprimirKnown: true,
              });
              if (autoPrintResult.status !== "skipped") {
                onAutoPrintResult?.(autoPrintResult);
              }
            }
          }
        }

        if (isDraft) {
          if (!fechaEntrega.trim() && fechaEntregaPersist) {
            setFechaEntrega(fechaEntregaPersist);
          }
          showToast({
            title: "Avance guardado",
            content:
              "El pedido sigue Por confirmar. Puedes seguir editando aquí; cierra cuando quieras.",
            variant: "success",
            durationMs: 4500,
          });
          onCreated();
          // REQ-182: el ícono de avance no cierra el modal; sale Cancelar/X.
        } else {
          setPendingEmitId(null);
          onCreated();
          onClose(); // REQ-182: solo confirmar cierra; draft ya retornó arriba
        }
      } catch (err: unknown) {
        // REQ-195: mensaje concreto + toast fijo (el alert del scroll se pierde tras Mateo).
        const message =
          err instanceof DomainServiceError
            ? err.message
            : err instanceof Error && err.message.trim()
              ? err.message.trim()
              : isDraft
                ? "No se pudo guardar el avance."
                : isEditing && editingEstado !== "por_confirmar"
                  ? "No se pudieron guardar los cambios."
                  : idOrdenVenta
                    ? "No se pudo enviar el pedido a la bodega destino."
                    : "No se pudo crear la orden de venta.";
        setError(message);
        showToast({
          title: isDraft ? "No se guardó el avance" : "No se pudo confirmar",
          content: message,
          variant: "error",
          durationMs: 7000,
        });
      } finally {
        setIsSaving(false);
        setMateoBusyMessage(undefined);
      }
}
