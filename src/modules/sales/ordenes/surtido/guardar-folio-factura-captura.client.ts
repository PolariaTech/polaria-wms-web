import { createElement, useEffect, useRef, useState, type ChangeEvent } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { requireCodigoCuenta, runDomainMutation } from "@/lib/supabase/domain-query";
import { normalizeIdOrdenTrabajo } from "../utils/origen/origen-correo-ordenes-trabajo";
import {
  FOLIO_FACTURA_ACTUALIZADO,
  escribirFolioFactura,
  leerFolioFactura,
} from "./folio-factura-captura";
import { listOrdenSurtidoCapturasClient } from "./list-orden-surtido-capturas.client";
import type {
  OrdenSurtidoCapturaPayload,
  OrdenSurtidoCapturaRow,
} from "./orden-surtido.types";

export async function guardarFolioFacturaCapturaClient(input: {
  codigoCuenta: string;
  idOrdenVenta: string;
  idOrdenTrabajo: string;
  folio: string;
  payloadActual: OrdenSurtidoCapturaPayload | null;
  urlFoto: string | null;
  modelo: string | null;
}): Promise<OrdenSurtidoCapturaPayload | null> {
  const codigoCuenta = requireCodigoCuenta(input.codigoCuenta);
  const idOrdenVenta = input.idOrdenVenta.trim();
  const idOrdenTrabajo = normalizeIdOrdenTrabajo(input.idOrdenTrabajo);
  if (!idOrdenVenta || !idOrdenTrabajo) return null;

  const folio = input.folio.trim();
  if (!folio && !input.payloadActual) return null;

  const payload = escribirFolioFactura(input.payloadActual, folio);

  await runDomainMutation((client) => {
    const query = client
      .from("orden_venta_surtido_captura")
      .upsert(
        {
          id_orden_venta: idOrdenVenta,
          id_orden_trabajo: idOrdenTrabajo,
          codigo_cuenta: codigoCuenta,
          url_foto: input.urlFoto,
          payload,
          modelo: input.modelo?.trim() || "manual",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id_orden_venta,id_orden_trabajo" },
      )
      .select("id_captura");

    return query as unknown as Promise<{
      data: { id_captura: string }[] | null;
      error: { message: string } | null;
    }>;
  });

  return payload;
}

export function useFolioFacturaEdicion(input: {
  open: boolean;
  activo: boolean;
  codigoCuenta: string | null;
  idOrdenVenta: string | null;
}) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const valoresRef = useRef(valores);
  valoresRef.current = valores;
  const inicialRef = useRef<Record<string, string>>({});
  const capturaRef = useRef<Map<string, OrdenSurtidoCapturaRow>>(new Map());

  useEffect(() => {
    capturaRef.current = new Map();
    inicialRef.current = {};
    setValores({});
  }, [input.open, input.idOrdenVenta]);

  useEffect(() => {
    if (!input.open || !input.activo || !input.codigoCuenta || !input.idOrdenVenta) {
      return;
    }
    let cancelled = false;
    const codigoCuenta = input.codigoCuenta;
    const idOrdenVenta = input.idOrdenVenta;
    void listOrdenSurtidoCapturasClient({ codigoCuenta, idOrdenVenta })
      .then((rows) => {
        if (cancelled) return;
        const map = new Map<string, OrdenSurtidoCapturaRow>();
        const next: Record<string, string> = {};
        for (const row of rows) {
          const id = row.idOrdenTrabajo.trim();
          if (!id || map.has(id)) continue;
          map.set(id, row);
          next[id] = leerFolioFactura(row.payload.campos);
        }
        capturaRef.current = map;
        inicialRef.current = next;
        setValores(next);
      })
      .catch(() => {
        if (cancelled) return;
        capturaRef.current = new Map();
        inicialRef.current = {};
        setValores({});
      });
    return () => {
      cancelled = true;
    };
  }, [input.open, input.activo, input.codigoCuenta, input.idOrdenVenta]);

  async function guardar(idOrdenVenta: string, codigoCuenta: string) {
    let cambio = false;
    for (const [otId, valor] of Object.entries(valoresRef.current)) {
      const next = valor.trim();
      const prev = (inicialRef.current[otId] ?? "").trim();
      if (next === prev) continue;
      const captura = capturaRef.current.get(otId) ?? null;
      const payload = await guardarFolioFacturaCapturaClient({
        codigoCuenta,
        idOrdenVenta,
        idOrdenTrabajo: otId,
        folio: next,
        payloadActual: captura?.payload ?? null,
        urlFoto: captura?.urlFoto ?? null,
        modelo: captura?.modelo ?? null,
      });
      if (!payload) continue;
      cambio = true;
      inicialRef.current = { ...inicialRef.current, [otId]: next };
      capturaRef.current.set(otId, {
        idCaptura: captura?.idCaptura ?? "",
        idOrdenVenta,
        idOrdenTrabajo: otId,
        codigoCuenta,
        urlFoto: captura?.urlFoto ?? null,
        payload,
        modelo: captura?.modelo ?? "manual",
        updatedAt: new Date().toISOString(),
      });
    }
    if (cambio) {
      window.dispatchEvent(
        new CustomEvent(FOLIO_FACTURA_ACTUALIZADO, {
          detail: { idOrdenVenta },
        }),
      );
    }
  }

  return {
    valores,
    setValor(id: string, value: string) {
      setValores((current) => ({ ...current, [id]: value }));
    },
    guardar,
  };
}

export function FolioFacturaCampos({
  ots,
  paginar,
  activa,
  valores,
  onChange,
}: {
  ots: { id: string; label: string }[];
  paginar: boolean;
  activa: { id: string; label: string } | null;
  valores: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  const visibles = paginar && activa ? [activa] : ots.filter((ot) => ot.id.trim());
  return createElement(
    "div",
    { className: "contents" },
    visibles.map((ot) =>
      createElement(PolariaFormInput, {
        key: ot.id,
        id: `orden-venta-folio-factura-${ot.id}`,
        label: visibles.length > 1 ? `Folio de factura · ${ot.label}` : "Folio de factura",
        value: valores[ot.id] ?? "",
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          onChange(ot.id, event.target.value),
        placeholder: "Opcional",
        hint: "Opcional. Se muestra en el detalle de la orden de trabajo.",
        compact: true,
      }),
    ),
  );
}
