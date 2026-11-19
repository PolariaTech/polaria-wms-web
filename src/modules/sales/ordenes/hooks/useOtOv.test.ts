import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
import { leerPedidoConIaApi } from "../services/sales-ai.api";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { crearBorradorDesdeDocs } from "./crear-borrador-desde-docs";
import { abrirFormularioDesdeDocs } from "./useOtOv";

vi.mock("../services/sales-ai.api", () => ({ leerPedidoConIaApi: vi.fn() }));
vi.mock("./crear-borrador-desde-docs", () => ({ crearBorradorDesdeDocs: vi.fn() }));
vi.mock("@/modules/admin-panel", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/admin-panel")>();
  return { ...actual, getCompradorAdmin: vi.fn().mockResolvedValue({ ficha: null }) };
});

describe("abrirFormularioDesdeDocs", () => {
  it("sin cuenta avisa y no llama a Mateo", async () => {
    const setError = vi.fn();
    const setIsReadingIa = vi.fn();
    const ensureFormDataReady = vi.fn();

    await abrirFormularioDesdeDocs({
      codigoCuenta: "",
      origenTexto: "pedido",
      origenArchivoFiles: [],
      setError,
      setIsReadingIa,
      ensureFormDataReady,
    });

    expect(setError).toHaveBeenCalledWith("No hay cuenta activa.");
    expect(setIsReadingIa).not.toHaveBeenCalled();
    expect(ensureFormDataReady).not.toHaveBeenCalled();
  });

  it("sin texto ni archivos pide el pedido antes de leer", async () => {
    const setError = vi.fn();
    const ensureFormDataReady = vi.fn();

    await abrirFormularioDesdeDocs({
      codigoCuenta: "demo",
      origenTexto: "   ",
      origenArchivoFiles: [],
      setError,
      ensureFormDataReady,
    });

    expect(setError).toHaveBeenCalledWith(
      "Pega el texto del pedido o adjunta al menos un archivo.",
    );
    expect(ensureFormDataReady).not.toHaveBeenCalled();
  });

  it("si el catálogo no está listo no empieza a leer", async () => {
    const setIsReadingIa = vi.fn();
    const ensureFormDataReady = vi.fn().mockResolvedValue(false);

    await abrirFormularioDesdeDocs({
      codigoCuenta: "demo",
      origenTexto: "10 kg de aguacate",
      origenArchivoFiles: [],
      setError: vi.fn(),
      setIsReadingIa,
      ensureFormDataReady,
    });

    expect(ensureFormDataReady).toHaveBeenCalledOnce();
    expect(setIsReadingIa).not.toHaveBeenCalled();
  });
});

describe("abrirFormularioDesdeDocs — borrador al leer (REQ-199)", () => {
  const pedido = {
    fechaEntrega: "2026-11-05",
    centroConsumo: null,
    observaciones: null,
    ordenCompraHotel: null,
    nombreCliente: null,
    lineas: [],
    origenCorreo: [],
    advertencia: null,
    archivosNoLegibles: [],
    textoOrigen: "Pedido del hotel",
  };

  /** Estado con los datos que la lectura consulta y un espía por cada setter. */
  function estadoLectura(extra: Record<string, unknown> = {}) {
    const espias: Record<string, ReturnType<typeof vi.fn>> = {};
    const datos: Record<string, unknown> = {
      codigoCuenta: "demo",
      origenTexto: "10 kg de aguacate",
      origenArchivoFiles: [],
      compradorLabel: "",
      compradores: [],
      idComprador: "",
      selectedCompradorIdRef: { current: "" },
      ensureFormDataReady: vi.fn().mockResolvedValue(true),
      bootstrapPromiseRef: { current: Promise.resolve(null) },
      productos: [],
      fichaComprador: null,
      ...extra,
      anden: "",
      centroConsumo: "",
      contacto: "",
      correo: "",
      direccion: "",
      observaciones: "",
      telefono: "",
      ventanaDesde: "",
      ventanaHasta: "",
      fechaEntrega: "",
      ordenCompraHotel: "",
      aceptaSustituciones: "",
      requiereLote: "",
      registrarTemperatura: "",
      autoFields: new Set<string>(),
      warnFields: new Set<string>(),
    };
    const estado = new Proxy(datos, {
      get: (destino, clave: string) => (clave in destino ? destino[clave] : (espias[clave] ??= vi.fn())),
    }) as unknown as OrdenVentaFormEstado;
    return { estado, espias };
  }

  beforeEach(() => {
    vi.mocked(leerPedidoConIaApi).mockReset();
    vi.mocked(crearBorradorDesdeDocs).mockReset();
  });

  it("tras leer el pedido crea el borrador con el origen y el texto ya limpio", async () => {
    vi.mocked(leerPedidoConIaApi).mockResolvedValue(pedido as never);
    vi.mocked(crearBorradorDesdeDocs).mockResolvedValue(null);
    const { estado, espias } = estadoLectura();

    await abrirFormularioDesdeDocs(estado);

    expect(crearBorradorDesdeDocs).toHaveBeenCalledOnce();
    // solo los parámetros: el estado simulado es un Proxy y no se compara por igualdad
    expect(vi.mocked(crearBorradorDesdeDocs).mock.calls[0]?.[1]).toEqual({
      origenRows: [],
      textoOrigen: "Pedido del hotel",
      idComprador: "",
    });
    expect(espias.setOrigenTexto).toHaveBeenCalledWith("Pedido del hotel");
    expect(espias.setStep).toHaveBeenCalledWith("form");
    expect(espias.setIsReadingIa).toHaveBeenLastCalledWith(false);
  });

  it("si no se pudo crear el borrador, el aviso se suma a los del formulario y se sigue", async () => {
    vi.mocked(leerPedidoConIaApi).mockResolvedValue(pedido as never);
    vi.mocked(crearBorradorDesdeDocs).mockResolvedValue("No se pudo preparar Cypher: sin conexión");
    const { estado, espias } = estadoLectura();

    await abrirFormularioDesdeDocs(estado);

    expect(espias.setError).toHaveBeenLastCalledWith(
      expect.stringContaining("No se pudo preparar Cypher: sin conexión"),
    );
    expect(espias.setStep).toHaveBeenCalledWith("form");
  });

  it("REQ-326: con compradores stale [] usa el bootstrap (D. Comercial / apodo)", async () => {
    const fairmont: CompradorListRow = {
      idComprador: "c-fairmont",
      codigo: "2010010999",
      comprador: "OPERADORA HOTELERA DE CANCUN SA DE CV",
      apodo: "FAIRMONT MAYAKOBA",
      denominacionComercialOverride: "",
      telefono: null,
      rfc: "OHC010101AAA",
      grupo: "",
      estaActivo: true,
    };
    vi.mocked(leerPedidoConIaApi).mockResolvedValue({
      ...pedido,
      nombreCliente: "Fairmont Mayakoba",
    } as never);
    vi.mocked(crearBorradorDesdeDocs).mockResolvedValue(null);
    const handleSelectComprador = vi.fn();
    const { estado } = estadoLectura({
      compradores: [],
      bootstrapPromiseRef: {
        current: Promise.resolve({ compradores: [fairmont], productos: [] }),
      },
      handleSelectComprador,
    });

    await abrirFormularioDesdeDocs(estado);

    expect(handleSelectComprador).toHaveBeenCalledWith(
      expect.objectContaining({ idComprador: "c-fairmont" }),
      expect.any(Object),
    );
  });
});
