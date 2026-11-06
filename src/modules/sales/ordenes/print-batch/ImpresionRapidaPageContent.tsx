"use client";

import { Loader2, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PolariaDateInputDdMm } from "@/components/shared/form/PolariaDateInputDdMm";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { cn } from "@/lib/utils/cn";
import { useAdminMaestroScope } from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import { useCuentaZonaHoraria } from "@/modules/configurator/cuentas/hooks/useCuentaZonaHoraria";
import { getImpresoraActivaCuenta } from "@/modules/configurator/impresoras/services/impresoras.service";
import { listOrdenesVentaOperador } from "../../shared/services/sales.service";
import { printQueueUserMessage } from "../print/print-queue-status";
import { armarPreviaRapida } from "./armar-previa-rapida";
import { contarSeleccion } from "./batch-seleccion";
import { cargarHojasBatch } from "./cargar-hojas-batch";
import { enviarPaquete, esperaEntrePartes, mensajeDeFallo, partesDe } from "./enviar-paquete";
import { ImpresionBatchMensaje, type TipoMensajeBatch } from "./ImpresionBatchMensaje";
import { ImpresionRapidaAvisoOc } from "./ImpresionRapidaAvisoOc";
import { ImpresionBatchVistaPrevia } from "./ImpresionBatchVistaPrevia";
import { ImpresionRapidaConfirmacion } from "./ImpresionRapidaConfirmacion";
import {
  ImpresionRapidaTipos,
  TIPOS_RAPIDA_INICIALES,
  type TipoDocumentoRapida,
} from "./ImpresionRapidaTipos";
import { hojasPorEnviar } from "./partir-paquete";
import { candidatasRapida, resumenRapida } from "./rapida-seleccion";
import {
  horaEnCuenta,
  hojasDelPaquete,
  hoyEnCuenta,
  paginasDelResumen,
  type PreviaBatch,
} from "./utilidades-batch";
import { idsOvYaImpresas } from "./ya-impresas";

const ORDEN_RAPIDA = "ordenadas por fecha, cantidad de OT y cliente, con el resumen en la primera hoja";
const ORDEN_RAPIDA_CON_OC =
  "ordenadas por fecha, cantidad de OT y cliente; cada OV con sus órdenes de compra detrás y el resumen en la primera hoja";

/** Qué dice la vista previa de sí misma: con varios envíos solo se ve el primero. */
function descripcionDeLaVista(previa: PreviaBatch): string {
  const partes = previa.partes ?? [];
  const base = partes.some((parte) => parte.pdf) ? ORDEN_RAPIDA_CON_OC : ORDEN_RAPIDA;
  return partes.length > 1 && partes[0]?.pdf ? `${base} (vista previa del envío 1 de ${partes.length})` : base;
}

interface Aviso {
  tipo: TipoMensajeBatch;
  title: string;
  detail: string;
}

/**
 * Impresión rápida: se elige hasta qué fecha de entrega y el sistema arma, en el orden de la
 * daily (fecha, cantidad de OT, cliente), todo lo confirmado o en alistamiento que nunca se
 * imprimió. El operador revisa el PDF y confirma dos veces antes de enviarlo.
 */
