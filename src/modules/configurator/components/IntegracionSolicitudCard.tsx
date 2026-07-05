"use client";

import {
  ArrowRight,
  Calendar,
  ClipboardList,
  Fingerprint,
  MapPin,
  User,
} from "lucide-react";
import { formatDateTime } from "@/components/shared/formatters";
import { cn } from "@/lib/cn";
import {
  formatTipoIntegracion,
  isSolicitudIntegracionPendiente,
} from "@/modules/account-integration/constants/integration-types";
import { INTEGRACION_CARD_HINT } from "../constants/integration";
import type { ConfiguratorSolicitudIntegracionRow } from "../services/integracion.service";

interface IntegracionSolicitudCardProps {
  row: ConfiguratorSolicitudIntegracionRow;
}

function MetadataItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-polaria-w-50"
        strokeWidth={1.75}
        aria-hidden
      />
      <p className="min-w-0 polaria-text-body-sm text-polaria-w-50">
        {label}{" "}
        <span className="font-medium text-polaria-w">{value}</span>
      </p>
    </div>
  );
}

export function IntegracionSolicitudCard({
  row,
}: IntegracionSolicitudCardProps) {
  const isPending = isSolicitudIntegracionPendiente(row.estado);
  const tipoLabel = formatTipoIntegracion(row.tipoIntegracion);
  const solicitante =
    row.solicitanteCorreo?.trim() || row.solicitanteNombre?.trim() || "—";

  const content = (
    <>
      <p className="polaria-text-body-sm text-polaria-w-50">
        {INTEGRACION_CARD_HINT}
      </p>

      <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div
          className={cn(
            "flex flex-1 flex-col items-center justify-center rounded-xl border px-4 py-5 text-center",
            "border-[color:var(--aurora-blue)] bg-[var(--aurora-blue)]",
          )}
        >
          <MapPin
            className="mb-2 h-5 w-5 text-polaria-teal"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="polaria-text-badge font-semibold uppercase tracking-wide text-polaria-teal">
            Cuenta
          </span>
          <span className="polaria-text-card-title mt-1 text-polaria-w">
            {row.cuentaNombre}
          </span>
        </div>

        <ArrowRight
          className="mx-auto h-5 w-5 shrink-0 text-polaria-w-50 sm:mx-0"
          strokeWidth={1.75}
          aria-hidden
        />

        <div
          className={cn(
            "flex flex-1 flex-col items-center justify-center rounded-xl border px-4 py-5 text-center",
            "border-polaria-warning-border bg-polaria-warning-bg",
          )}
        >
          <ClipboardList
            className="mb-2 h-5 w-5 text-polaria-warning"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="polaria-text-badge font-semibold uppercase tracking-wide text-polaria-warning">
            Bodega externa
          </span>
          <span className="polaria-text-card-title mt-1 text-polaria-w">
            {row.bodegaNombre}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3">
        <p className="polaria-text-body-sm text-polaria-w-50">
          Tipo:{" "}
          <span className="font-semibold text-polaria-w">{tipoLabel}</span>
        </p>
      </div>

      <div className="mt-5 grid gap-4 border-t border-polaria-w-08 pt-5 lg:grid-cols-3">
        <MetadataItem
          icon={User}
          label="Solicitado por"
          value={solicitante}
        />
        <MetadataItem
          icon={Calendar}
          label="Fecha y hora"
          value={formatDateTime(row.createdAt)}
        />
        <MetadataItem
          icon={Fingerprint}
          label="ID de solicitud"
          value={row.idSolicitudIntegracion}
        />
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "rounded-2xl border bg-polaria-bg p-5",
        isPending
          ? "cursor-pointer border-polaria-t-20 transition hover:border-polaria-teal hover:bg-polaria-t-08"
          : "border-polaria-w-08 opacity-80",
      )}
    >
      {content}
    </article>
  );
}
