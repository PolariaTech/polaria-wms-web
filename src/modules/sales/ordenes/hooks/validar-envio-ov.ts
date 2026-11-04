import { isFechaEntregaIsoValida, validatePedidoCabecera } from "../utils/pedido/pedido-form-validation";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { parseFechaOrigen, resolveFechaEntregaDesdeOrigen } from "../utils/origen/materialize-ov-desde-origen";
import { todayIsoDate, tomorrowIsoDate } from "../utils/pedido/build-orden-venta-captura-observaciones";
import { parseLineasParaEnvio } from "../utils/pedido/payload-envio-ov";

export function validarEnvioOv(input: OrdenVentaFormEstado) {
  const { isDraft, codigoCuenta, hasProductos, step, isEditing, pendingEmitId, idComprador, setError, showToast, startMode, avisosCatalogoValidacion, skipDiscrepanciaConfirmRef, setConfirmDiscrepanciasOpen, exigeOc, ordenCompraHotel, syncActiveOtFromForm, ordenesTrabajoForm, applyOrdenesTrabajo, lineas, fechaEntrega, origenCorreoDraft, setFechaEntrega, setMissingFields, ventanaDesde, ventanaHasta, formScrollRef, bodegasDestino, idBodegaDestino, skipSaveConfirmRef, setConfirmSaveOpen, setIsSaving, setMateoBusyMessage, origenTexto, origenAdjuntos, origenArchivoFiles, setOrigenAdjuntos, compradorNombreIa, compradorLabel, prioridad, moneda, centroConsumo, vendedorNombre, direccion, anden, contacto, telefono, correo, turno, horaSalida, chofer, unidad, aceptaSustituciones, requiereLote, registrarTemperatura, observaciones, idCreador, editingId, editingEstado, session, setPendingEmitId, setEditingEstado, reagruparAplicada, setReagruparAplicada, folioFactura, onEmitSuccess, onAutoPrintResult, onCreated, onClose } = input;
      if (!codigoCuenta || !hasProductos || step !== "form") {
        return null;
      }

      const puedeGuardarSinCliente =
        isDraft && (isEditing || Boolean(pendingEmitId));

      if (!idComprador && !puedeGuardarSinCliente) {
        const msg = "Selecciona un cliente.";
        setError(msg);
        if (!isDraft) {
          showToast({
            title: "No se pudo confirmar",
            content: msg,
            variant: "error",
            durationMs: 5000,
          });
        }
        return null;
      }

      if (
        !isDraft &&
        startMode === "docs" &&
        avisosCatalogoValidacion.length > 0 &&
        !skipDiscrepanciaConfirmRef.current
      ) {
        setConfirmDiscrepanciasOpen(true);
        return null;
      }
      skipDiscrepanciaConfirmRef.current = false;

      if (!isDraft && exigeOc && !ordenCompraHotel.trim()) {
        setError(
          "Este cliente exige orden de compra para facturar. Captúrala en el pedido.",
        );
        return null;
      }

      // Persistir cambios de la OT actual aunque no hayas recorrido las demás.
      // REQ-141: también con 1 OT (borrar notas debe llegar al origen).
      const hijasSynced = syncActiveOtFromForm();
      if (hijasSynced !== ordenesTrabajoForm) {
        applyOrdenesTrabajo(hijasSynced);
      }

      // REQ-166: en avance solo se mandan a BD líneas ya de catálogo; las pendientes
      // viven en origen_correo (abajo) para no perder el progreso al reabrir.
      const lineasParaPersistir = isDraft
        ? lineas.filter((linea: { catalogPending?: boolean; idProducto?: string }) => !linea.catalogPending && linea.idProducto)
        : lineas;

      if (
        !isDraft &&
        lineas.some((linea: { catalogPending?: boolean; idProducto?: string }) => linea.catalogPending || !linea.idProducto)
      ) {
        const msg =
          "Hay productos no identificados. Elige uno del catálogo o quita la línea.";
        setError(msg);
        showToast({
          title: "No se pudo confirmar",
          content: msg,
          variant: "error",
          durationMs: 6000,
        });
        return null;
      }

      // REQ-134/166: avance en OV existente puede ir sin líneas de catálogo
      // (cabecera + origen con pendientes de Mateo).
      const puedeAvanceSinLineas =
        isDraft && (isEditing || Boolean(pendingEmitId));

      if (lineasParaPersistir.length === 0 && !puedeAvanceSinLineas) {
        setError(
          isDraft
            ? "Identifica al menos un producto del catálogo para guardar el avance."
            : "Agrega al menos un producto a la venta.",
        );
        return null;
      }

      let fechaEntregaPersist = isFechaEntregaIsoValida(fechaEntrega)
        ? fechaEntrega.trim()
        : parseFechaOrigen(fechaEntrega) ?? "";

      // REQ-110: si el campo se ve vacío pero el adjunto trae fecha, mostrarla (no confirmar a ciegas).
      if (!fechaEntregaPersist) {
        const desdeOrigen = resolveFechaEntregaDesdeOrigen({
          origenCorreo: origenCorreoDraft,
          hijas: ordenesTrabajoForm,
        });
        if (desdeOrigen) {
          fechaEntregaPersist = desdeOrigen;
          setFechaEntrega(desdeOrigen);
          setMissingFields((prev: Set<string>) => {
            const next = new Set(prev);
            next.delete("fechaEntrega");
            return next;
          });
          if (!isDraft) {
            setError(
              "Se tomó la fecha de entrega del pedido/adjuntos. Revísala y vuelve a confirmar.",
            );
            return null;
          }
        }
      }

      if (!isDraft) {
        const cabeceraError = validatePedidoCabecera({
          fechaEntrega: fechaEntregaPersist,
          todayIso: todayIsoDate(),
          ventanaDesde,
          ventanaHasta,
        });
        if (cabeceraError) {
          setMissingFields((prev: Set<string>) => {
            const next = new Set(prev);
            for (const field of cabeceraError.fields) next.add(field);
            return next;
          });
          setError(cabeceraError.message);
          if (cabeceraError.fields.includes("fechaEntrega")) {
            const el = (formScrollRef.current as { querySelector?: (selector: string) => HTMLElement | null } | null)?.querySelector?.(
              '[data-ov-revision="fechaEntrega"]',
            );
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return null;
        }
      } else if (!fechaEntregaPersist.trim()) {
        fechaEntregaPersist = tomorrowIsoDate();
      }

      const bodegaDestinoLabel =
        bodegasDestino.find((row: { idBodega: string; label?: string }) => row.idBodega === idBodegaDestino)?.label ??
        "";

      const parsedLineas = parseLineasParaEnvio({
        lineas: lineasParaPersistir,
        isDraft,
      });
      if (!parsedLineas.ok) {
        setError(parsedLineas.error);
        return null;
      }
      const lineasParsed = parsedLineas.lineas;

if (lineasParsed.length === 0 && !puedeAvanceSinLineas) {
        setError(
          isDraft
            ? "Identifica al menos un producto con cantidad y precio para guardar el avance."
            : "Agrega al menos un producto a la venta.",
        );
        return null;
      }

      if (!isDraft && !skipSaveConfirmRef.current) {
        setConfirmSaveOpen(true);
        return null;
      }
      skipSaveConfirmRef.current = false;
  return {
    hijasSynced,
    lineasParaPersistir,
    fechaEntregaPersist,
    bodegaDestinoLabel,
    lineasParsed,
  };
}
