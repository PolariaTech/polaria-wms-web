import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCompradorAdmin,
  listCompradorProductoAliasAdmin,
} from "@/modules/admin-panel";
import { fetchUltimosPreciosPorComprador } from "../../shared/services/sales.service";
import type { LineaVentaForm } from "../types/orden-venta-create-modal.types";
import {
  aplicarDetalleExternoPorConfirmar,
  aplicarDetalleSinMateo,
  cargarFichaYPreciosDeComprador,
} from "./cargar-orden-al-abrir";

vi.mock("@/modules/admin-panel", () => ({
  getCompradorAdmin: vi.fn(),
  listCompradorProductoAliasAdmin: vi.fn(),
}));

vi.mock("../../shared/services/sales.service", () => ({
  fetchUltimosPreciosPorComprador: vi.fn(),
}));

const lineaGuardada = {
  idProducto: "p1",
  nombre: "Aguacate",
} as LineaVentaForm;

describe("aplicarDetalleSinMateo", () => {
  it("con órdenes de trabajo abre el formulario y no re-siembra si ya hay líneas", () => {
    const setLineas = vi.fn();
    const setStartMode = vi.fn();
    const setStep = vi.fn();
    const skipOtSeedFromOrigenRef = { current: false };
    aplicarDetalleSinMateo({
      ovMaterializada: true,
      lineasDesdeDetalle: () => [lineaGuardada],
      hijasEdit: [{
        id: "ot-1",
        label: "OT 1",
        numeroPedido: "",
        almacen: "",
        referenciaPedido: "",
        fecha: "",
        responsableExterno: "",
        renglones: [],
        totalCantidad: 0,
      }],
      idCompradorDetalle: "c1",
      nombreEscritoOrigen: "Hotel Norte",
      compradorRows: [],
      skipOtSeedFromOrigenRef,
      setLineas,
      setStartMode,
      setFormOtPage: vi.fn(),
      setStep,
      setCompradorNombreIa: vi.fn(),
      setCompradorLabel: vi.fn(),
      setCompradorSugerencias: vi.fn(),
      setMissingFields: vi.fn(),
    });
    expect(skipOtSeedFromOrigenRef.current).toBe(true);
    expect(setLineas).toHaveBeenCalledWith([lineaGuardada]);
    expect(setStartMode).toHaveBeenCalledWith("docs");
    expect(setStep).toHaveBeenCalledWith("form");
  });

  it("sin cliente en la orden deja la propuesta de Mateo como faltante", () => {
    const setCompradorNombreIa = vi.fn();
    const setMissingFields = vi.fn();
    aplicarDetalleSinMateo({
      ovMaterializada: false,
      lineasDesdeDetalle: () => [],
      hijasEdit: [],
      idCompradorDetalle: "",
      nombreEscritoOrigen: "Hotel Norte",
      compradorRows: [],
      skipOtSeedFromOrigenRef: { current: false },
      setLineas: vi.fn(),
      setStartMode: vi.fn(),
      setFormOtPage: vi.fn(),
      setStep: vi.fn(),
      setCompradorNombreIa,
      setCompradorLabel: vi.fn(),
      setCompradorSugerencias: vi.fn(),
      setMissingFields,
    });
    expect(setCompradorNombreIa).toHaveBeenCalledWith("Hotel Norte");
    const updater = setMissingFields.mock.calls[0][0] as (prev: Set<string>) => Set<string>;
    expect(updater(new Set()).has("cliente")).toBe(true);
  });
});

