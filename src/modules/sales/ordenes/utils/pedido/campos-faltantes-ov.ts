"use client";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";

import { useCallback } from "react";
import type { CompradorListRow } from "@/modules/admin-panel";
import type { CompradorAltaFicha } from "@/modules/admin-panel/compradores/utils/comprador-alta";
import type { CampoDiscrepancia } from "./map-pedido-extraido-to-form";
import { todayIsoDate } from "../../utils/pedido/build-orden-venta-captura-observaciones";
import { buildOrdenVentaPrefillFromComprador } from "../../utils/pedido/prefill-orden-venta-from-comprador";
import { resolveDireccionDesdeUltimaConfirmada } from "../../utils/pedido/resolve-direccion-ultima-confirmada";

export { useAvisosValidacionOv } from "./avisos-validacion-ov";

export function usePrefillYDiscrepanciasOv(estado: OrdenVentaFormEstado) {
  const { telefono, setFichaComprador, setExigeOc, exigeOc, setMoneda, moneda, setCentroConsumo, centroConsumo, setVentanaDesde, ventanaDesde, setVentanaHasta, ventanaHasta, setDireccion, direccion, setAnden, anden, setContacto, contacto, setTelefono, setCorreo, correo, setAceptaSustituciones, aceptaSustituciones, setRequiereLote, requiereLote, setRegistrarTemperatura, registrarTemperatura, setObservaciones, observaciones, fechaEntrega, setFechaEntrega, setDiscrepancias, setWarnFields, setMissingFields, setAutoFields } = estado;
  const applyCompradorPrefill = useCallback(
    (
      row: CompradorListRow,
      ficha: CompradorAltaFicha,
      options?: {
        /**
         * REQ-069: al cambiar cliente (manual o con docs) no pisar centro,
         * ventana, entrega, etc. si el pedido/OT ya los tiene.
         */
        onlyEmpty?: boolean;
        /** REQ-252: última dirección de OV confirmada de esta razón social. */
        ultimaDireccionConfirmada?: string | null;
      },
    ) => {
      const prefill = buildOrdenVentaPrefillFromComprador({
        ficha,
        telefonoComprador: row.telefono,
      });
      const onlyEmpty = Boolean(options?.onlyEmpty);
      const take = (prev: string, next: string) =>
        onlyEmpty && prev.trim() ? prev : next;
      const direccionPrefill = resolveDireccionDesdeUltimaConfirmada({
        ultimaConfirmada: options?.ultimaDireccionConfirmada,
        fichaDireccion: prefill.direccion,
      });

      setFichaComprador(ficha);
      setExigeOc(prefill.exigeOc);
      setMoneda((prev) => take(prev, prefill.moneda));
      setCentroConsumo((prev) => take(prev, prefill.centroConsumo));
      setVentanaDesde((prev) => take(prev, prefill.ventanaDesde));
      setVentanaHasta((prev) => take(prev, prefill.ventanaHasta));
      setDireccion((prev) => take(prev, direccionPrefill));
      setAnden((prev) => take(prev, prefill.anden));
      setContacto((prev) => take(prev, prefill.contacto));
      setTelefono((prev) => take(prev, prefill.telefono));
      setCorreo((prev) => take(prev, prefill.correo));
      setAceptaSustituciones((prev) => take(prev, prefill.aceptaSustituciones));
      setRequiereLote((prev) => take(prev, prefill.requiereLote));
      setRegistrarTemperatura((prev) =>
        take(prev, prefill.registrarTemperatura),
      );
      setObservaciones((prev) => take(prev, prefill.observaciones));
    },
    [],
  );

  const applyDiscrepanciaFieldValue = useCallback(
    (fieldKey: string, value: string) => {
      const next = value.trim();
      switch (fieldKey) {
        case "fechaEntrega":
          setFechaEntrega(next);
          break;
        case "centroConsumo":
          setCentroConsumo(next);
          break;
        case "direccion":
          setDireccion(next);
          break;
        case "anden":
          setAnden(next);
          break;
        case "contacto":
          setContacto(next);
          break;
        case "telefono":
          setTelefono(next);
          break;
        case "correo":
          setCorreo(next);
          break;
        case "ventanaDesde":
          setVentanaDesde(next);
          break;
        case "ventanaHasta":
          setVentanaHasta(next);
          break;
        case "aceptaSustituciones":
          setAceptaSustituciones(next);
          break;
        case "requiereLote":
          setRequiereLote(next);
          break;
        case "registrarTemperatura":
          setRegistrarTemperatura(next);
          break;
        case "observaciones":
          setObservaciones(next);
          break;
        default:
          break;
      }
    },
    [],
  );

  /**
   * «Usar del catálogo» solo si Mateo no trajo el dato y el catálogo sí lo tiene.
   * Si Mateo ya llenó el pedido, no hace falta el botón (solo aviso informativo).
   * Excepción: fecha atrasada → «Usar hoy».
   */
  const canReemplazarDiscrepancia = useCallback((item: CampoDiscrepancia) => {
    if (item.fieldKey === "potencialDuplicado") return false;
    if (item.fieldKey === "fechaEntrega" && item.db === "Hoy o posterior") {
      return true;
    }
    const fichaVal = item.db?.trim() ?? "";
    if (!fichaVal || fichaVal === "—") return false;
    const pedidoVal = item.ia?.trim() ?? "";
    // Mateo ya escribió algo en el pedido → no ofrecer pisar con ficha.
    if (pedidoVal && pedidoVal !== "—") return false;
    return true;
  }, []);

  /** Aplica ficha (o hoy) al campo del formulario. */
  const handleReemplazarDiscrepancia = useCallback(
    (item: CampoDiscrepancia) => {
      if (!canReemplazarDiscrepancia(item)) return;

      const fichaValue =
        item.fieldKey === "fechaEntrega" && item.db === "Hoy o posterior"
          ? todayIsoDate()
          : item.db === "—"
            ? ""
            : item.db.trim();

      applyDiscrepanciaFieldValue(item.fieldKey, fichaValue);

      setDiscrepancias((prev) =>
        prev.filter((row) => row.fieldKey !== item.fieldKey),
      );
      setWarnFields((prev) => {
        if (!prev.has(item.fieldKey)) return prev;
        const next = new Set(prev);
        next.delete(item.fieldKey);
        return next;
      });
      setMissingFields((prev) => {
        if (!prev.has(item.fieldKey)) return prev;
        const next = new Set(prev);
        next.delete(item.fieldKey);
        return next;
      });
      setAutoFields((prev) => {
        const next = new Set(prev);
        next.add(item.fieldKey);
        return next;
      });
      // No cerrar el diálogo: el usuario ve el ítem desaparecer y decide
      // «Usar valores del pedido» o «Volver a editar». Cerrar al instante hacía parecer que no aplicaba.
    },
    [applyDiscrepanciaFieldValue, canReemplazarDiscrepancia],
  );
  return { applyCompradorPrefill, canReemplazarDiscrepancia, handleReemplazarDiscrepancia };
}