export function ImpresionRapidaPageContent() {
  const { codigoCuenta, runScoped } = useAdminMaestroScope();
  const zonaHoraria = useCuentaZonaHoraria(codigoCuenta);
  const [fechaElegida, setFechaElegida] = useState<string | null>(null);
  const fecha = fechaElegida ?? hoyEnCuenta(zonaHoraria);
  const [tipos, setTipos] = useState<ReadonlySet<TipoDocumentoRapida>>(TIPOS_RAPIDA_INICIALES);
  const [progreso, setProgreso] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [previa, setPrevia] = useState<PreviaBatch | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [impresora, setImpresora] = useState<string | null>(null);
  const [modoEnvio, setModoEnvio] = useState<string | null>(null);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [progresoEnvio, setProgresoEnvio] = useState<string | null>(null);
  /** Próxima parte por mandar: tras un fallo a mitad se retoma desde ahí, sin repetir las que salieron. */
  const [siguienteParte, setSiguienteParte] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const montada = useRef(true);

  useEffect(() => {
    montada.current = true;
    return () => {
      montada.current = false;
    };
  }, []);

  const preparar = useCallback(async () => {
    if (!codigoCuenta || !fecha) return;
    setPreparando(true);
    setError(null);
    setAviso(null);
    try {
      const todas = await runScoped(() => listOrdenesVentaOperador({ codigoCuenta }));
      const candidatas = candidatasRapida(todas, fecha);
      setProgreso("Revisando qué se imprimió antes…");
      const yaImpresas = await idsOvYaImpresas({
        codigoCuenta,
        rows: candidatas,
        runScoped,
        onProgreso: (leidas, total) => setProgreso(`Revisando OV ${leidas} de ${total}…`),
      });
      const resumen = resumenRapida(candidatas, yaImpresas);
      if (resumen.length === 0) {
        setAviso({
          tipo: "aviso",
          title: "Nada por imprimir.",
          detail: "No hay órdenes confirmadas sin imprimir con entrega hasta esa fecha. Prueba con una fecha posterior.",
        });
        return;
      }
      const conOc = tipos.has("oc");
      // El detalle de cada OV ya se lee para armar sus hojas: de ahí salen también sus adjuntos.
      const origenPorOv = new Map<string, string | null | undefined>();
      const hojas = await cargarHojasBatch({
        codigoCuenta,
        resumen,
        zonaHoraria,
        runScoped,
        orden: "resumen",
        onProgreso: (leidas, total) => setProgreso(`Leyendo OV ${leidas} de ${total}…`),
        alLeerDetalle: conOc ? (id, origen) => origenPorOv.set(id, origen) : undefined,
      });
      if (hojas.length === 0) throw new Error("No hay hojas para las OT de estas órdenes.");
      const nueva = await armarPreviaRapida({
        codigoCuenta,
        fecha,
        zonaHoraria,
        hojas,
        resumen,
        conOc,
        origenPorOv,
        alProgreso: setProgreso,
      });
      setSiguienteParte(0);
      setPrevia(nueva);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo armar la impresión.");
    } finally {
      setPreparando(false);
      setProgreso(null);
    }
  }, [codigoCuenta, fecha, runScoped, tipos, zonaHoraria]);

  const pedirConfirmacion = () => {
    setConfirmando(true);
    if (!codigoCuenta) return;
    void getImpresoraActivaCuenta(codigoCuenta).then(
      (destino) => {
        setImpresora(destino?.nombre?.trim() || null);
        setModoEnvio(destino?.modoEnvio ?? null);
      },
      () => setImpresora(null),
    );
  };

  const imprimir = async () => {
    if (!previa || !codigoCuenta) return;
    setImprimiendo(true);
    setError(null);
    const total = partesDe(previa).length;
    const resultado = await enviarPaquete({
      previa,
      codigoCuenta,
      desde: siguienteParte,
      esperaMs: esperaEntrePartes(modoEnvio),
      alCambiar: (indice, de, fase, segundos) =>
        setProgresoEnvio(
          fase === "enviando"
            ? `Enviando parte ${indice + 1} de ${de}…`
            : `Parte ${indice + 1} de ${de} enviada. La siguiente sale en ${segundos} s.`,
        ),
      cancelado: () => !montada.current,
    });
    if (!montada.current) return;
    setProgresoEnvio(null);
    setConfirmando(false);
    setImprimiendo(false);
    setSiguienteParte(resultado.siguiente);

    if (resultado.error !== undefined) {
      setError(mensajeDeFallo(resultado.error, resultado.siguiente, total));
      return;
    }
    if (!resultado.ultimo) return;
    const mensaje = printQueueUserMessage({
      outcome: resultado.ultimo.queue,
      impresora: resultado.ultimo.impresora,
      codigo: `${previa.resumen.length} OV`,
      hojas: hojasDelPaquete(previa),
    });
    const kind = resultado.ultimo.queue.kind;
    setAviso({
      tipo: kind === "printing" || kind === "unknown" ? "ok" : "aviso",
      title: mensaje.title,
      detail: `${mensaje.detail}${total > 1 ? ` Se mandó en ${total} partes.` : ""} Terminó a las ${horaEnCuenta(zonaHoraria)}.`,
    });
    setSiguienteParte(0);
    setPrevia(null);
  };

  // Los avisos van donde está la atención: con la vista previa, arriba de ella; en el formulario,
  // debajo del botón. Arriba del formulario empujaban los controles justo después de pulsarlo.
  const mensajes = (
    <>
      {aviso ? (
        <ImpresionBatchMensaje tipo={aviso.tipo}>
          <strong className="font-semibold">{aviso.title}</strong> {aviso.detail}
        </ImpresionBatchMensaje>
      ) : null}
      {error ? <ImpresionBatchMensaje tipo="error">{error}</ImpresionBatchMensaje> : null}
      {previa ? <ImpresionRapidaAvisoOc previa={previa} /> : null}
      {progresoEnvio ? (
        <ImpresionBatchMensaje tipo="aviso">
          {progresoEnvio} No cierres esta pestaña hasta que termine.
        </ImpresionBatchMensaje>
      ) : null}
    </>
  );

  return (
    <OperationalModuleShell title="Impresión rápida" gate={{ roles: ROLES_NIVEL_CUENTA }} fitViewport compactoEnPantallaBaja>
      <div className="flex min-h-0 flex-col gap-4 [@media(max-height:50rem)]:gap-2 lg:flex-1">
        {previa ? mensajes : null}

        {previa ? (
          <ImpresionBatchVistaPrevia
            blob={previa.blob}
            hojas={hojasDelPaquete(previa)}
            ot={contarSeleccion(previa.resumen).ot}
            ov={previa.resumen.length}
            imprimiendo={imprimiendo}
            nombreArchivo={previa.nombreArchivo}
            descripcionOrden={descripcionDeLaVista(previa)}
            etiquetaVolver="Cambiar la fecha"
            onVolver={() => {
              setPrevia(null);
              setError(null);
              setSiguienteParte(0);
            }}
            onImprimir={pedirConfirmacion}
          />
        ) : (
          <form
            aria-busy={preparando}
            onSubmit={(event) => {
              event.preventDefault();
              void preparar();
            }}
            className="flex max-w-3xl flex-col gap-4"
          >
            <p className="polaria-text-body text-polaria-w">
              Imprime todo lo confirmado que aún no se ha impreso, con entrega desde la fecha
              elegida hacia atrás. Antes de enviar verás el PDF y se pedirá confirmar dos veces.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
              <PolariaDateInputDdMm
                id="rapida-fecha"
                label="Imprimir con entrega hasta"
                value={fecha}
                onChange={setFechaElegida}
                disabled={preparando}
                required
                compact
                controlClassName="h-11 [@media(max-height:50rem)]:h-9 border-polaria-w-20 focus-visible:border-polaria-teal focus-visible:ring-2 focus-visible:ring-polaria-teal"
              />
              <ImpresionRapidaTipos value={tipos} onChange={setTipos} disabled={preparando} />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={preparando || !fecha || !codigoCuenta || !tipos.has("ot")}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-xl border border-polaria-teal bg-polaria-teal px-4 py-2.5 text-sm font-semibold text-polaria-on-teal transition hover:opacity-90 motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {preparando ? (
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" strokeWidth={1.75} aria-hidden />
                ) : (
                  <Zap className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                )}
                {preparando ? "Preparando…" : "Preparar impresión"}
              </button>
              <p role="status" className="polaria-text-body-sm tabular-nums text-polaria-w">
                {progreso}
              </p>
            </div>
            {mensajes}
          </form>
        )}
      </div>

      <ImpresionRapidaConfirmacion
        open={confirmando && Boolean(previa)}
        hojas={
          previa
            ? hojasPorEnviar(
                partesDe(previa),
                siguienteParte,
                paginasDelResumen(previa.resumenPdf),
              )
            : 0
        }
        orden={previa ? partesDe(previa).slice(siguienteParte).flatMap((parte) => parte.resumen) : []}
        impresora={impresora}
        imprimiendo={imprimiendo}
        partes={previa ? partesDe(previa).length - siguienteParte : 1}
        esperaMinutos={esperaEntrePartes(modoEnvio) / 60_000}
        onClose={() => setConfirmando(false)}
        onConfirm={() => void imprimir()}
      />
    </OperationalModuleShell>
  );
}
