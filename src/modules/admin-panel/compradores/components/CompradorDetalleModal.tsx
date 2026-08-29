"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaTableCode } from "@/components/shared/table/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import type { CompradorListRow } from "../services/compradores.service";
import {
  listCompradorProductoAliasAdmin,
  type CompradorProductoAliasListRow,
} from "../services/comprador-producto-alias.service";

interface CompradorDetalleModalProps {
  open: boolean;
  comprador: CompradorListRow | null;
  onClose: () => void;
}

function MetaField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="polaria-text-label text-polaria-w-20">{label}</p>
      <div className="mt-1 polaria-text-body-sm font-medium text-polaria-w">
        {children}
      </div>
    </div>
  );
}

export function CompradorDetalleModal({
  open,
  comprador,
  onClose,
}: CompradorDetalleModalProps) {
  const { codigoCuenta } = useCompany();
  const [aliases, setAliases] = useState<CompradorProductoAliasListRow[]>([]);
  const [isLoadingAliases, setIsLoadingAliases] = useState(false);
  const [aliasError, setAliasError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !comprador) {
      setAliases([]);
      setAliasError(null);
      setIsLoadingAliases(false);
      return;
    }

    if (!codigoCuenta) {
      setAliases([]);
      setAliasError("No se encontró la cuenta activa.");
      setIsLoadingAliases(false);
      return;
    }

    let cancelled = false;
    setIsLoadingAliases(true);
    setAliasError(null);
    setAliases([]);

    void listCompradorProductoAliasAdmin({
      codigoCuenta,
      idComprador: comprador.idComprador,
    })
      .then((rows) => {
        if (cancelled) return;
        setAliases(rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setAliasError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudieron cargar los alias.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAliases(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, comprador, open]);

  const telefono = comprador?.telefono?.trim()
    ? formatInternationalPhoneDisplay(comprador.telefono)
    : "—";

  return (
    <PolariaFormModal
      open={open && Boolean(comprador)}
      onClose={onClose}
      sectionLabel="Detalle"
      title={comprador?.comprador ?? "Comprador"}
      description={
        comprador
          ? `${comprador.codigo} — datos del comprador y alias de producto.`
          : undefined
      }
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      error={aliasError}
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetaField label="Código">
          <PolariaTableCode>{comprador?.codigo ?? "—"}</PolariaTableCode>
        </MetaField>
        <MetaField label="Comprador">{comprador?.comprador ?? "—"}</MetaField>
        <MetaField label="Teléfono">{telefono}</MetaField>
      </div>

      <section>
        <h3 className="polaria-text-label text-polaria-teal">
          Alias de producto
        </h3>

        {isLoadingAliases ? (
          <p className="mt-3 polaria-text-body-sm text-polaria-w-50">
            Cargando alias…
          </p>
        ) : aliases.length === 0 && !aliasError ? (
          <p className="mt-3 polaria-text-body-sm text-polaria-w-50">
            Este comprador no tiene alias registrados.
          </p>
        ) : aliases.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-polaria-w-08">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[46%]" />
                <col className="w-[30%]" />
              </colgroup>
              <thead className="bg-polaria-t-08">
                <tr className="border-b border-polaria-t-20">
                  <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                    Código
                  </th>
                  <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                    Producto
                  </th>
                  <th className="px-3 py-2.5 text-left polaria-text-caption font-medium text-polaria-w-50">
                    Alias
                  </th>
                </tr>
              </thead>
              <tbody>
                {aliases.map((row) => (
                  <tr
                    key={row.idAlias}
                    className="border-b border-polaria-w-08 last:border-b-0"
                  >
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm font-medium text-polaria-teal">
                      {row.codigoProducto}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm text-polaria-w">
                      {row.nombreProducto}
                    </td>
                    <td className="px-3 py-2.5 align-middle polaria-text-body-sm font-medium text-polaria-w">
                      {row.alias}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </PolariaFormModal>
  );
}
