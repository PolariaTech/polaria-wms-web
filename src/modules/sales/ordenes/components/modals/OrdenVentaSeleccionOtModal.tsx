"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import type { OrdenTareaAlmacenPrintData } from "../../print/orden-tarea-almacen.types";
import {
  agruparHojasPorOt,
  hojasDeLasOt,
  type OtParaElegir,
} from "../../print/seleccion-ot-impresion";

export type AccionSobreOt = "imprimir" | "descargar";

const CHECK_CLASS =
  "h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-polaria-teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg disabled:cursor-not-allowed";

type Carga =
  | { estado: "cargando" }
  | { estado: "error" }
  | { estado: "listo"; ots: OtParaElegir[] };

export interface OrdenVentaSeleccionOtModalProps {
  open: boolean;
  accion: AccionSobreOt;
  /** Folio visible de la OV (p. ej. OV-00000003). */
  folio?: string;
  /** La OV ya se imprimió antes (REQ-137): se avisa aquí en vez de pedir otra confirmación. */
  yaImpresa?: boolean;
  /** Hay un envío o una descarga en curso: no se puede elegir otra vez. */
  ocupado?: boolean;
  onClose: () => void;
  /** Lee las hojas de la OV, con su surtido; de ellas sale la lista de OT. */
  cargarHojas: () => Promise<OrdenTareaAlmacenPrintData[]>;
  /** Números de las OT elegidas, de menor a mayor. */
  onConfirmar: (ots: number[]) => void;
}

/** Cajas que se reparten el ancho: más columnas en pantalla grande, sin dejar un hueco a la derecha. */
const CUADRICULA = "grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3";

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Qué hojas de la OV salen. Se abre junto al Cypher (dock-left: el Cypher queda visible) cuando
 * la OV está confirmada y se pulsa «Imprimir» o «Descarga». Viene todo marcado: el caso común
 * sigue siendo un solo clic. El botón dice cuántas hojas saldrán y se actualiza al marcar.
 */
