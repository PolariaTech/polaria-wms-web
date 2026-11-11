"use client";

import { useCallback, useMemo, useState } from "react";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { cn } from "@/lib/utils/cn";
import { useAdminMaestroScope } from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import { useCuentaZonaHoraria } from "@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria";
import { listOrdenesVentaOperador } from "../../shared/services/sales.service";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
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
import { armarPreviaDetallada } from "./armar-previa-detallada";
import { cargarCentrosConsumo, cargarHojasBatch } from "./cargar-hojas-batch";
import { esperaEntrePartes, partesDe } from "./enviar-paquete";
import { ImpresionBatchBarra } from "./ImpresionBatchBarra";
import { ImpresionBatchConfirmacion } from "./ImpresionBatchConfirmacion";
import { ImpresionBatchFiltroImpresion } from "./ImpresionBatchFiltroImpresion";
import { ImpresionBatchFiltros, filtrosActivos } from "./ImpresionBatchFiltros";
import { ImpresionBatchLista } from "./ImpresionBatchLista";
import { ImpresionBatchMensaje } from "./ImpresionBatchMensaje";
import { ImpresionBatchVistaPrevia } from "./ImpresionBatchVistaPrevia";
import { ImpresionRapidaAvisoOc } from "./ImpresionRapidaAvisoOc";
import { ImpresionRapidaConfirmacion } from "./ImpresionRapidaConfirmacion";
import {
  ImpresionRapidaTipos,
  TIPOS_RAPIDA_INICIALES,
  type TipoDocumentoRapida,
} from "./ImpresionRapidaTipos";
import { hojasPorEnviar } from "./partir-paquete";
import { useEnvioPaquete, type AvisoEnvio } from "./usar-envio-paquete";
import { useYaImpresas } from "./usar-ya-impresas";
import {
  hojasDelPaquete,
  ordenDeImpresion,
  paginasDelResumen,
  type PreviaBatch,
} from "./utilidades-batch";

/** El módulo ya mide el alto de la ventana (`fitViewport`): el área de trabajo toma lo que sobra. */
const AREA_FIJA = "min-h-0 lg:flex-1";

/** Qué dice la vista previa de sí misma: con OC cada OV lleva detrás las suyas; con varios envíos solo se ve el primero. */
function descripcionDeLaVista(previa: PreviaBatch): string {
  const partes = previa.partes ?? [];
  if (!partes.some((parte) => parte.pdf)) return "ordenadas por fecha y hora de entrega";
  const base = "ordenadas por fecha y hora de entrega; cada OV con sus órdenes de compra detrás y el resumen en la primera hoja";
  return partes.length > 1 ? `${base} (vista previa del envío 1 de ${partes.length})` : base;
}

