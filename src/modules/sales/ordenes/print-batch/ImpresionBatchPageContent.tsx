"use client";

import { useCallback, useMemo, useState } from "react";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { cn } from "@/lib/utils/cn";
import { useAdminMaestroScope } from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import { useCuentaZonaHoraria } from "@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria";
import { getImpresoraActivaCuenta } from "@/modules/configurator/impresoras/services/impresoras.service";
import { listOrdenesVentaOperador } from "../../shared/services/sales.service";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import {
  buildOrdenTareaAlmacenLandscapePdfBlob,
  printOrdenTareaAlmacenLandscape,
} from "../print/download-orden-tarea-almacen-pdf";
import { MENSAJE_VERSION_NUEVA, esErrorDeVersionVieja } from "../print/print-correo-fallo";
import { printQueueUserMessage } from "../print/print-queue-status";
import {
  alternarOt,
  alternarOv,
  clientesDeOv,
  contarSeleccion,
  estadoSeleccionOv,
  FILTROS_BATCH_INICIALES,
  filtrarOvBatch,
  ordenarOvPorEntrega,
  puedeImprimirEnBatch,
  quitarGrupo,
  resumenSeleccion,
  seleccionarGrupo,
  type FiltrosBatch,
  type SeleccionBatch,
} from "./batch-seleccion";
import { cargarCentrosConsumo, cargarHojasBatch } from "./cargar-hojas-batch";
import { ImpresionBatchBarra } from "./ImpresionBatchBarra";
import { ImpresionBatchConfirmacion } from "./ImpresionBatchConfirmacion";
import { ImpresionBatchFiltros, filtrosActivos } from "./ImpresionBatchFiltros";
import { ImpresionBatchLista } from "./ImpresionBatchLista";
import { ImpresionBatchMensaje, type TipoMensajeBatch } from "./ImpresionBatchMensaje";
import { ImpresionBatchVistaPrevia } from "./ImpresionBatchVistaPrevia";
import { registrarImpresionBatch } from "./registrar-impresion-batch";
import {
  horaEnCuenta,
  nombreArchivoBatch,
  ordenDeImpresion,
  type PreviaBatch,
} from "./utilidades-batch";

/** El módulo ya mide el alto de la ventana (`fitViewport`): el área de trabajo toma lo que sobra. */
const AREA_FIJA = "min-h-0 lg:flex-1";

interface Aviso {
  tipo: TipoMensajeBatch;
  title: string;
  detail: string;
}