export function useAbrirCapturaOv(estado: OrdenVentaFormEstado) {
  const { setStartMode, setError, ensureFormDataReady, setStep, setIsCompradorCreateOpen, setCompradores, idComprador, handleSelectComprador } = estado;
  const openFormFromScratch = useCallback(() => {
    setStartMode("scratch");
    setError(null);
    void ensureFormDataReady().then((ok) => {
      if (ok) setStep("form");
    });
  }, [ensureFormDataReady]);

  const openFirstTimeFlow = useCallback(() => {
    setStartMode("first_time");
    setError(null);
    setIsCompradorCreateOpen(true);
    // Precarga en background mientras registran al comprador.
    void ensureFormDataReady();
  }, [ensureFormDataReady]);

  const handleCompradorCreatedForSale = useCallback(
    (created: CompradorListRow) => {
      setCompradores((prev) => {
        if (prev.some((row) => row.idComprador === created.idComprador)) {
          return prev;
        }
        return [...prev, created].sort((a, b) =>
          a.comprador.localeCompare(b.comprador, "es"),
        );
      });
      handleSelectComprador(created);
      setStartMode("scratch");
      setError(null);
      setIsCompradorCreateOpen(false);
      void ensureFormDataReady().then((ok) => {
        if (ok) setStep("form");
      });
    },
    [ensureFormDataReady, handleSelectComprador],
  );

  return { openFormFromScratch, openFirstTimeFlow, handleCompradorCreatedForSale };
}
