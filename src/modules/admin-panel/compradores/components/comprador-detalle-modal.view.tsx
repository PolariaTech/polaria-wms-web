"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaStatusLoading } from "@/components/shared/status/PolariaStatusLoading";
import { PolariaTableCode } from "@/components/shared/table/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  getCompradorAdmin,
  type CompradorDetalleRow,
  type CompradorListRow,
} from "../services/compradores.service";
import {
  listCompradorProductoAliasAdmin,
  type CompradorProductoAliasListRow,
} from "../services/comprador-producto-alias.service";
import {
  displayAltaValue,
  emptyCompradorAltaFicha,
  type CompradorAltaFicha,
} from "../utils/comprador-alta";
import { CompradorEquivalenciasTable } from "./CompradorEquivalenciasTable";
import { CompradorModalTabs } from "./CompradorModalTabs";

interface CompradorDetalleModalProps {
  open: boolean;
  comprador: CompradorListRow | null;
  onClose: () => void;
}

type DetalleTab = "informacion" | "equivalencia";

const DETALLE_TABS = [
  { id: "informacion" as const, label: "Información" },
  { id: "equivalencia" as const, label: "Equivalencia" },
];

import { CompradorDetalleInformacionPanel } from "./comprador-detalle-modal.informacion";

export function CompradorDetalleModal({
  open,
  comprador,
  onClose,
}: CompradorDetalleModalProps) {
  const { codigoCuenta } = useCompany();
  const [detalle, setDetalle] = useState<CompradorDetalleRow | null>(null);
  const [equivalencias, setEquivalencias] = useState<
    CompradorProductoAliasListRow[]
  >([]);
  const [activeTab, setActiveTab] = useState<DetalleTab>("informacion");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !comprador) {
      setDetalle(null);
      setEquivalencias([]);
      setActiveTab("informacion");
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!codigoCuenta) {
      setDetalle(null);
      setEquivalencias([]);
      setActiveTab("informacion");
      setError("No se encontró la cuenta activa.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setActiveTab("informacion");

    void Promise.all([
      getCompradorAdmin({
        codigoCuenta,
        idComprador: comprador.idComprador,
      }),
      listCompradorProductoAliasAdmin({
        codigoCuenta,
        idComprador: comprador.idComprador,
      }),
    ])
      .then(([nextDetalle, nextEquivalencias]) => {
        if (cancelled) return;
        setDetalle(nextDetalle);
        setEquivalencias(nextEquivalencias);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setDetalle(null);
        setEquivalencias([]);
        setError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo cargar el detalle del cliente.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, comprador, open]);

  const ficha: CompradorAltaFicha = detalle?.ficha ?? emptyCompradorAltaFicha();
  const telefono = detalle?.telefono?.trim()
    ? formatInternationalPhoneDisplay(detalle.telefono)
    : comprador?.telefono?.trim()
      ? formatInternationalPhoneDisplay(comprador.telefono)
      : "—";

  return (
    <PolariaFormModal
      open={open && Boolean(comprador)}
      onClose={onClose}
      title={comprador?.comprador ?? "Cliente"}
      description={
        comprador
          ? `${comprador.codigo} — ficha de alta del comprador.`
          : undefined
      }
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      error={error}
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="2xl"
      hideHeaderClose
    >
      <CompradorModalTabs
        tabs={DETALLE_TABS}
        active={activeTab}
        onChange={setActiveTab}
      />

      {isLoading ? (
        <PolariaStatusLoading embedded className="py-4" />
      ) : null}

      {!isLoading && activeTab === "informacion" ? (
        <CompradorDetalleInformacionPanel
          detalle={detalle}
          comprador={comprador}
          ficha={ficha}
          telefono={telefono}
        />
      ) : null}

      {!isLoading && activeTab === "equivalencia" ? (
        <div className="flex flex-col gap-3">
          <p className="polaria-text-body-sm text-polaria-w-50">
            Cómo le dice este cliente a cada producto del catálogo.
          </p>
          <CompradorEquivalenciasTable rows={equivalencias} />
        </div>
      ) : null}
    </PolariaFormModal>
  );
}
