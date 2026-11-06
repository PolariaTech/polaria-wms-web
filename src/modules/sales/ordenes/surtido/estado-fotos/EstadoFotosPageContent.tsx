"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { cn } from "@/lib/utils/cn";
import { useAdminMaestroScope } from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import { EstadoFotosResumen } from "./EstadoFotosResumen";
import { EstadoFotosTabla } from "./EstadoFotosTabla";
import {
  MAX_FILAS_FOTOS,
  RANGO_POR_DEFECTO,
  RANGOS_FOTOS,
  type EstadoFoto,
  type RangoFotos,
} from "./estado-fotos.logic";
import { leerEstadoFotos, type EstadoFotos } from "./estado-fotos.service";

/** Cómo se llama cada estado en los bloques del resumen, para nombrar el filtro activo en el mensaje vacío. */
const ETIQUETA_FILTRO: Record<EstadoFoto, string> = {
  lista: "Listas",
  fallo: "Con fallo",
  procesando: "Procesando",
  recibida: "Recibidas",
};

const FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg";

/** POL-406: cómo va cada foto de captura de surtido. Solo lectura. */
export function EstadoFotosPageContent() {
  const { codigoCuenta } = useAdminMaestroScope();
  const [rango, setRango] = useState<RangoFotos>(RANGO_POR_DEFECTO);
  const [estado, setEstado] = useState<EstadoFoto | null>(null);
  const [datos, setDatos] = useState<EstadoFotos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Sube al pulsar «Actualizar»: vuelve a consultar con los mismos filtros.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!codigoCuenta) return;
    let vigente = true;
    setCargando(true);
    setError(null);
    leerEstadoFotos({ codigoCuenta, rango, estado })
      .then((resultado) => {
        if (vigente) setDatos(resultado);
      })
      .catch((causa: unknown) => {
        if (!vigente) return;
        setError(
          causa instanceof DomainServiceError
            ? causa.message
            : "No se pudieron cargar las fotos.",
        );
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [codigoCuenta, rango, estado, version]);

  const filas = datos?.filas ?? [];
  const hayMas = !!datos && !estado && datos.resumen.total > MAX_FILAS_FOTOS;

  return (
    <OperationalModuleShell
      title="Estado de fotos"
      description="Cómo va cada foto de captura por orden de venta y OT."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
      fitViewport
      compactoEnPantallaBaja
    >
      {/* El módulo ya mide el alto de la ventana: el área de trabajo toma lo que sobra y solo la tabla se desplaza. */}
      <div className="flex min-h-0 flex-col gap-4 lg:flex-1 [@media(max-height:50rem)]:gap-2">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Rango de fechas" className="flex flex-wrap gap-2">
            {RANGOS_FOTOS.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                aria-pressed={rango === opcion.id}
                onClick={() => setRango(opcion.id)}
                className={cn(
                  "polaria-text-body-sm min-h-11 rounded-xl border px-4 font-medium transition-colors [@media(max-height:50rem)]:min-h-9",
                  FOCO,
                  rango === opcion.id
                    ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
                    : "border-polaria-w-20 text-polaria-w-50 hover:bg-polaria-w-08 hover:text-polaria-w",
                )}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setVersion((actual) => actual + 1)}
            disabled={cargando}
            className={cn(
              "polaria-text-body-sm inline-flex min-h-11 items-center gap-2 rounded-xl border border-polaria-w-20 px-4 font-medium text-polaria-w transition-colors hover:bg-polaria-w-08 disabled:opacity-60 [@media(max-height:50rem)]:min-h-9",
              FOCO,
            )}
          >
            <RefreshCw
              className={cn("h-4 w-4", cargando && "animate-spin motion-reduce:animate-none")}
              strokeWidth={1.75}
              aria-hidden
            />
            Actualizar
          </button>
        </div>

        {datos ? (
          <EstadoFotosResumen
            resumen={datos.resumen}
            seleccionado={estado}
            onSeleccionar={setEstado}
          />
        ) : null}

        <div
          aria-busy={cargando}
          className={cn(
            // `relative`: los textos `sr-only` de las celdas son absolutos; sin esto se posicionan
            // contra la página, escapan del recorte del scroll y alargan el documento.
            "polaria-scrollbar relative min-h-[16rem] flex-1 overflow-auto rounded-2xl border border-polaria-w-08 transition-opacity motion-reduce:transition-none lg:min-h-0",
            cargando && datos && "opacity-60",
          )}
        >
          {error ? (
            <div role="alert" className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <p className="polaria-text-body text-polaria-danger">{error}</p>
              <button
                type="button"
                onClick={() => setVersion((actual) => actual + 1)}
                className={cn(
                  "polaria-text-body-sm min-h-11 rounded-xl border border-polaria-w-20 px-4 font-medium text-polaria-w hover:bg-polaria-w-08",
                  FOCO,
                )}
              >
                Reintentar
              </button>
            </div>
          ) : !codigoCuenta ? (
            <p role="status" className="polaria-text-body px-4 py-10 text-center text-polaria-w-50">
              No hay una cuenta activa. Elige una cuenta para ver sus fotos.
            </p>
          ) : !datos ? (
            <p role="status" className="polaria-text-body py-10 text-center text-polaria-w">
              Cargando fotos…
            </p>
          ) : filas.length === 0 ? (
            <p role="status" className="polaria-text-body px-4 py-10 text-center text-polaria-w-50">
              {estado
                ? `No hay fotos «${ETIQUETA_FILTRO[estado]}» en este rango. Pulsa «Todas» para quitar el filtro.`
                : "Todavía no llegaron fotos en este rango."}
            </p>
          ) : (
            <EstadoFotosTabla filas={filas} />
          )}
        </div>

        {/* Anuncia a un lector de pantalla cuántas filas quedaron al cambiar el rango o el estado. */}
        <p className="sr-only" aria-live="polite">
          {datos && !cargando && !error
            ? `${filas.length} ${filas.length === 1 ? "foto" : "fotos"} en la tabla.`
            : ""}
        </p>

        {hayMas ? (
          <p className="polaria-text-body-sm shrink-0 text-polaria-w-50">
            Se muestran las {MAX_FILAS_FOTOS} más recientes de {datos?.resumen.total}. Filtra por
            estado o acorta el rango para ver las demás.
          </p>
        ) : null}
      </div>
    </OperationalModuleShell>
  );
}
