"use client";

import { RotateCw } from "lucide-react";
import { useState } from "react";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { getTableBodyMinHeightStyle } from "@/components/shared/table/polaria-table-layout";
import { PolariaTablePaginationFooter } from "@/components/shared/table/PolariaTablePaginationFooter";
import { cn } from "@/lib/utils/cn";
import { useCorreosIngreso } from "../hooks/useCorreosIngreso";
import type { ModoCorreos } from "../types/correos.types";
import { BOTON_SECUNDARIO } from "./AccionIngreso";
import { CorreosCuerpoTabla } from "./CorreosCuerpoTabla";
import { CorreosFiltros } from "./CorreosFiltros";
import { DetalleCorreoModal } from "./DetalleCorreoModal";
import { TABLA_COMPACTA_PANTALLA_BAJA } from "@/components/shared/table/tabla-compacta";

const TEXTOS_VACIO: Record<ModoCorreos, { sinFiltros: string; conFiltros: string }> = {
  todos: {
    sinFiltros: "Todavía no hay correos registrados.",
    conFiltros: "Ningún correo coincide con los filtros.",
  },
  descartados: {
    sinFiltros: "El flujo no ha descartado ningún correo.",
    conFiltros: "Ningún correo descartado coincide con los filtros.",
  },
};

interface EncabezadoListaProps {
  /** `null` mientras se carga por primera vez. */
  total: number | null;
  cargando: boolean;
  onActualizar: () => void;
}

function EncabezadoLista({ total, cargando, onActualizar }: EncabezadoListaProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-polaria-w-08 px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 className="polaria-text-card-title">Lista de correos</h2>
        <p className="polaria-text-caption mt-1 text-polaria-w-50">
          Recibido, remitente, asunto y estado de ingreso.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="polaria-text-body-sm whitespace-nowrap tabular-nums text-polaria-w-50">
          Total: {total ?? "—"}
        </span>
        <button
          type="button"
          onClick={onActualizar}
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
  );
}

function AvisoDeError({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar: () => void;
}) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
      <p className="polaria-text-body-sm text-polaria-danger">{mensaje}</p>
      <button type="button" onClick={onReintentar} className={BOTON_SECUNDARIO}>
        Reintentar
      </button>
    </div>
  );
}

interface ContenidoDeListaProps {
  correos: ReturnType<typeof useCorreosIngreso>;
  primeraCarga: boolean;
  textoVacio: string;
  onVerDetalle: (messageId: string) => void;
  onIngresar: (messageId: string) => void;
}

/** Lo que va bajo los filtros: el error, la primera carga, o la tabla con su paginación. */
function ContenidoDeLista({
  correos,
  primeraCarga,
  textoVacio,
  onVerDetalle,
  onIngresar,
}: ContenidoDeListaProps) {
  if (correos.error) {
    return <AvisoDeError mensaje={correos.error} onReintentar={correos.recargar} />;
  }
  if (primeraCarga) {
    return (
      <div style={getTableBodyMinHeightStyle(correos.tamano)}>
        <PolariaStatusLoading embedded />
      </div>
    );
  }
  return (
    <>
      <CorreosCuerpoTabla
        filas={correos.filas}
        tamano={correos.tamano}
        cargando={correos.cargando}
        textoVacio={textoVacio}
        onVerDetalle={onVerDetalle}
        onIngresar={onIngresar}
      />
      <PolariaTablePaginationFooter
        page={correos.pagina}
        pageSize={correos.tamano}
        totalItems={correos.total}
        onPageChange={correos.setPagina}
      />
    </>
  );
}

/**
 * Lista de correos de pedidos (REQ-104): filtros, tabla y paginación, con la columna que ingresa
 * un correo como OV y el detalle completo en un modal al hacer clic en una fila.
 */
export function CorreosTable({ modo }: { modo: ModoCorreos }) {
  const correos = useCorreosIngreso(modo);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const primeraCarga = correos.cargando && correos.filas.length === 0;
  const alIngresar = (messageId: string) => void correos.ingresar(messageId);
  // Se busca en las filas vigentes: el modal refleja el avance del ingreso y se cierra solo
  // si el correo sale de la página (otra página, otros filtros).
  const detalle = correos.filas.find((fila) => fila.messageId === detalleId) ?? null;
  const textos = TEXTOS_VACIO[modo];

  return (
    <>
      <section
        className={cn(
          "overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08 backdrop-blur-sm",
          TABLA_COMPACTA_PANTALLA_BAJA,
        )}
      >
        <EncabezadoLista
          total={primeraCarga ? null : correos.total}
          cargando={correos.cargando}
          onActualizar={correos.recargar}
        />
        <CorreosFiltros
          filtros={correos.filtros}
          onChange={correos.setFiltro}
          onLimpiar={correos.limpiarFiltros}
          hayFiltros={correos.hayFiltros}
        />
        <ContenidoDeLista
          correos={correos}
          primeraCarga={primeraCarga}
          textoVacio={correos.hayFiltros ? textos.conFiltros : textos.sinFiltros}
          onVerDetalle={setDetalleId}
          onIngresar={alIngresar}
        />
      </section>

      {/* Fuera del <section>: su `backdrop-blur` volvería «relativo» al `fixed` del modal. */}
      {detalle ? (
        <DetalleCorreoModal
          fila={detalle}
          onClose={() => setDetalleId(null)}
          onIngresar={alIngresar}
        />
      ) : null}
    </>
  );
}
