"use client";

import { CheckCircle2, Loader2, MailX, Paperclip, RotateCw } from "lucide-react";
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
  hour12: true,
});

/** Fecha y hora completas en hora de Colombia (UTC-5). */
export function formatearFechaCompleta(iso: string | null): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? "—" : FORMATO_COMPLETO.format(fecha);
}

const SIN_DATO = <span className="text-polaria-w-50">—</span>;
const dato = (valor: string | null): ReactNode => valor ?? SIN_DATO;

export interface DireccionCorreo {
  nombre: string | null;
  correo: string;
}

/**
 * Separa `"Ana Torres" <ana@x.com>, ventas@x.com` en personas. Las comas dentro de comillas
 * o de `<…>` no separan: un nombre como "Torres, Ana" sigue siendo una sola persona.
 */
export function separarDirecciones(texto: string | null): DireccionCorreo[] {
  if (!texto) return [];
  const partes: string[] = [];
  let actual = "";
  let enComillas = false;
  let enAngulos = false;
  for (const caracter of texto) {
    if (caracter === '"') enComillas = !enComillas;
    else if (!enComillas && caracter === "<") enAngulos = true;
    else if (!enComillas && caracter === ">") enAngulos = false;
    if (caracter === "," && !enComillas && !enAngulos) {
      partes.push(actual);
      actual = "";
    } else {
      actual += caracter;
    }
  }
  partes.push(actual);

  return partes
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte) => {
      const conNombre = /^"?([^"<]*?)"?\s*<([^>]+)>$/.exec(parte);
      if (conNombre) {
        const nombre = (conNombre[1] ?? "").trim();
        return { nombre: nombre || null, correo: (conNombre[2] ?? "").trim() };
      }
      return { nombre: null, correo: parte.replace(/^"|"$/g, "") };
    });
}

/** El flujo guarda todos los adjuntos en una sola columna, separados por « | ». */
export function separarAdjuntos(valor: string | null): string[] {
  if (!valor) return [];
  return valor
    .split("|")
    .map((nombre) => nombre.trim())
    .filter(Boolean);
}

/** En la tabla: el primer archivo y, si hay más, cuántos faltan. */
function AdjuntosResumen({ valor }: { valor: string | null }) {
  const nombres = separarAdjuntos(valor);
  if (nombres.length === 0) {
    return <span className="polaria-text-body-sm text-polaria-w-50">—</span>;
  }
  const [primero, ...resto] = nombres;
  return (
    <span
      className="flex max-w-[13rem] items-center gap-1.5"
      title={nombres.join(", ")}
    >
      <span className="polaria-text-body-sm min-w-0 truncate text-polaria-w-50">
        {primero}
      </span>
      {resto.length > 0 ? (
        <span
          aria-label={`y ${resto.length} adjunto${resto.length === 1 ? "" : "s"} más`}
          className="polaria-text-caption shrink-0 rounded-md border border-polaria-w-08 bg-polaria-w-08 px-1.5 tabular-nums text-polaria-w"
        >
          +{resto.length}
        </span>
      ) : null}
    </span>
  );
}

