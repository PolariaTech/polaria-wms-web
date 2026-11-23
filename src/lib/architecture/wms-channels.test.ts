import { describe, expect, it } from "vitest";
import {
  OV_CHANNEL_CONTRACT,
  PROCESSING_CHANNEL_CONTRACT,
  WMS_CHANNEL,
} from "./wms-channels";

describe("wms-channels (frontera híbrida)", () => {
  it("expone los cuatro canales del contrato", () => {
    expect(Object.values(WMS_CHANNEL).sort()).toEqual(["A", "B", "C", "D"]);
  });

  it("OV: listado en Supabase; emitir/cancelar y correos/OT en Nest", () => {
    expect(OV_CHANNEL_CONTRACT.listadoYBorrador).toBe(WMS_CHANNEL.SUPABASE);
    expect(OV_CHANNEL_CONTRACT.emitirYCancelar).toBe(WMS_CHANNEL.NEST);
    expect(OV_CHANNEL_CONTRACT.avanceEstadoPostEmit).toBe(WMS_CHANNEL.NEST);
    expect(OV_CHANNEL_CONTRACT.correosYOt).toBe(WMS_CHANNEL.NEST);
  });

  it("OV: IA e impresión/adjuntos por BFF Next", () => {
    expect(OV_CHANNEL_CONTRACT.leerPedidoIa).toBe(WMS_CHANNEL.NEXT_BFF);
    expect(OV_CHANNEL_CONTRACT.imprimirAdjuntosLog).toBe(WMS_CHANNEL.NEXT_BFF);
  });

  it("Processing: listados scoped y mutaciones solo Nest", () => {
    expect(PROCESSING_CHANNEL_CONTRACT.crearYMutar).toBe(WMS_CHANNEL.NEST);
    expect(PROCESSING_CHANNEL_CONTRACT.listadosScoped).toBe(WMS_CHANNEL.NEST);
    expect(PROCESSING_CHANNEL_CONTRACT.listadosLegacySinScope).toBe(
      WMS_CHANNEL.SUPABASE,
    );
  });

  it("OV: avance post-emit en Nest; surtido QR por BFF", () => {
    expect(OV_CHANNEL_CONTRACT.avanceEstadoPostEmit).toBe(WMS_CHANNEL.NEST);
    expect(OV_CHANNEL_CONTRACT.avanceEstadoSurtidoQr).toBe(
      WMS_CHANNEL.NEXT_BFF,
    );
  });
});