export function ImpresionBatchPageContent() {
  const { codigoCuenta, runScoped } = useAdminMaestroScope();
  const zonaHoraria = useCuentaZonaHoraria(codigoCuenta);
  const [filtros, setFiltros] = useState<FiltrosBatch>(FILTROS_BATCH_INICIALES);
  const [seleccion, setSeleccion] = useState<SeleccionBatch>(new Map());
  const [tipos, setTipos] = useState<ReadonlySet<TipoDocumentoRapida>>(TIPOS_RAPIDA_INICIALES);
  const [progreso, setProgreso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [previa, setPrevia] = useState<PreviaBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<AvisoEnvio | null>(null);
  const {
    confirmando, setConfirmando, impresora, modoEnvio, imprimiendo, progresoEnvio,
    siguienteParte, reiniciarPartes, pedirConfirmacion, imprimir: enviar,
  } = useEnvioPaquete({ codigoCuenta, zonaHoraria });

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
  // El registro de impresiones solo se lee cuando el operador filtra por «sin imprimir» o «ya impresas».
  const yaImpresas = useYaImpresas({ codigoCuenta, rows, runScoped, activo: filtros.impresion !== "todas" });
  const visibles = useMemo(
    () => ordenarOvPorEntrega(filtrarOvBatch(rows, filtros, yaImpresas.ids ?? undefined)),
    [rows, filtros, yaImpresas.ids],
  );
  const conteos = useMemo(() => {
    const ids = yaImpresas.ids;
    const impresas = ids ? rows.filter((row) => ids.has(row.idOrdenVenta)).length : null;
    return { todas: rows.length, sinImprimir: impresas === null ? null : rows.length - impresas, impresas };
  }, [rows, yaImpresas.ids]);
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
    if (!tipos.has("ot")) {
      setError("Elige «Órdenes de tarea» en el tipo de documentos para poder imprimir.");
      return;
    }
    setCargando(true);
    setError(null);
    setAviso(null);
    try {
      const conOc = tipos.has("oc");
      // El detalle de cada OV ya se lee para armar sus hojas: de ahí salen también sus adjuntos.
      const origenPorOv = new Map<string, string | null | undefined>();
      const hojas = await cargarHojasBatch({
        codigoCuenta,
        resumen,
        zonaHoraria,
        runScoped,
        onProgreso: (leidas, total) => setProgreso(`Leyendo OV ${leidas} de ${total}…`),
        alLeerDetalle: conOc ? (id, origen) => origenPorOv.set(id, origen) : undefined,
      });
      if (hojas.length === 0) throw new Error("No hay hojas para las OT elegidas.");
      const nueva = await armarPreviaDetallada({
        codigoCuenta,
        zonaHoraria,
        hojas,
        resumen,
        conOc,
        origenPorOv,
        alProgreso: setProgreso,
      });
      reiniciarPartes();
      setPrevia(nueva);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo armar la vista previa.");
    } finally {
      setCargando(false);
      setProgreso(null);
    }
  };

  // Si falla el envío se queda en la vista previa con la selección intacta para reintentar.
  const imprimir = () =>
    enviar(previa, {
      alIniciar: () => setError(null),
      alFallar: setError,
      alTerminar: (resultado) => {
        setAviso(resultado);
        setSeleccion(new Map());
        setPrevia(null);
        yaImpresas.recargar();
      },
    });

  return (
    <OperationalModuleShell title="Impresión detallada" gate={{ roles: ROLES_NIVEL_CUENTA }} fitViewport compactoEnPantallaBaja>
      {previa ? (
        <div className={cn("flex flex-col gap-4 [@media(max-height:50rem)]:gap-2", AREA_FIJA)}>
          {error ? <ImpresionBatchMensaje tipo="error">{error}</ImpresionBatchMensaje> : null}
          <ImpresionRapidaAvisoOc previa={previa} />
          {progresoEnvio ? (
            <ImpresionBatchMensaje tipo="aviso">
              {progresoEnvio} No cierres esta pestaña hasta que termine.
            </ImpresionBatchMensaje>
          ) : null}
          <ImpresionBatchVistaPrevia
            blob={previa.blob}
            hojas={hojasDelPaquete(previa)}
            ot={contarSeleccion(previa.resumen).ot}
            ov={previa.resumen.length}
            imprimiendo={imprimiendo}
            nombreArchivo={previa.nombreArchivo}
            descripcionOrden={descripcionDeLaVista(previa)}
            descargaPartes={codigoCuenta ? { previa, codigoCuenta } : undefined}
            onVolver={() => {
              setPrevia(null);
              setError(null);
              reiniciarPartes();
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
          <div className="flex shrink-0 flex-wrap items-end gap-3 [@media(max-height:50rem)]:gap-2">
            <ImpresionBatchFiltroImpresion
              valor={filtros.impresion}
              conteos={conteos}
              buscando={yaImpresas.buscando}
              onChange={(impresion) => cambiarFiltros({ ...filtros, impresion })}
            />
            <div className="w-full sm:w-72">
              <ImpresionRapidaTipos value={tipos} onChange={setTipos} disabled={cargando} />
            </div>
          </div>
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
                yaImpresas={yaImpresas.ids}
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

      {previa?.partes ? (
        <ImpresionRapidaConfirmacion
          open={confirmando}
          hojas={hojasPorEnviar(partesDe(previa), siguienteParte, paginasDelResumen(previa.resumenPdf))}
          orden={partesDe(previa).slice(siguienteParte).flatMap((parte) => parte.resumen)}
          impresora={impresora}
          imprimiendo={imprimiendo}
          partes={partesDe(previa).length - siguienteParte}
          esperaMinutos={esperaEntrePartes(modoEnvio) / 60_000}
          onClose={() => setConfirmando(false)}
          onConfirm={() => void imprimir()}
        />
      ) : (
        <ImpresionBatchConfirmacion
          open={confirmando && Boolean(previa)}
          hojas={previa?.hojas.length ?? 0}
          orden={previa ? ordenDeImpresion(previa) : []}
          impresora={impresora}
          imprimiendo={imprimiendo}
          onClose={() => setConfirmando(false)}
          onConfirm={() => void imprimir()}
        />
      )}
    </OperationalModuleShell>
  );
}
