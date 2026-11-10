"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useAuthStore } from "@/stores/auth.store";
import { resolveCapturaOrdenOrigin } from "@/modules/sales/ordenes/print/resolve-captura-orden-origin";
import {
  formatearFechaDespacho,
  renderDespachoQrPdf,
  urlDespachoConCuenta,
} from "@/modules/sales/ordenes/despacho/despacho-qr-pdf";

export default function ImprimirDespachoPage() {
  const hidratada = useAuthStore((s) => s.isHydrated);
  const codigoCuenta = useAuthStore(
    (s) => s.session?.codigoCuenta ?? s.context?.codigoCuenta ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [montada, setMontada] = useState(false);

  useEffect(() => {
    setMontada(true);
  }, []);

  async function generar() {
    const cuenta = codigoCuenta.trim();
    if (!cuenta) return;
    const origin = resolveCapturaOrdenOrigin();
    if (!origin) {
      setError("No se pudo armar el enlace del código.");
      return;
    }
    setGenerando(true);
    setError(null);
    try {
      const url = urlDespachoConCuenta(origin, cuenta);
      const qrDataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 800,
        color: { dark: "#000000", light: "#ffffff" },
      });
      const doc = renderDespachoQrPdf({
        fecha: formatearFechaDespacho(new Date()),
        qrDataUrl,
      });
      doc.save("despachos.pdf");
    } catch {
      setError("No se pudo generar el PDF.");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <main className="min-h-screen bg-polaria-bg px-4 py-8 text-polaria-w">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <h1 className="polaria-text-card-title">Código de despacho</h1>
        {!montada || !hidratada ? (
          <p className="polaria-text-subtitle">Cargando la sesión…</p>
        ) : codigoCuenta.trim() ? (
          <button
            type="button"
            className="rounded-xl bg-polaria-teal px-4 py-3 font-semibold text-polaria-on-teal hover:opacity-90 disabled:opacity-40"
            disabled={generando}
            onClick={() => void generar()}
          >
            Generar PDF
          </button>
        ) : (
          <p className="polaria-text-body" role="alert">
            Esta sesión no tiene una cuenta para imprimir el código.
          </p>
        )}
        {error ? (
          <p className="polaria-text-body" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
