"use client";

import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { getTableBodyMinHeightStyle } from "@/components/shared/table/polaria-table-layout";
import { PolariaTablePaginationFooter } from "@/components/shared/table/PolariaTablePaginationFooter";
import { TABLA_COMPACTA_PANTALLA_BAJA } from "@/components/shared/table/tabla-compacta";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils/cn";
import { useCorreosIngreso } from "../hooks/useCorreosIngreso";
import { useUltimoCorreoAbierto } from "../hooks/useUltimoCorreoAbierto";
import type { ModoCorreos } from "../types/correos.types";
import { guardarRecorrido } from "../utils/recorrido-correos";
import { BOTON_SECUNDARIO } from "./AccionIngreso";
import { CorreosCuerpoTabla } from "./CorreosCuerpoTabla";
import { CorreosFiltros } from "./CorreosFiltros";

const TEXTOS_VACIO: Record<ModoCorreos, { sinFiltros: string; conFiltros: string }> = {
  todos: {
    sinFiltros: "Todavía no hay correos registrados.",
    conFiltros: "Ningún correo coincide con los filtros.",
  },
  descartados: {
    sinFiltros: "No hay correos descartados por revisar.",
    conFiltros: "Ningún correo descartado coincide con los filtros.",
  },
  procesados: {
    sinFiltros: "Todavía no hay correos procesados.",
    conFiltros: "Ningún correo procesado coincide con los filtros.",
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
  abierto: string | null;
  onVerDetalle: (messageId: string) => void;
  onIngresar: (messageId: string) => void;
}

/** Lo que va bajo los filtros: el error, la primera carga, o la tabla con su paginación. */
function ContenidoDeLista({
  correos,
  primeraCarga,
  textoVacio,
  abierto,
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
        abierto={abierto}
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
 * Lista de correos de pedidos (REQ-104 / REQ-317): filtros, tabla y paginación. El clic de
 * una fila abre el correo completo en esta pestaña; «Ingresar como OV» no navega.
 */
export function CorreosTable({ modo }: { modo: ModoCorreos }) {
  const router = useRouter();
  const correos = useCorreosIngreso(modo);
  const { abierto, marcarAbierto } = useUltimoCorreoAbierto();

  const primeraCarga = correos.cargando && correos.filas.length === 0;
  const alIngresar = (messageId: string) => void correos.ingresar(messageId);
  const verDetalle = (id: string) => {
    marcarAbierto(id);
    if (correos.idsDelBloque.length > 0) {
      guardarRecorrido({ modo, ids: correos.idsDelBloque });
    }
    router.push(ROUTES.dashboardVentasCorreo(id));
  };
  const textos = TEXTOS_VACIO[modo];

  return (
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
        abierto={abierto}
        onVerDetalle={verDetalle}
        onIngresar={alIngresar}
      />
    </section>
  );
}