function Personas({ valor }: { valor: string | null }) {
  const personas = separarDirecciones(valor);
  if (personas.length === 0) return SIN_DATO;
  return (
    <ul className="space-y-1">
      {personas.map((persona, indice) => (
        <li key={`${persona.correo}-${indice}`} className="break-words">
          {persona.nombre ? (
            <>
              <span className="font-medium">{persona.nombre}</span>{" "}
              <span className="text-polaria-w-50">{persona.correo}</span>
            </>
          ) : (
            <span>{persona.correo}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Lo que dijo el flujo y por qué: es lo que decide si hace falta ingresarlo a mano. */
function VeredictoFlujo({ fila }: { fila: CorreoFila }) {
  const descartado = fila.nuevoPedido === false;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        descartado
          ? "border-polaria-warning-border bg-polaria-warning-bg"
          : "border-polaria-t-20 bg-polaria-t-08",
      )}
    >
      {descartado ? (
        <MailX
          className="mt-0.5 h-5 w-5 shrink-0 text-polaria-warning"
          strokeWidth={1.75}
          aria-hidden
        />
      ) : (
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-polaria-teal"
          strokeWidth={1.75}
          aria-hidden
        />
      )}
      <div className="min-w-0">
        <p
          className={cn(
            "polaria-text-body font-semibold",
            descartado ? "text-polaria-warning" : "text-polaria-teal",
          )}
        >
          {descartado ? "Descartado por el flujo" : "Ingresado por el flujo"}
        </p>
        {fila.motivo ? (
          <p className="polaria-text-body-sm mt-1 max-w-prose">{fila.motivo}</p>
        ) : descartado ? (
          <p className="polaria-text-body-sm mt-1 text-polaria-w-50">
            El flujo no dejó un motivo.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Etiqueta chica arriba y el valor debajo: para los datos de referencia de n8n. */
function Campo({
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
    <div className="min-w-0">
      <dt className="polaria-text-caption text-polaria-w-50">{etiqueta}</dt>
      <dd
        className={cn(
          "mt-0.5 break-all",
          tecnico ? "font-mono text-xs tabular-nums" : "polaria-text-body-sm",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

const puedeIngresarAMano = (fila: CorreoFila): boolean =>
  fila.ingreso?.estado === "error" ||
  (fila.nuevoPedido === false && !fila.ingreso);

/**
 * Detalle del correo (REQ-104). Primero lo que decide si es un pedido: qué dijo el flujo y por
 * qué; luego quién lo mandó y a quién, como en un cliente de correo; al final, en pequeño, los
 * datos de referencia de n8n.
 */
function DetalleCorreoModal({
  fila,
  onClose,
  onIngresar,
}: {
  fila: CorreoFila;
  onClose: () => void;
  onIngresar: (messageId: string) => void;
}) {
  const adjuntos = separarAdjuntos(fila.adjunto);
  return (
    <PolariaFormModal
      open
      onClose={onClose}
      title={fila.asunto ?? "Correo sin asunto"}
      description={
        fila.recibidoEn
          ? `Recibido el ${formatearFechaCompleta(fila.recibidoEn)} · hora de Colombia`
          : "Sin fecha de recepción"
      }
      onSubmit={(evento) => evento.preventDefault()}
      asForm={false}
      compact
      size="lg"
      hideHeaderClose
      cancelLabel="Cerrar"
      footerCenter={
        puedeIngresarAMano(fila) ? (
          <p className="polaria-text-caption max-w-xs text-center text-polaria-w-50">
            Crea una orden de venta por confirmar leyendo el correo y su adjunto.
          </p>
        ) : undefined
      }
      footerAction={<AccionIngreso fila={fila} onIngresar={onIngresar} />}
    >
      <div className="space-y-5">
        <VeredictoFlujo fila={fila} />

        <dl className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3">
          <dt className="polaria-text-body-sm pt-0.5 text-polaria-w-50">De</dt>
          <dd className="polaria-text-body-sm min-w-0">
            <Personas valor={fila.de} />
          </dd>
          <dt className="polaria-text-body-sm pt-0.5 text-polaria-w-50">Para</dt>
          <dd className="polaria-text-body-sm min-w-0">
            <Personas valor={fila.para} />
          </dd>
          <dt className="polaria-text-body-sm pt-1 text-polaria-w-50">
            {adjuntos.length > 1 ? "Adjuntos" : "Adjunto"}
          </dt>
          <dd className="min-w-0">
            {adjuntos.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {adjuntos.map((nombre, indice) => (
                  <li
                    key={`${nombre}-${indice}`}
                    className="polaria-text-body-sm inline-flex max-w-full items-center gap-1.5 rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-2.5 py-1"
                  >
                    <Paperclip
                      className="h-3.5 w-3.5 shrink-0 text-polaria-w-50"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="min-w-0 break-all">{nombre}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="polaria-text-body-sm">{SIN_DATO}</span>
            )}
          </dd>
        </dl>

        <section className="border-t border-polaria-w-08 pt-4">
          <h3 className="polaria-text-body-sm font-semibold text-polaria-w-50">
            Datos de n8n
          </h3>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Campo etiqueta="ID del mensaje" tecnico>
              {fila.messageId}
            </Campo>
            <Campo etiqueta="ID del hilo" tecnico>
              {dato(fila.hilo)}
            </Campo>
            <Campo etiqueta="Registro en n8n" tecnico>
              {dato(fila.idRegistro)}
            </Campo>
            <Campo etiqueta="Registrado en n8n">
              {formatearFechaCompleta(fila.registradoEn)}
            </Campo>
            <Campo etiqueta="Última actualización">
              {formatearFechaCompleta(fila.actualizadoEn)}
            </Campo>
          </dl>
        </section>
      </div>
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
                      <AdjuntosResumen valor={fila.adjunto} />
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
