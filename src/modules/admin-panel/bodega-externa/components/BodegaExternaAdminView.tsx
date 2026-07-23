"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { cn } from "@/lib/utils/cn";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  BODEGA_EXTERNA_PAGE_HINT,
  BODEGA_EXTERNA_PAGE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import {
  formatBodegaExternaId,
  listBodegasExternasVinculadasAdmin,
} from "../services/bodegas-externas-admin.service";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { VincularBodegaExternaModal } from "./VincularBodegaExternaModal";

export function BodegaExternaAdminView() {
  const { codigoCuenta } = useCompany();
  const [isLinkOpen, setIsLinkOpen] = useState(false);

  const fetchVinculadas = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listBodegasExternasVinculadasAdmin({ codigoCuenta });
  }, [codigoCuenta]);

  const { data, isLoading, error, reload } = useAsyncQuery(
    fetchVinculadas,
    Boolean(codigoCuenta),
  );

  const vinculadas = data ?? [];

  return (
    <AdminCatalogListShell
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={BODEGA_EXTERNA_PAGE_TITLE}
      hint={BODEGA_EXTERNA_PAGE_HINT}
    >
      <section className="polaria-card-glow mx-auto w-full max-w-md rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-5">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="polaria-text-card-title text-polaria-w">
              Infraestructura
            </h2>
            <p className="polaria-text-body-sm mt-2 text-polaria-w-50">
              Bodegas <span className="font-semibold text-polaria-w">externas</span>{" "}
              vinculadas a tu cuenta:{" "}
              <span className="font-semibold text-polaria-teal">
                {isLoading ? "…" : vinculadas.length}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsLinkOpen(true)}
            disabled={!codigoCuenta}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-polaria-teal px-4 py-2.5",
              "polaria-text-body-sm font-medium text-polaria-teal transition hover:bg-polaria-t-08",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
            )}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Vincular otra bodega externa
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-body-sm text-polaria-danger"
          >
            {error}
          </p>
        ) : null}

        {!codigoCuenta ? (
          <p className="mt-6 polaria-text-body-sm text-polaria-w-50">
            No se encontró la cuenta activa.
          </p>
        ) : isLoading ? (
          <p className="mt-6 polaria-text-body-sm text-polaria-w-50">
            Cargando bodegas…
          </p>
        ) : vinculadas.length === 0 ? (
          <p className="mt-6 rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-6 polaria-text-body-sm text-polaria-w-50">
            No hay bodegas externas vinculadas a tu cuenta.
          </p>
        ) : (
          <ul className="mt-6 flex w-full flex-col gap-3">
            {vinculadas.map((bodega) => (
              <li
                key={bodega.idBodega}
                className="w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 p-4"
              >
                <p className="polaria-text-card-title text-polaria-w">
                  {bodega.nombre}
                </p>
                <span className="polaria-text-body-sm mt-1 block text-polaria-w-50">
                  ID: {formatBodegaExternaId(bodega.idBodega)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <VincularBodegaExternaModal
        open={isLinkOpen}
        onClose={() => setIsLinkOpen(false)}
        onLinked={() => {
          void reload();
        }}
      />
    </AdminCatalogListShell>
  );
}