export function ImpresionBatchPageContent() {
  const { codigoCuenta, runScoped } = useAdminMaestroScope();
  const zonaHoraria = useCuentaZonaHoraria(codigoCuenta);
  const [filtros, setFiltros] = useState<FiltrosBatch>(FILTROS_BATCH_INICIALES);
  const [seleccion, setSeleccion] = useState<SeleccionBatch>(new Map());
  const [progreso, setProgreso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [previa, setPrevia] = useState<PreviaBatch | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [impresora, setImpresora] = useState<string | null>(null);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const fetchOrdenes = useCallback(async (): Promise<OrdenVentaOperadorRow[]> => {
    if (!codigoCuenta) return [];
    const rows = await runScoped(() => listOrdenesVentaOperador({ codigoCuenta }));
    return rows.filter((row) => puedeImprimirEnBatch(row.estado));
  }, [codigoCuenta, runScoped]);
  const { data, isLoading, error: errorLista, reload } = useAsyncQuery(
    fetchOrdenes,
    Boolean(codigoCuenta),
  );

  const rows = useMemo(() => data ?? [], [data]);
  const clientes = useMemo(() => clientesDeOv(rows), [rows]);
  const visibles = useMemo(
    () => ordenarOvPorEntrega(filtrarOvBatch(rows, filtros)),
    [rows, filtros],
  );
  const resumen = useMemo(() => resumenSeleccion(seleccion, rows), [seleccion, rows]);
  const totales = contarSeleccion(resumen);

  // Cualquier cambio del operador deja atrás los avisos de la acción anterior.
  const cambiarFiltros = (siguientes: FiltrosBatch) => {
    setFiltros(siguientes);
    setError(null);
  };
  const cambiarSeleccion = (cambio: (actual: SeleccionBatch) => SeleccionBatch) => {
    setSeleccion(cambio);
    setError(null);
    setAviso(null);
  };

  const cargarCentros = useCallback(
    (row: OrdenVentaOperadorRow) =>
      cargarCentrosConsumo({ codigoCuenta: codigoCuenta ?? "", row, zonaHoraria, runScoped }),
    [codigoCuenta, zonaHoraria, runScoped],
  );

  const aceptar = async () => {
    if (!codigoCuenta || resumen.length === 0) return;
    setCargando(true);
    setError(null);
    setAviso(null);
    try {
      const hojas = await cargarHojasBatch({
        codigoCuenta,
        resumen,
        zonaHoraria,
        runScoped,
        onProgreso: (leidas, total) => setProgreso(`Leyendo OV ${leidas} de ${total}…`),
      });
      if (hojas.length === 0) throw new Error("No hay hojas para las OT elegidas.");
      const { blob } = await buildOrdenTareaAlmacenLandscapePdfBlob(hojas, { codigoCuenta });
      setPrevia({ blob, hojas, resumen, nombreArchivo: nombreArchivoBatch() });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo armar la vista previa.");
    } finally {
      setCargando(false);
      setProgreso(null);
    }
  };

  const pedirConfirmacion = () => {
    setConfirmando(true);
    if (!codigoCuenta) return;
    void getImpresoraActivaCuenta(codigoCuenta).then(
      (destino) => setImpresora(destino?.nombre?.trim() || null),
      () => setImpresora(null),
    );
  };

  const imprimir = async () => {
    if (!previa || !codigoCuenta) return;
    setImprimiendo(true);
    try {
      const enviado = await printOrdenTareaAlmacenLandscape(previa.hojas, { codigoCuenta });
      registrarImpresionBatch({ previa, codigoCuenta, enviado });
      const mensaje = printQueueUserMessage({
        outcome: enviado.queue,
        impresora: enviado.impresora,
        codigo: `${previa.resumen.length} OV`,
        hojas: previa.hojas.length,
      });
      setAviso({
        // Solo es «todo bien» si la cola lo confirma; si quedó en espera, se avisa en ámbar.
        tipo: enviado.queue.kind === "printing" || enviado.queue.kind === "unknown" ? "ok" : "aviso",
        title: mensaje.title,
        detail: `${mensaje.detail} Enviado a las ${horaEnCuenta(zonaHoraria)}.`,
      });
      setSeleccion(new Map());
      setPrevia(null);
    } catch (e: unknown) {
      // Falla el envío: se queda en la vista previa con la selección intacta para reintentar.
      setError(
        esErrorDeVersionVieja(e)
          ? MENSAJE_VERSION_NUEVA
          : e instanceof Error
            ? e.message
            : "No se pudo enviar a la impresora.",
      );
    } finally {
      setConfirmando(false);
      setImprimiendo(false);
    }
  };

  return (
    <OperationalModuleShell title="Impresión en batch" gate={{ roles: ROLES_NIVEL_CUENTA }} fitViewport compactoEnPantallaBaja>
      {previa ? (
        <div className={cn("flex flex-col gap-4 [@media(max-height:50rem)]:gap-2", AREA_FIJA)}>
          {error ? <ImpresionBatchMensaje tipo="error">{error}</ImpresionBatchMensaje> : null}
          <ImpresionBatchVistaPrevia
            blob={previa.blob}
            hojas={previa.hojas.length}
            ot={contarSeleccion(previa.resumen).ot}
            ov={previa.resumen.length}
            imprimiendo={imprimiendo}
            nombreArchivo={previa.nombreArchivo}
            onVolver={() => {
              setPrevia(null);
              setError(null);
            }}
            onImprimir={pedirConfirmacion}
          />
        </div>
      ) : (
        <div className={cn("flex flex-col gap-4 [@media(max-height:50rem)]:gap-2", AREA_FIJA)}>
          {aviso ? (
            <ImpresionBatchMensaje tipo={aviso.tipo}>
              <strong className="font-semibold">{aviso.title}</strong> {aviso.detail}
            </ImpresionBatchMensaje>
          ) : null}
          {error ? <ImpresionBatchMensaje tipo="error">{error}</ImpresionBatchMensaje> : null}
          <ImpresionBatchFiltros filtros={filtros} clientes={clientes} onChange={cambiarFiltros} />
          <div
            aria-busy={cargando}
            inert={cargando}
            className={cn(
              "polaria-scrollbar min-h-[16rem] flex-1 overflow-y-auto rounded-2xl border border-polaria-w-08 transition-opacity motion-reduce:transition-none lg:min-h-0",
              cargando && "opacity-60",
            )}
          >
            {isLoading ? (
              <p role="status" className="polaria-text-body py-10 text-center text-polaria-w">
                Cargando órdenes de venta…
              </p>
            ) : errorLista && rows.length === 0 ? (
              <div role="alert" className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                <p className="polaria-text-body text-polaria-danger">{errorLista}</p>
                <button
                  type="button"
                  onClick={() => void reload()}
                  className="inline-flex min-h-11 items-center rounded-xl border border-polaria-w-20 px-4 text-sm font-semibold text-polaria-w transition hover:border-polaria-teal hover:text-polaria-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal"
                >
                  Reintentar
                </button>
              </div>
            ) : visibles.length === 0 ? (
              <p className="polaria-text-body py-10 text-center text-polaria-w">
                {filtrosActivos(filtros)
                  ? "Ninguna orden de venta coincide con estos filtros."
                  : "No hay órdenes de venta confirmadas o en alistamiento para imprimir."}
              </p>
            ) : (
              <ImpresionBatchLista
                rows={visibles}
                seleccion={seleccion}
                onAlternarOv={(row) => cambiarSeleccion((s) => alternarOv(s, row))}
                onAlternarOt={(row, ot) => cambiarSeleccion((s) => alternarOt(s, row, ot))}
                cargarCentros={cargarCentros}
              />
            )}
          </div>
          <ImpresionBatchBarra
            elegidasOv={totales.ov}
            elegidasOt={totales.ot}
            visibles={visibles.length}
            puedeMarcarVisibles={visibles.some((r) => estadoSeleccionOv(seleccion, r) !== "todas")}
            hayElegidasVisibles={visibles.some((r) => estadoSeleccionOv(seleccion, r) !== "ninguna")}
            cargando={cargando}
            progreso={progreso}
            onMarcarVisibles={() => cambiarSeleccion((s) => seleccionarGrupo(s, visibles))}
            onQuitarVisibles={() => cambiarSeleccion((s) => quitarGrupo(s, visibles))}
            onLimpiar={() => cambiarSeleccion(() => new Map())}
            onAceptar={() => void aceptar()}
          />
        </div>
      )}

      <ImpresionBatchConfirmacion
        open={confirmando && Boolean(previa)}
        hojas={previa?.hojas.length ?? 0}
        orden={previa ? ordenDeImpresion(previa) : []}
        impresora={impresora}
        imprimiendo={imprimiendo}
        onClose={() => setConfirmando(false)}
        onConfirm={() => void imprimir()}
      />
    </OperationalModuleShell>
  );
}
