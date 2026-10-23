"use client";

import { useEffect, useState } from "react";
import { getCompradorAdmin } from "@/modules/admin-panel";
import type { CompradorAltaFicha } from "@/modules/admin-panel/compradores/utils/comprador-alta";

function FiscalField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-polaria-w-08 bg-polaria-bg/40 px-3 py-2.5">
      <p className="polaria-text-caption font-medium text-polaria-w-50">
        {label}
      </p>
      <p className="mt-0.5 break-words polaria-text-body-sm text-polaria-w">
        {value.trim() || "—"}
      </p>
    </div>
  );
}

interface CypherDatosFiscalesSectionProps {
  codigoCuenta: string | null;
  idComprador: string | null | undefined;
}

/** Referencia fiscal del cliente (solo lectura) — etapa 00 de Cypher. */
export function CypherDatosFiscalesSection({
  codigoCuenta,
  idComprador,
}: CypherDatosFiscalesSectionProps) {
  const [ficha, setFicha] = useState<CompradorAltaFicha | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cuenta = codigoCuenta?.trim() || "";
    const id = idComprador?.trim() || "";
    if (!cuenta || !id) {
      setFicha(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void getCompradorAdmin({ codigoCuenta: cuenta, idComprador: id })
      .then((detalle) => {
        if (cancelled) return;
        setFicha(detalle.ficha);
      })
      .catch(() => {
        if (cancelled) return;
        setFicha(null);
        setError("No se pudo cargar la ficha fiscal del cliente.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [codigoCuenta, idComprador]);

  if (!idComprador?.trim()) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
        Selecciona un cliente en el pedido para ver su ficha fiscal.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="mt-3 polaria-text-body-sm text-polaria-w-50">Cargando…</p>
    );
  }

  if (error) {
    return (
      <p
        role="alert"
        className="mt-3 rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 polaria-text-body-sm text-polaria-danger"
      >
        {error}
      </p>
    );
  }

  if (!ficha) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50">
        Sin ficha fiscal para este cliente.
      </p>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <FiscalField label="Razón social" value={ficha.razonSocial} />
      <FiscalField label="RFC" value={ficha.rfc} />
      <FiscalField label="Régimen" value={ficha.regimen} />
      <FiscalField label="CP fiscal" value={ficha.cpFiscal} />
      <FiscalField label="Uso CFDI" value={ficha.usoCfdi} />
      <FiscalField label="Método de pago" value={ficha.metodoPago} />
      <FiscalField label="Forma de pago" value={ficha.formaPago} />
      <FiscalField label="Correos CFDI" value={ficha.correosCfdi} />
    </div>
  );
}
