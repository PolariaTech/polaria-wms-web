"use client";

import { CheckCircle2, Loader2, RotateCw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import {
  getPaginationPlaceholderCount,
  getTableBodyMinHeightStyle,
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

  // Pasó el filtro del flujo, que ya lo ingresó. Ingresarlo a mano duplicaría la OV.
  return (
    <span className="inline-flex items-center gap-2 text-polaria-teal">
      <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="polaria-text-body-sm">Ingresado por el flujo</span>
    </span>
  );
}

const FORMATO_COMPLETO = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

/** Fecha y hora completas en hora de Colombia (UTC-5). */
export function formatearFechaCompleta(iso: string | null): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? "—" : FORMATO_COMPLETO.format(fecha);
}

function Dato({
  etiqueta,
  children,
  tecnico = false,
}: {
  etiqueta: string;
  children: ReactNode;
  /** Identificadores: tipografía de datos, para leerlos y copiarlos sin confundir caracteres. */
  tecnico?: boolean;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="polaria-text-body-sm text-polaria-w-50">{etiqueta}</dt>
      <dd
        className={cn(
          "min-w-0 break-words",
          tecnico ? "font-mono text-xs tabular-nums" : "polaria-text-body-sm",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

const SIN_DATO = <span className="text-polaria-w-50">—</span>;
const dato = (valor: string | null): ReactNode => valor ?? SIN_DATO;

function GrupoDetalle({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="polaria-text-body font-semibold">{titulo}</h3>
      <dl className="space-y-3">{children}</dl>
    </section>
  );
}

/** Todo lo que trae la data table de n8n para el correo, sin recortes. */
function DetalleCorreoModal({
  fila,
  onClose,
  onIngresar,
}: {
  fila: CorreoFila;
  onClose: () => void;
  onIngresar: (messageId: string) => void;
}) {
  return (
    <PolariaFormModal
      open
      onClose={onClose}
      title={fila.asunto ?? "Correo sin asunto"}
      description={
        fila.recibidoEn
          ? `Recibido el ${formatearFechaCompleta(fila.recibidoEn)} (hora de Colombia)`
          : "Sin fecha de recepción"
      }
      onSubmit={(evento) => evento.preventDefault()}
      asForm={false}
      compact
      size="lg"
      hideHeaderClose
      cancelLabel="Cerrar"
      footerAction={<AccionIngreso fila={fila} onIngresar={onIngresar} />}
    >
      <GrupoDetalle titulo="Correo">
        <Dato etiqueta="De">{dato(fila.de)}</Dato>
        <Dato etiqueta="Para">{dato(fila.para)}</Dato>
        <Dato etiqueta="Asunto">{dato(fila.asunto)}</Dato>
        <Dato etiqueta="Adjunto">{dato(fila.adjunto)}</Dato>
      </GrupoDetalle>

      <GrupoDetalle titulo="Flujo de n8n">
        <Dato etiqueta="Estado">
          {fila.nuevoPedido === false
            ? "Descartado por el flujo"
            : "Ingresado por el flujo"}
        </Dato>
        <Dato etiqueta="Motivo">{dato(fila.motivo)}</Dato>
      </GrupoDetalle>

      <GrupoDetalle titulo="Identificadores">
        <Dato etiqueta="ID del mensaje" tecnico>
          {fila.messageId}
        </Dato>
        <Dato etiqueta="ID del hilo" tecnico>
          {dato(fila.hilo)}
        </Dato>
        <Dato etiqueta="Registro en n8n" tecnico>
          {dato(fila.idRegistro)}
        </Dato>
        <Dato etiqueta="Registrado en n8n">
          {formatearFechaCompleta(fila.registradoEn)}
        </Dato>
        <Dato etiqueta="Última actualización">
          {formatearFechaCompleta(fila.actualizadoEn)}
        </Dato>
      </GrupoDetalle>
    </PolariaFormModal>
  );
}

const CELDA = "px-5 py-1 align-middle sm:px-6";
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
  const [detalleId, setDetalleId] = useState<string | null>(null);
  // Se busca en las filas vigentes: así el modal refleja el avance del ingreso y se cierra
  // solo si el correo sale de la página (otra página, filtros).
  const detalle = detalleId
    ? (filas.find((fila) => fila.messageId === detalleId) ?? null)
    : null;

  return (
    <>
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

      {primeraCarga && !error ? (
        <div style={getTableBodyMinHeightStyle(tamano)}>
          <PolariaStatusLoading embedded />
        </div>
      ) : null}

      {!primeraCarga && !error ? (
        <div
          className={POLARIA_TABLE_SCROLL_CLASS}
          style={getTableBodyMinHeightStyle(tamano)}
          aria-busy={cargando}
        >
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
                    onClick={() => setDetalleId(fila.messageId)}
                    className={cn(
                      POLARIA_TABLE_ROW_HEIGHT_CLASS,
                      "cursor-pointer border-t border-polaria-w-08 text-polaria-w transition-colors hover:bg-polaria-t-08",
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
                      <button
                        type="button"
                        aria-haspopup="dialog"
                        title={fila.asunto ?? "Ver el detalle del correo"}
                        onClick={(evento) => {
                          evento.stopPropagation();
                          setDetalleId(fila.messageId);
                        }}
                        className={cn(
                          "polaria-text-body-sm line-clamp-2 max-w-[22rem] rounded text-left transition-colors hover:text-polaria-teal",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                        )}
                      >
                        {fila.asunto ?? "Sin asunto"}
                      </button>
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
                    <td
                      className={cn(CELDA, "whitespace-nowrap")}
                      onClick={(evento) => evento.stopPropagation()}
                    >
                      <AccionIngreso fila={fila} onIngresar={(id) => void ingresar(id)} />
                    </td>
                  </tr>
                ))
              )}
              {Array.from(
                {
                  length: getPaginationPlaceholderCount(filas.length, tamano, true),
                },
                (_, indice) => (
                  <tr
                    key={`relleno-${indice}`}
                    aria-hidden
                    className={cn(
                      POLARIA_TABLE_ROW_HEIGHT_CLASS,
                      "border-t border-polaria-w-08",
                    )}
                  >
                    <td colSpan={6} className="px-5 py-0 sm:px-6">
                      &nbsp;
                    </td>
                  </tr>
                ),
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

    {/* Fuera del <section>: su `backdrop-blur` volvería «relativo» al `fixed` del modal. */}
    {detalle ? (
      <DetalleCorreoModal
        fila={detalle}
        onClose={() => setDetalleId(null)}
        onIngresar={(id) => void ingresar(id)}
      />
    ) : null}
    </>
  );
}
