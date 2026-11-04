import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOrdenVenta } from "../../shared/services/sales.service";
import { uploadOvAdjuntosClient } from "../services/ov-adjuntos.client";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { crearBorradorDesdeDocs } from "./crear-borrador-desde-docs";

vi.mock("../../shared/services/sales.service", () => ({
  createOrdenVenta: vi.fn(),
}));
vi.mock("../services/ov-adjuntos.client", () => ({
  uploadOvAdjuntosClient: vi.fn(),
}));

const renglones = [{ Producto: "Aguacate", Cantidad: 10 }];

function estado(parcial: Record<string, unknown> = {}) {
  const acciones = {
    setOrigenAdjuntos: vi.fn(),
    setOrigenArchivoFiles: vi.fn(),
    setPendingEmitId: vi.fn(),
    setEditingEstado: vi.fn(),
    onCreated: vi.fn(),
    onOrdenIdReady: vi.fn(),
  };
  const base = {
    editingId: "",
    pendingEmitId: null,
    codigoCuenta: "demo",
    activeBodegaId: "bod-1",
    idCreador: "u1",
    origenAdjuntos: [],
    origenArchivoFiles: [] as File[],
    ...acciones,
    ...parcial,
  };
  return { estado: base as unknown as OrdenVentaFormEstado, acciones };
}

const params = { origenRows: renglones, textoOrigen: "Pedido de la semana", idComprador: "c1" };

describe("crearBorradorDesdeDocs (REQ-199)", () => {
  beforeEach(() => {
    vi.mocked(createOrdenVenta).mockReset();
    vi.mocked(uploadOvAdjuntosClient).mockReset();
  });

  it("crea la OV como borrador con el origen y avisa su id para poder abrir Cypher", async () => {
    vi.mocked(createOrdenVenta).mockResolvedValue({ idOrdenVenta: "ov-7" } as never);
    const { estado: e, acciones } = estado();

    const aviso = await crearBorradorDesdeDocs(e, params);

    expect(aviso).toBeNull();
    expect(createOrdenVenta).toHaveBeenCalledWith({
      codigoCuenta: "demo",
      idBodega: "bod-1",
      idComprador: "c1",
      lineas: [],
      origenTexto: "Pedido de la semana",
      origenArchivos: [],
      origenCorreo: renglones,
      guardarAvance: true,
      idCreador: "u1",
    });
    expect(acciones.setPendingEmitId).toHaveBeenCalledWith("ov-7");
    expect(acciones.setEditingEstado).toHaveBeenCalledWith("por_confirmar");
    expect(acciones.onOrdenIdReady).toHaveBeenCalledWith("ov-7");
    expect(acciones.onCreated).toHaveBeenCalledOnce();
  });

  it("sube primero los archivos y guarda sus adjuntos en el borrador", async () => {
    const archivo = new File(["x"], "pedido.pdf");
    const adjuntos = [{ nombre: "pedido.pdf" }];
    vi.mocked(uploadOvAdjuntosClient).mockResolvedValue(adjuntos as never);
    vi.mocked(createOrdenVenta).mockResolvedValue({ idOrdenVenta: "ov-8" } as never);
    const { estado: e, acciones } = estado({ origenArchivoFiles: [archivo] });

    await crearBorradorDesdeDocs(e, params);

    expect(uploadOvAdjuntosClient).toHaveBeenCalledWith([archivo], "demo");
    expect(acciones.setOrigenAdjuntos).toHaveBeenCalledWith(adjuntos);
    expect(acciones.setOrigenArchivoFiles).toHaveBeenCalledWith([]);
    expect(createOrdenVenta).toHaveBeenCalledWith(expect.objectContaining({ origenArchivos: adjuntos }));
  });

  it("sin cliente identificado ni renglones, crea el borrador igual (sin esos campos)", async () => {
    vi.mocked(createOrdenVenta).mockResolvedValue({ idOrdenVenta: "ov-9" } as never);
    const { estado: e } = estado();

    await crearBorradorDesdeDocs(e, { origenRows: [], textoOrigen: "", idComprador: "" });

    expect(createOrdenVenta).toHaveBeenCalledWith(
      expect.objectContaining({
        idComprador: undefined,
        origenTexto: undefined,
        origenCorreo: undefined,
      }),
    );
  });

  it("no toca una orden que ya está abierta ni un borrador ya creado", async () => {
    const abierta = estado({ editingId: "ov-1" });
    const conBorrador = estado({ pendingEmitId: "ov-2" });

    expect(await crearBorradorDesdeDocs(abierta.estado, params)).toBeNull();
    expect(await crearBorradorDesdeDocs(conBorrador.estado, params)).toBeNull();
    expect(createOrdenVenta).not.toHaveBeenCalled();
    expect(abierta.acciones.onOrdenIdReady).not.toHaveBeenCalled();
  });

  it("si falla, devuelve un aviso y no deja una orden a medias en el formulario", async () => {
    vi.mocked(createOrdenVenta).mockRejectedValue(new Error("sin conexión"));
    const { estado: e, acciones } = estado();

    const aviso = await crearBorradorDesdeDocs(e, params);

    expect(aviso).toBe("No se pudo preparar Cypher: sin conexión");
    expect(acciones.setPendingEmitId).not.toHaveBeenCalled();
    expect(acciones.onOrdenIdReady).not.toHaveBeenCalled();
    expect(acciones.onCreated).not.toHaveBeenCalled();
  });

  it("si lo que falla no es un Error, usa un aviso genérico", async () => {
    vi.mocked(createOrdenVenta).mockRejectedValue("raro");
    const { estado: e } = estado();

    expect(await crearBorradorDesdeDocs(e, params)).toBe(
      "No se pudo preparar Cypher con el archivo leído.",
    );
  });
});
