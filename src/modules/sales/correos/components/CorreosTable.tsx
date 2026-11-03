"use client";

import { CheckCircle2, Loader2, RotateCw } from "lucide-react";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import {
  POLARIA_TABLE_ROW_HEIGHT_CLASS,
  POLARIA_TABLE_SCROLL_CLASS,
} from "@/components/shared/table/polaria-table-layout";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/table/PolariaTableCells";
import { PolariaTablePaginationFooter } from "@/components/shared/table/PolariaTablePaginationFooter";
import { cn } from "@/lib/utils/cn";
import { useCorreosIngreso } from "../hooks/useCorreosIngreso";
import type { CorreoFila, ModoCorreos } from "../types/correos.types";
import { CorreosFiltros } from "./CorreosFiltros";

const FORMATO_RECIBIDO = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

/** Hora de Colombia (UTC-5), sea cual sea la zona del equipo. */
export function formatearRecibido(iso: string | null): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? "—" : FORMATO_RECIBIDO.format(fecha);
}

const TEXTOS: Record<
  ModoCorreos,
  { vacioSinFiltros: string; vacioConFiltros: string }
> = {
  todos: {
    vacioSinFiltros: "Todavía no hay correos registrados.",
    vacioConFiltros: "Ningún correo coincide con los filtros.",
  },
  descartados: {
    vacioSinFiltros: "El flujo no ha descartado ningún correo.",
    vacioConFiltros: "Ningún correo descartado coincide con los filtros.",
  },
};

const BOTON_INGRESAR = cn(
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-polaria-t-20 px-3.5",
  "polaria-text-body-sm font-semibold text-polaria-teal transition",
  "hover:bg-polaria-t-08",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

function AccionIngreso({
  fila,
  onIngresar,
}: {
  fila: CorreoFila;
  onIngresar: (messageId: string) => void;
}) {
  const ingreso = fila.ingreso;

  if (ingreso?.estado === "ingresado") {
    return (
      <span
        role="status"
        className="inline-flex items-center gap-2 text-polaria-teal"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="polaria-text-body-sm">
          Ingresado como{" "}
          <PolariaTableCode>
            {ingreso.codigoOrdenVenta ?? "una OV"}
          </PolariaTableCode>
        </span>
      </span>
    );
  }

  if (ingreso?.estado === "procesando") {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 text-polaria-w-50"
      >
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        <span className="polaria-text-body-sm">Ingresando pedido…</span>
      </span>
    );
  }

  if (ingreso?.estado === "error" || fila.nuevoPedido === false) {
    const asunto = fila.asunto ?? "sin asunto";
    return (
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => onIngresar(fila.messageId)}
          aria-label={`${ingreso?.estado === "error" ? "Reintentar el ingreso" : "Ingresar como OV"} del correo ${asunto}`}
          className={BOTON_INGRESAR}
        >
          {ingreso?.estado === "error" ? (
            <RotateCw className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          ) : null}
          {ingreso?.estado === "error" ? "Reintentar" : "Ingresar como OV"}
        </button>
        {ingreso?.estado === "error" && ingreso.error ? (
          <p
            role="alert"
            title={ingreso.error}
            className="polaria-text-caption line-clamp-2 max-w-[16rem] text-polaria-danger"
          >
            {ingreso.error}
          </p>
        ) : null}
      </div>
    );
  }

  // Pasó el filtro del flujo: lo ingresa el flujo. Ingresarlo a mano duplicaría la OV.
  return (
    <span
      className="polaria-text-body-sm text-polaria-w-50"
      title="El flujo automático lo procesa; ingresarlo a mano duplicaría la OV."
    >
      Lo ingresa el flujo
    </span>
  );
}

const CELDA = "px-5 py-2 sm:px-6";
const ENCABEZADO = "polaria-text-label px-5 py-3 text-polaria-w-50 sm:px-6";

/**
 * Lista de correos de pedidos (REQ-104): filtros, tabla y paginación del servidor, con la
 * columna de acción que ingresa un correo como OV y la cambia por el código de la OV.
 */
