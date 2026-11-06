"use client";

import { useEffect, useMemo, useState } from "react";
import { parseCorreoChromeFromText, type CorreoChrome } from "../../utils/origen/correo-chrome";
import {
  mergeOrigenAdjuntosWithEmlParts,
  nombresOrigenAdjuntos,
  origenAdjuntosFromEmlParts,
  parseOrigenArchivos,
  type OrigenAdjunto,
} from "../../utils/origen/origen-adjuntos";
import {
  resolveCuerpoMensajeCompleto,
  resolveCuerpoMensajePreview,
} from "./cypher-drawer-message";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";

export function useCypherDrawerOrigenAdjuntos(orden: OrdenVentaDetalleRow | null) {
  const [emlInnerAdjuntos, setEmlInnerAdjuntos] = useState<OrigenAdjunto[]>([]);
  const [emlChrome, setEmlChrome] = useState<CorreoChrome>({});
  const [emlInnerLoading, setEmlInnerLoading] = useState(false);

  const cuerpoCompleto = useMemo(
    () => (orden ? resolveCuerpoMensajeCompleto(orden) : ""),
    [orden],
  );
  const cuerpoMensaje = useMemo(
    () => (orden ? resolveCuerpoMensajePreview(orden) : ""),
    [orden],
  );

  const correoChrome = useMemo(() => {
    const fromText = parseCorreoChromeFromText(cuerpoCompleto || cuerpoMensaje);
    return {
      from: fromText.from || emlChrome.from,
      to: fromText.to || emlChrome.to,
      subject: fromText.subject || emlChrome.subject,
      body: fromText.body,
    };
  }, [cuerpoCompleto, cuerpoMensaje, emlChrome.from, emlChrome.to, emlChrome.subject]);

  const origenAdjuntosStored = useMemo(() => {
    if (!orden) return [];
    return parseOrigenArchivos(orden.origen_archivos);
  }, [orden]);

  useEffect(() => {
    const eml = origenAdjuntosStored.find((item) => {
      const name = item.nombre.toLowerCase();
      const mime = (item.mime ?? "").toLowerCase();
      return (
        Boolean(item.path?.trim()) && (name.endsWith(".eml") || mime.includes("message"))
      );
    });
    const emlPath = eml?.path?.trim() || "";
    if (!emlPath) {
      setEmlInnerAdjuntos([]);
      setEmlChrome({});
      setEmlInnerLoading(false);
      return;
    }

    let cancelled = false;
    setEmlInnerLoading(true);
    void fetch(`/api/ov-adjuntos/eml-parts?path=${encodeURIComponent(emlPath)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("No se pudieron leer adjuntos del correo.");
        }
        const data = (await response.json()) as {
          parts?: Array<{
            index: number;
            nombre: string;
            mime: string;
            bytes: number;
          }>;
          from?: string | null;
          to?: string | null;
          subject?: string | null;
        };
        if (cancelled) return;
        setEmlInnerAdjuntos(origenAdjuntosFromEmlParts(emlPath, data.parts ?? []));
        setEmlChrome({
          from: data.from?.trim() || undefined,
          to: data.to?.trim() || undefined,
          subject: data.subject?.trim() || undefined,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setEmlInnerAdjuntos([]);
          setEmlChrome({});
        }
      })
      .finally(() => {
        if (!cancelled) setEmlInnerLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [origenAdjuntosStored]);

  const origenAdjuntos = useMemo(
    () => mergeOrigenAdjuntosWithEmlParts(origenAdjuntosStored, emlInnerAdjuntos),
    [emlInnerAdjuntos, origenAdjuntosStored],
  );

  const origenNombres = useMemo(() => nombresOrigenAdjuntos(origenAdjuntos), [origenAdjuntos]);

  return {
    cuerpoCompleto,
    cuerpoMensaje,
    correoChrome,
    origenAdjuntosStored,
    emlInnerAdjuntos,
    emlInnerLoading,
    origenAdjuntos,
    origenNombres,
  };
}