export function OrdenVentaSeleccionOtModal({
  open,
  accion,
  folio,
  yaImpresa = false,
  ocupado = false,
  onClose,
  cargarHojas,
  onConfirmar,
}: OrdenVentaSeleccionOtModalProps) {
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });
  const [elegidas, setElegidas] = useState<ReadonlySet<number>>(new Set());
  const [intento, setIntento] = useState(0);
  const maestra = useRef<HTMLInputElement>(null);
  // El padre pasa una función nueva en cada render: se lee la última sin reiniciar la carga.
  // Va antes del efecto que carga para que este ya vea la función vigente.
  const cargarRef = useRef(cargarHojas);
  useEffect(() => {
    cargarRef.current = cargarHojas;
  });

  useEffect(() => {
    if (!open) {
      setCarga({ estado: "cargando" });
      return;
    }
    let vigente = true;
    setCarga({ estado: "cargando" });
    cargarRef.current().then(
      (hojas) => {
        if (!vigente) return;
        const ots = agruparHojasPorOt(hojas);
        setElegidas(new Set(ots.map((ot) => ot.numero)));
        setCarga({ estado: "listo", ots });
      },
      () => {
        if (vigente) setCarga({ estado: "error" });
      },
    );
    return () => {
      vigente = false;
    };
  }, [open, intento]);

  const ots = carga.estado === "listo" ? carga.ots : [];
  const hojas = hojasDeLasOt(ots, elegidas);
  const todas = ots.length > 0 && elegidas.size === ots.length;
  const algunas = elegidas.size > 0 && !todas;

  // Para quien usa teclado: al terminar de cargar el foco queda en la lista.
  useEffect(() => {
    if (carga.estado === "listo") maestra.current?.focus();
  }, [carga.estado]);
  useEffect(() => {
    if (maestra.current) maestra.current.indeterminate = algunas;
  }, [algunas]);

  const alternar = (numero: number) =>
    setElegidas((previas) => {
      const siguientes = new Set(previas);
      if (siguientes.has(numero)) siguientes.delete(numero);
      else siguientes.add(numero);
      return siguientes;
    });
  const alternarTodas = () =>
    setElegidas(todas ? new Set() : new Set(ots.map((ot) => ot.numero)));

  const puedeConfirmar = carga.estado === "listo" && elegidas.size > 0 && !ocupado;
  const confirmar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (puedeConfirmar) onConfirmar([...elegidas].sort((a, b) => a - b));
  };

  const imprimir = accion === "imprimir";
  const etiquetaAccion = !puedeConfirmar && elegidas.size === 0
    ? imprimir ? "Imprimir" : "Ver PDF"
    : imprimir
      ? `Imprimir ${plural(hojas, "hoja", "hojas")}`
      : `Ver PDF de ${plural(hojas, "hoja", "hojas")}`;

  const resumen =
    carga.estado === "cargando"
      ? "Leyendo las órdenes de trabajo…"
      : carga.estado === "error"
        ? ""
        : elegidas.size === 0
          ? "Elige al menos una orden de trabajo."
          : `${elegidas.size} de ${ots.length} OT, ${plural(hojas, "hoja", "hojas")}`;

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      title={`${imprimir ? "Imprimir" : "Descargar"} ${folio ?? "orden de venta"}`}
      description={
        imprimir
          ? "Elige las órdenes de trabajo que salen en la impresión."
          : "Elige las órdenes de trabajo que van en el PDF. Después podrás verlo y descargarlo."
      }
      layout="dock-left"
      stackLevel="base"
      closeOnBackdrop={false}
      submitOnEnter={false}
      onSubmit={confirmar}
      submitLabel={etiquetaAccion}
      submitDisabled={!puedeConfirmar}
      isSubmitting={ocupado}
      footerLeading={
        <p role="status" className="polaria-text-body-sm tabular-nums text-polaria-w">
          {resumen}
        </p>
      }
    >
      {/* px-1: el contenedor con scroll recorta el anillo de foco en el borde. */}
      <div className="flex flex-col gap-4 px-1" aria-busy={carga.estado === "cargando"}>
        {/* Arriba de las cajas: con muchas OT quedaría bajo el scroll y nadie lo vería antes de imprimir. */}
        {imprimir && yaImpresa ? (
          <p
            role="status"
            className="rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 text-[0.9375rem] leading-relaxed text-polaria-w"
          >
            Esta OV ya se imprimió para alistamiento. Si la imprimes otra vez, asegúrate de que
            no se duplique el alistamiento en el almacén.
          </p>
        ) : null}

        {carga.estado === "cargando" ? (
          <div aria-hidden className={CUADRICULA}>
            {[0, 1, 2, 3, 4, 5].map((caja) => (
              <div key={caja} className="flex h-28 flex-col gap-3 rounded-xl border border-polaria-w-08 p-4">
                <div className="h-4 w-20 animate-pulse rounded bg-polaria-w-08 motion-reduce:animate-none" />
                <div className="h-3 w-32 animate-pulse rounded bg-polaria-w-08 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        ) : null}

        {carga.estado === "error" ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-3 rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-4"
          >
            <p className="polaria-text-body-sm text-polaria-danger">
              No se pudieron leer las órdenes de trabajo. Revisa tu conexión e inténtalo de nuevo.
            </p>
            <button
              type="button"
              onClick={() => setIntento((n) => n + 1)}
              className="inline-flex min-h-11 items-center rounded-xl border border-polaria-w-20 px-4 text-sm font-semibold text-polaria-w transition hover:border-polaria-teal hover:text-polaria-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {carga.estado === "listo" && ots.length === 0 ? (
          <p className="polaria-text-body text-polaria-w">
            Esta orden de venta no tiene órdenes de trabajo para el PDF.
          </p>
        ) : null}

        {ots.length > 0 ? (
          <fieldset disabled={ocupado} className="flex min-w-0 flex-col gap-3">
            <legend className="sr-only">Órdenes de trabajo</legend>
            {ots.length > 1 ? (
              <label className="flex min-h-11 w-fit cursor-pointer items-center gap-3 rounded-xl border border-polaria-w-20 bg-polaria-w-08 px-4 py-2">
                <input
                  ref={maestra}
                  type="checkbox"
                  checked={todas}
                  onChange={alternarTodas}
                  className={CHECK_CLASS}
                />
                <span className="font-semibold text-polaria-w">Todas las órdenes de trabajo</span>
                <span className="text-sm tabular-nums text-polaria-w">
                  {elegidas.size} de {ots.length}
                </span>
              </label>
            ) : null}
            <ul className={CUADRICULA}>
              {ots.map((ot) => {
                const marcada = elegidas.has(ot.numero);
                return (
                  <li key={ot.numero} className="flex">
                    <label
                      className={cn(
                        "flex w-full cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors motion-reduce:transition-none",
                        "focus-within:ring-2 focus-within:ring-polaria-teal",
                        marcada
                          ? "border-polaria-teal bg-polaria-t-08"
                          : "border-polaria-w-20 hover:bg-polaria-w-08",
                      )}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-semibold tabular-nums text-polaria-w">
                          OT {ot.numero} <span className="font-normal">de {ot.total}</span>
                        </span>
                        <input
                          ref={ots.length === 1 ? maestra : undefined}
                          type="checkbox"
                          checked={marcada}
                          onChange={() => alternar(ot.numero)}
                          className={CHECK_CLASS}
                        />
                      </span>
                      <span className="line-clamp-2 text-sm leading-snug text-polaria-w" title={ot.centro}>
                        {ot.centro || "Sin centro de consumo"}
                      </span>
                      <span className="mt-auto text-sm tabular-nums text-polaria-w">
                        {plural(ot.renglones, "producto", "productos")} · {plural(ot.hojas, "hoja", "hojas")}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ) : null}
      </div>
    </PolariaFormModal>
  );
}
