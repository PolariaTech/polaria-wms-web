import { useCallback } from "react";
import { withCuentaSchema } from "@/lib/supabase/cuenta-schema";
import { useCompany } from "@/providers/tenant/CompanyProvider";

export type AdminMaestroViewMode = "manage" | "inspect";

export interface AdminMaestroViewProps {
  /** Si viene, lista esa cuenta (configurador) en lugar de la sesión tenant. */
  codigoCuenta?: string;
  /** inspect = solo lectura, sin altas ni toggles. */
  mode?: AdminMaestroViewMode;
}

export function useAdminMaestroScope({
  codigoCuenta: codigoCuentaProp,
  mode = "manage",
}: AdminMaestroViewProps = {}) {
  const company = useCompany();
  const codigoCuenta = (codigoCuentaProp ?? company.codigoCuenta)?.trim() || null;
  const inspect = mode === "inspect";
  const needsSchemaWrap = Boolean(codigoCuentaProp?.trim());

  const runScoped = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      if (!codigoCuenta) {
        return fn();
      }
      if (needsSchemaWrap) {
        return withCuentaSchema(codigoCuenta, fn);
      }
      return fn();
    },
    [codigoCuenta, needsSchemaWrap],
  );

  return { codigoCuenta, inspect, runScoped };
}