describe("cargarFichaYPreciosDeComprador", () => {
  beforeEach(() => {
    vi.mocked(getCompradorAdmin).mockReset();
    vi.mocked(listCompradorProductoAliasAdmin).mockReset();
    vi.mocked(fetchUltimosPreciosPorComprador).mockReset();
  });

  it("sin cliente no consulta la ficha", () => {
    cargarFichaYPreciosDeComprador({
      idCompradorDetalle: "",
      codigoCuenta: "demo",
      selectedCompradorIdRef: { current: "" },
      setFichaComprador: vi.fn(),
      setExigeOc: vi.fn(),
      setPrecioOverrideByProducto: vi.fn(),
      setEquivalenciaByProducto: vi.fn(),
    });
    expect(getCompradorAdmin).not.toHaveBeenCalled();
  });

  it("aplica la ficha y el precio solo si el cliente sigue seleccionado", async () => {
    vi.mocked(getCompradorAdmin).mockResolvedValue({
      ficha: {
        centros: [],
        contactos: [],
        moneda: "",
        tolerancia: "",
        vidaUtil: "",
        requiereFicha: "",
        politicaDevolucion: "",
        razonSocial: "",
        apodo: "",
        denominacionComercialOverride: "",
        grupo: "",
        sustituciones: "",
        requiereLote: "",
        requiereTemp: "",
        whatsapp: "",
        exigeOc: "Sí",
      },
    } as never);
    vi.mocked(listCompradorProductoAliasAdmin).mockResolvedValue([
      { idProducto: "p1", precioOverride: 12, alias: "Palta" },
    ] as never);
    vi.mocked(fetchUltimosPreciosPorComprador).mockResolvedValue({ p1: 40 });
    const selectedCompradorIdRef = { current: "c1" };
    const setExigeOc = vi.fn();
    const setPrecioOverrideByProducto = vi.fn();
    const setEquivalenciaByProducto = vi.fn();

    cargarFichaYPreciosDeComprador({
      idCompradorDetalle: "c1",
      codigoCuenta: "demo",
      selectedCompradorIdRef,
      setFichaComprador: vi.fn(),
      setExigeOc,
      setPrecioOverrideByProducto,
      setEquivalenciaByProducto,
    });

    await vi.waitFor(() => expect(setExigeOc).toHaveBeenCalledWith(true));
    expect(setPrecioOverrideByProducto).toHaveBeenCalledWith({ p1: 12 });
    expect(setEquivalenciaByProducto).toHaveBeenCalledWith({ p1: "Palta" });

    selectedCompradorIdRef.current = "c2";
    setExigeOc.mockClear();
    cargarFichaYPreciosDeComprador({
      idCompradorDetalle: "c1",
      codigoCuenta: "demo",
      selectedCompradorIdRef,
      setFichaComprador: vi.fn(),
      setExigeOc,
      setPrecioOverrideByProducto,
      setEquivalenciaByProducto,
    });
    await vi.waitFor(() => expect(getCompradorAdmin).toHaveBeenCalledTimes(2));
    expect(setExigeOc).not.toHaveBeenCalled();
  });
});

describe("aplicarDetalleExternoPorConfirmar", () => {
  it("sin match deja la propuesta de Mateo y abre el formulario", () => {
    const setCompradorLabel = vi.fn();
    const setIdComprador = vi.fn();
    const setPrioridad = vi.fn();
    const setFechaEntrega = vi.fn();
    const setStep = vi.fn();
    const setMissingFields = vi.fn();
    const setLineas = vi.fn();
    aplicarDetalleExternoPorConfirmar({
      origenCorreoRows: [
        { "Nombre cliente": "Hotel Norte", Producto: "Aguacate", Cantidad: 2, Prioridad: "Urgente" },
      ],
      detalle: {
        origen_texto: "",
        notas_almacen: "",
        centro_consumo: "",
        ventana_desde: "",
        ventana_hasta: "",
        direccion_entrega: "Muelle 2",
        anden: "",
        contacto_entrega: "",
        telefono_contacto: "",
        correo_contacto: "",
        acepta_sustituciones: "",
        requiere_lote: "",
        registrar_temperatura: "",
        fecha_entrega: "2099-06-01",
      },
      idCompradorDetalle: "",
      nombreEscritoOrigen: "Hotel Norte",
      setCompradorNombreIa: vi.fn(),
      compradorRows: [],
      handleSelectComprador: vi.fn(),
      selectedCompradorIdRef: { current: "" },
      ovMaterializada: false,
      setCompradorSugerencias: vi.fn(),
      setIdComprador,
      setCompradorLabel,
      setPrioridad,
      productoRows: [],
      hijasEdit: [],
      setFechaEntrega,
      setCentroConsumo: vi.fn(),
      setObservaciones: vi.fn(),
      setOrdenCompraHotel: vi.fn(),
      setDireccion: vi.fn(),
      setAnden: vi.fn(),
      setContacto: vi.fn(),
      setTelefono: vi.fn(),
      setCorreo: vi.fn(),
      setVentanaDesde: vi.fn(),
      setVentanaHasta: vi.fn(),
      setAceptaSustituciones: vi.fn(),
      setRequiereLote: vi.fn(),
      setRegistrarTemperatura: vi.fn(),
      setAutoFields: vi.fn(),
      setWarnFields: vi.fn(),
      setMissingFields,
      setDiscrepancias: vi.fn(),
      skipOtSeedFromOrigenRef: { current: true },
      lineasDesdeDetalle: () => [],
      setLineas,
      setStartMode: vi.fn(),
      setFormOtPage: vi.fn(),
      setStep,
    });
    expect(setIdComprador).toHaveBeenCalledWith("");
    expect(setCompradorLabel).toHaveBeenCalledWith("Hotel Norte");
    expect(setPrioridad).toHaveBeenCalledWith("Urgente");
    expect(setFechaEntrega).toHaveBeenCalledWith("2099-06-01");
    expect(setStep).toHaveBeenCalledWith("form");
    expect(setMissingFields.mock.calls[0][0].has("cliente")).toBe(true);
    expect(setLineas).toHaveBeenCalled();
  });
});
