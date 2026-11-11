import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadOvAdjuntosClient } from "../services/ov-adjuntos.client";
import { ejecutarPersistenciaEnvio } from "./useEnvioOv";
import { confirmarEnvioOv, useContarProductosOt } from "./confirmar-envio-ov";

vi.mock("../services/ov-adjuntos.client", () => ({
  uploadOvAdjuntosClient: vi.fn(),
}));

vi.mock("./useEnvioOv", () => ({
  ejecutarPersistenciaEnvio: vi.fn(),
}));

function envio(partial: Record<string, unknown> = {}) {
  return {
    isDraft: true,
    codigoCuenta: "demo",
    isEditing: false,
    startMode: "scratch",
    origenTexto: "pedido pegado",
    origenAdjuntos: [{ nombre: "viejo.pdf", path: "viejo.pdf" }],
    origenArchivoFiles: [] as File[],
    setOrigenAdjuntos: vi.fn(),
    setIsSaving: vi.fn(),
    setMateoBusyMessage: vi.fn(),
    setError: vi.fn(),
    lineas: [],
    lineasParsed: [],
    hijasSynced: [],
    fechaEntregaPersist: "2099-01-15",
    bodegaDestinoLabel: "CEDIS (C1)",
    idBodegaDestino: "bd1",
    idComprador: "c1",
    ventanaDesde: "",
    ventanaHasta: "",
    prioridad: "Normal",
    moneda: "MXN",
    ordenCompraHotel: "",
    centroConsumo: "",
    vendedorNombre: "Ana",
    direccion: "",
    entregaLat: null,
    entregaLng: null,
    anden: "",
    contacto: "",
    telefono: "",
    correo: "",
    turno: "",
    horaSalida: "",
    chofer: "",
    unidad: "",
    aceptaSustituciones: "",
    requiereLote: "",
    registrarTemperatura: "",
    origenCorreoDraft: [],
    compradorNombreIa: null,
    compradorLabel: "Hotel Sur",
    observaciones: "",
    idCreador: "u1",
    ...partial,
  };
}

describe("confirmarEnvioOv", () => {
  beforeEach(() => {
    vi.mocked(uploadOvAdjuntosClient).mockReset();
    vi.mocked(ejecutarPersistenciaEnvio).mockReset();
    vi.mocked(ejecutarPersistenciaEnvio).mockResolvedValue(undefined);
  });

  it("si el adjunto no sube avisa y no persiste", async () => {
    vi.mocked(uploadOvAdjuntosClient).mockRejectedValue(new Error("sin red"));
    const input = envio({ origenArchivoFiles: [new File(["a"], "pedido.pdf")] });
    await confirmarEnvioOv(input);
    expect(input.setIsSaving).toHaveBeenNthCalledWith(1, true);
    expect(input.setIsSaving).toHaveBeenLastCalledWith(false);
    expect(input.setError).toHaveBeenCalledWith("sin red");
    expect(ejecutarPersistenciaEnvio).not.toHaveBeenCalled();
  });

  it("sin archivos ni documentos manda el origen vacío y persiste el avance", async () => {
    const input = envio();
    await confirmarEnvioOv(input);
    expect(uploadOvAdjuntosClient).not.toHaveBeenCalled();
    expect(ejecutarPersistenciaEnvio).toHaveBeenCalledOnce();
    const persistido = vi.mocked(ejecutarPersistenciaEnvio).mock.calls[0][0];
    expect(persistido.payload).toEqual(
      expect.objectContaining({
        codigoCuenta: "demo",
        origenTexto: "",
        origenArchivos: [],
        guardarAvance: true,
        vendedor: "Ana",
      }),
    );
    expect(persistido.fechaEntregaPersist).toBe("2099-01-15");
  });
});

describe("useContarProductosOt", () => {
  it("cuenta renglones con producto o código", () => {
    const { result } = renderHook(() => useContarProductosOt());
    expect(
      result.current.countProductosOt({
        renglones: [
          { Producto: "Aguacate" },
          { Producto: "  ", "Codigo producto": "AGU" },
          { Producto: "", "Codigo producto": "" },
        ],
      }),
    ).toBe(2);
  });
});
