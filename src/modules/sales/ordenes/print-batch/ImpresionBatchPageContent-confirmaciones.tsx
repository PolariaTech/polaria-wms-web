"use client";

import { esperaEntrePartes, partesDe } from "./enviar-paquete";
import { ImpresionBatchConfirmacion } from "./ImpresionBatchConfirmacion";
import { ImpresionRapidaConfirmacion } from "./ImpresionRapidaConfirmacion";
import { hojasPorEnviar } from "./partir-paquete";
import {
  ordenDeImpresion,
  paginasDelResumen,
  type PreviaBatch,
} from "./utilidades-batch";

type ModoEnvio = Parameters<typeof esperaEntrePartes>[0];

export function ImpresionBatchConfirmaciones({
  previa,
  confirmando,
  impresora,
  imprimiendo,
  siguienteParte,
  modoEnvio,
  onClose,
  onConfirm,
}: {
  previa: PreviaBatch | null;
  confirmando: boolean;
  impresora: string | null;
  imprimiendo: boolean;
  siguienteParte: number;
  modoEnvio: ModoEnvio;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (previa?.partes) {
    return (
      <ImpresionRapidaConfirmacion
        open={confirmando}
        hojas={hojasPorEnviar(
          partesDe(previa),
          siguienteParte,
          paginasDelResumen(previa.resumenPdf),
        )}
        orden={partesDe(previa)
          .slice(siguienteParte)
          .flatMap((parte) => parte.resumen)}
        impresora={impresora}
        imprimiendo={imprimiendo}
        partes={partesDe(previa).length - siguienteParte}
        esperaMinutos={esperaEntrePartes(modoEnvio) / 60_000}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
  }

  return (
    <ImpresionBatchConfirmacion
      open={confirmando && Boolean(previa)}
      hojas={previa?.hojas.length ?? 0}
      orden={previa ? ordenDeImpresion(previa) : []}
      impresora={impresora}
      imprimiendo={imprimiendo}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