export function CorreosTable({ modo }: { modo: ModoCorreos }) {
  const {
    filtros,
    setFiltro,
    limpiarFiltros,
    hayFiltros,
    filas,
    total,
    pagina,
    setPagina,
    tamano,
    cargando,
    error,
    recargar,
    ingresar,
  } = useCorreosIngreso(modo);

  const primeraCarga = cargando && filas.length === 0;
  const textos = TEXTOS[modo];

  return (
    <section className="overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08 backdrop-blur-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-polaria-w-08 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="polaria-text-card-title">Lista de correos</h2>
          <p className="polaria-text-caption mt-1 text-polaria-w-50">
            Recibido, remitente, asunto y estado de ingreso.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="polaria-text-body-sm whitespace-nowrap tabular-nums text-polaria-w-50">
            Total: {primeraCarga ? "—" : total}
          </span>
          <button
            type="button"
            onClick={recargar}
            disabled={cargando}
            aria-label="Actualizar lista de correos"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal transition",
              "hover:bg-polaria-t-08 disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
            )}
          >
            <RotateCw
              className={cn("h-4 w-4", cargando && "animate-spin")}
              strokeWidth={1.75}
              aria-hidden
            />
          </button>
        </div>
      </header>

      <CorreosFiltros
        filtros={filtros}
        onChange={setFiltro}
        onLimpiar={limpiarFiltros}
        hayFiltros={hayFiltros}
      />

      {error ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
          <p className="polaria-text-body-sm text-polaria-danger">{error}</p>
          <button type="button" onClick={recargar} className={BOTON_INGRESAR}>
            Reintentar
          </button>
        </div>
      ) : null}

      {primeraCarga && !error ? <PolariaStatusLoading embedded /> : null}

      {!primeraCarga && !error ? (
        <div className={POLARIA_TABLE_SCROLL_CLASS} aria-busy={cargando}>
          <table
            className={cn(
              "w-full text-left transition-opacity",
              cargando && "opacity-60",
            )}
          >
            <thead className="border-b border-polaria-w-08">
              <tr>
                <th scope="col" className={ENCABEZADO}>
                  Recibido
                </th>
                <th scope="col" className={ENCABEZADO}>
                  Remitente
                </th>
                <th scope="col" className={ENCABEZADO}>
                  Asunto
                </th>
                <th scope="col" className={ENCABEZADO}>
                  Adjunto
                </th>
                <th scope="col" className={ENCABEZADO}>
                  Motivo
                </th>
                <th scope="col" className={ENCABEZADO}>
                  Ingreso
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="polaria-text-body-sm px-5 py-10 text-center text-polaria-w-50 sm:px-6"
                  >
                    {hayFiltros ? textos.vacioConFiltros : textos.vacioSinFiltros}
                  </td>
                </tr>
              ) : (
                filas.map((fila) => (
                  <tr
                    key={fila.messageId}
                    className={cn(
                      POLARIA_TABLE_ROW_HEIGHT_CLASS,
                      "border-t border-polaria-w-08 text-polaria-w",
                    )}
                  >
                    <td
                      className={cn(
                        CELDA,
                        "polaria-text-body-sm whitespace-nowrap tabular-nums text-polaria-w-50",
                      )}
                    >
                      {formatearRecibido(fila.recibidoEn)}
                    </td>
                    <td className={CELDA}>
                      <span
                        className="polaria-text-body-sm block max-w-[14rem] truncate"
                        title={fila.de ?? undefined}
                      >
                        {fila.de ?? "—"}
                      </span>
                    </td>
                    <td className={CELDA}>
                      <span
                        className="polaria-text-body-sm line-clamp-2 max-w-[22rem]"
                        title={fila.asunto ?? undefined}
                      >
                        {fila.asunto ?? "—"}
                      </span>
                    </td>
                    <td className={CELDA}>
                      <span
                        className="polaria-text-body-sm block max-w-[12rem] truncate text-polaria-w-50"
                        title={fila.adjunto ?? undefined}
                      >
                        {fila.adjunto ?? "—"}
                      </span>
                    </td>
                    <td className={CELDA}>
                      {fila.motivo ? (
                        <span
                          className="line-clamp-2 max-w-[16rem]"
                          title={fila.motivo}
                        >
                          <PolariaTableBadge variant="warning">
                            {fila.motivo}
                          </PolariaTableBadge>
                        </span>
                      ) : (
                        <span className="polaria-text-body-sm text-polaria-w-50">—</span>
                      )}
                    </td>
                    <td className={cn(CELDA, "whitespace-nowrap")}>
                      <AccionIngreso fila={fila} onIngresar={(id) => void ingresar(id)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {!primeraCarga && !error ? (
        <PolariaTablePaginationFooter
          page={pagina}
          pageSize={tamano}
          totalItems={total}
          onPageChange={setPagina}
        />
      ) : null}
    </section>
  );
}
