import Link from "next/link";
import { ROUTES } from "@/config/routes";
import { CapturaEstadoIcono } from "./CapturaEstadoIcono";
import type { EstadoRegistro } from "./captura-sesion";

export interface HojaAnterior {
  idOrdenVenta: string;
  idOrdenTrabajo: string;
  folio: string;
  /** «OT 2/9», para distinguir las hojas de una misma OV. */
  etiqueta?: string;
  estado: EstadoRegistro;
}

interface CapturaSesionListaProps {
  hojas: HojaAnterior[];
}

const TEXTO_ESTADO: Record<EstadoRegistro, string> = {
  subiendo: "Subiendo",
  procesando: "Procesando",
  lista: "Lista",
  fallo: "No se subió",
};

const FILA =
  "flex min-h-11 items-center gap-3 rounded-xl border px-3 py-1.5 polaria-text-body-sm";

/**
 * Últimas hojas fotografiadas en este celular. Una que falló lleva a su
 * página para repetirla; así el aviso no se pierde al escanear la siguiente.
 */
export function CapturaSesionLista({ hojas }: CapturaSesionListaProps) {
  if (hojas.length === 0) return null;

  return (
    <section aria-label="Hojas anteriores" className="space-y-2">
      <p className="polaria-text-caption text-polaria-w-50">Hojas anteriores</p>
      <ul className="space-y-2">
        {hojas.map((hoja) => {
          const contenido = (
            <>
              <CapturaEstadoIcono estado={hoja.estado} tamano="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-polaria-w">
                  {hoja.folio}
                </span>
                {hoja.etiqueta ? (
                  <span className="block truncate text-xs text-polaria-w-50">
                    {hoja.etiqueta}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-polaria-w-50">
                {TEXTO_ESTADO[hoja.estado]}
              </span>
            </>
          );

          if (hoja.estado === "fallo") {
            return (
              <li key={`${hoja.idOrdenVenta}|${hoja.idOrdenTrabajo}`}>
                <Link
                  href={ROUTES.capturaOrden(hoja.idOrdenVenta, hoja.idOrdenTrabajo)}
                  aria-label={`${hoja.folio}${hoja.etiqueta ? ` ${hoja.etiqueta}` : ""}: no se subió. Repetir la foto`}
                  className={`${FILA} border-polaria-danger-border bg-polaria-danger-bg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-polaria-danger`}
                >
                  {contenido}
                </Link>
              </li>
            );
          }

          return (
            <li
              key={`${hoja.idOrdenVenta}|${hoja.idOrdenTrabajo}`}
              className={`${FILA} border-polaria-t-20 bg-polaria-t-08`}
            >
              {contenido}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
