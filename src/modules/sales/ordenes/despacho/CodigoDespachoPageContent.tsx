"use client";

import { Printer } from "lucide-react";
import { useState } from "react";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { cn } from "@/lib/utils/cn";
import { useAdminMaestroScope } from "@/modules/admin-panel/shared/hooks/useAdminMaestroScope";
import {
  CodigoDespachoError,
  guardarPdfCodigoDespacho,
} from "./guardar-pdf-codigo-despacho";

const FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg";

/** REQ-306: la hoja con el QR de despacho, dentro de Ventas como las demás herramientas de impresión. */
export function CodigoDespachoPageContent() {
  const { codigoCuenta } = useAdminMaestroScope();
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function descargar() {
    if (!codigoCuenta) return;
    setGenerando(true);
    setError(null);
    try {
      await guardarPdfCodigoDespacho(codigoCuenta);
    } catch (causa: unknown) {
      setError(
        causa instanceof CodigoDespachoError
          ? causa.message
          : "No se pudo generar el PDF. Inténtalo de nuevo.",
      );
    } finally {
      setGenerando(false);
    }
  }

  return (
    <OperationalModuleShell
      title="Código de despacho"
      description="Hoja con el código QR que abre la lista de órdenes alistadas y en alistamiento para despachar."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
    >
      <div className="flex max-w-xl flex-col gap-4">
        <p className="polaria-text-body">
          Imprime la hoja y déjala en el área de despacho. Quien escanee el código ve la lista
          actualizada de la cuenta, sin iniciar sesión.
        </p>
        <div>
          <button
            type="button"
            onClick={() => void descargar()}
            disabled={generando || !codigoCuenta}
            className={cn(
              "polaria-text-body-sm inline-flex min-h-11 items-center gap-2 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 font-medium text-polaria-teal transition-colors hover:bg-polaria-t-20 disabled:opacity-60 [@media(max-height:50rem)]:min-h-9",
              FOCO,
            )}
          >
            <Printer className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {generando ? "Generando PDF…" : "Descargar PDF"}
          </button>
        </div>
        {error ? (
          <p className="polaria-text-body text-polaria-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </OperationalModuleShell>
  );
}
