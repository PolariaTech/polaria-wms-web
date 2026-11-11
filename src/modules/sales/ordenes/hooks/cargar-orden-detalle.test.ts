import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCompradorAdmin, listCompradorProductoAliasAdmin } from "@/modules/admin-panel";
import { fetchUltimosPreciosPorComprador } from "../../shared/services/sales.service";
import { aplicarDetalleCargado } from "./cargar-orden-detalle";

vi.mock("@/modules/admin-panel", () => ({
  getCompradorAdmin: vi.fn(),
  listCompradorProductoAliasAdmin: vi.fn(),
}));

vi.mock("../../shared/services/sales.service", () => ({
  fetchUltimosPreciosPorComprador: vi.fn(),
}));

const ficha = {
  centros: [],
  contactos: [],
  moneda: "MXN",
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
  exigeOc: "No",
};

function detalleVacio(partial: Record<string, unknown> = {}) {
  return {
    estado: "confirmada",
    created_at: "2026-11-01T12:00:00.000Z",
    fecha_pedido: "2026-11-01",
    codigo: "OV-9",
    id_comprador: "",
    comprador_nombre: "Hotel Norte",
    fecha_entrega: "2099-01-15",
    ventana_desde: "",
    ventana_hasta: "",
    prioridad: "Normal",
    moneda: "MXN",
    origen_texto: "",
    orden_compra_hotel: "OC-1",
    centro_consumo: "",
    notas_almacen: "",
    observaciones: "",
    direccion_entrega: "Muelle 2",
    entrega_lat: 20.63,
    entrega_lng: -87.07,
    anden: "",
    contacto_entrega: "",
    telefono_contacto: "",
    correo_contacto: "",
    turno: "",
    hora_salida: "",
    chofer: "",
    unidad: "",
    acepta_sustituciones: "",
    requiere_lote: "",
    registrar_temperatura: "",
    origen_archivos: null,
    origen_correo: null,
    id_bodega: "",
    id_bodega_destino: "bd2",
    lineas: [],
    notas_lineas: "",
    ...partial,
  };
}

function setters() {
  return {
    setProductosBase: vi.fn(),
    setCompradores: vi.fn(),
    setBodegasDestino: vi.fn(),
    setIdBodegaDestino: vi.fn(),
    setEditingEstado: vi.fn(),
    setFechaCreacion: vi.fn(),
    setOrdenCargadaId: vi.fn(),
    setEditingCodigo: vi.fn(),
    setIdComprador: vi.fn(),
    setCompradorLabel: vi.fn(),
    setFechaEntrega: vi.fn(),
    setVentanaDesde: vi.fn(),
    setVentanaHasta: vi.fn(),
    setPrioridad: vi.fn(),
    setMoneda: vi.fn(),
    setOrdenCompraHotel: vi.fn(),
    setCentroConsumo: vi.fn(),
    setObservaciones: vi.fn(),
    setDireccion: vi.fn(),
    setEntregaLat: vi.fn(),
    setEntregaLng: vi.fn(),
    entregaLat: null,
    entregaLng: null,
    setAnden: vi.fn(),
    setContacto: vi.fn(),
    setTelefono: vi.fn(),
    setCorreo: vi.fn(),
    setTurno: vi.fn(),
    setHoraSalida: vi.fn(),
    setChofer: vi.fn(),
    setUnidad: vi.fn(),
    setAceptaSustituciones: vi.fn(),
    setRequiereLote: vi.fn(),
    setRegistrarTemperatura: vi.fn(),
    setOrigenTexto: vi.fn(),
    setOrigenAdjuntos: vi.fn(),
    setOrigenCorreoDraft: vi.fn(),
    setOrdenesTrabajoPreview: vi.fn(),
    setCompradorNombreIa: vi.fn(),
    setCompradorSugerencias: vi.fn(),
    setLineas: vi.fn(),
    setStartMode: vi.fn(),
    setFormOtPage: vi.fn(),
    setStep: vi.fn(),
    setMissingFields: vi.fn(),
    setDiscrepancias: vi.fn(),
    setAutoFields: vi.fn(),
    setWarnFields: vi.fn(),
    setFichaComprador: vi.fn(),
    setExigeOc: vi.fn(),
    setPrecioOverrideByProducto: vi.fn(),
    setEquivalenciaByProducto: vi.fn(),
    selectedCompradorIdRef: { current: "" },
    skipOtSeedFromOrigenRef: { current: false },
    handleSelectComprador: vi.fn(),
  };
}

describe("aplicarDetalleCargado", () => {
  beforeEach(() => {
    vi.mocked(getCompradorAdmin).mockReset();
    vi.mocked(getCompradorAdmin).mockResolvedValue({ ficha } as never);
    vi.mocked(listCompradorProductoAliasAdmin).mockReset();
    vi.mocked(listCompradorProductoAliasAdmin).mockResolvedValue([] as never);
    vi.mocked(fetchUltimosPreciosPorComprador).mockReset();
    vi.mocked(fetchUltimosPreciosPorComprador).mockResolvedValue({});
  });

  it("sin detalle solo carga catálogo y bodegas", () => {
    const acciones = setters();
    aplicarDetalleCargado({
      ...acciones,
      productoRows: [{ idProducto: "p1" }],
      compradorRows: [],
      internas: [{ idBodega: "bi", nombre: "CEDIS", codigo: "C1" }],
      externas: [],
      idBodegaDefault: "bi",
      detalle: null,
      codigoCuenta: "demo",
      editingId: "",
      codigoVenta: "",
    });
    expect(acciones.setProductosBase).toHaveBeenCalledWith([{ idProducto: "p1" }]);
    expect(acciones.setBodegasDestino).toHaveBeenCalledWith([
      { idBodega: "bi", label: "CEDIS (C1)" },
    ]);
    expect(acciones.setIdBodegaDestino).toHaveBeenCalledWith("bi");
    expect(acciones.setEditingCodigo).not.toHaveBeenCalled();
    expect(getCompradorAdmin).not.toHaveBeenCalled();
  });

  it("un detalle interno copia folio, dirección y bodega sin entrar a Mateo", async () => {
    const acciones = setters();
    const comprador = {
      idComprador: "c1",
      codigo: "HN",
      comprador: "Hotel Norte",
      apodo: "",
  denominacionComercialOverride: "",
      telefono: null,
      rfc: "",
      grupo: "",
      estaActivo: true,
    };
    aplicarDetalleCargado({
      ...acciones,
      productoRows: [],
      compradorRows: [comprador],
      internas: [{ idBodega: "bi", nombre: "CEDIS", codigo: "C1" }],
      externas: [{ idBodega: "bd2", nombre: "Hotel", codigo: "H1" }],
      idBodegaDefault: "bi",
      detalle: detalleVacio({ id_comprador: "c1" }),
      codigoCuenta: "demo",
      editingId: "ov-1",
      codigoVenta: "",
    });

    expect(acciones.setEditingCodigo).toHaveBeenCalledWith("OV-9");
    expect(acciones.setIdComprador).toHaveBeenCalledWith("c1");
    expect(acciones.setCompradorLabel).toHaveBeenCalledWith("Hotel Norte");
    expect(acciones.setDireccion).toHaveBeenCalledWith("Muelle 2");
    expect(acciones.setEntregaLat).toHaveBeenCalledWith(20.63);
    expect(acciones.setEntregaLng).toHaveBeenCalledWith(-87.07);
    expect(acciones.setOrdenCompraHotel).toHaveBeenCalledWith("OC-1");
    expect(acciones.setIdBodegaDestino).toHaveBeenLastCalledWith("bd2");
    expect(acciones.setStartMode).not.toHaveBeenCalled();
    expect(acciones.selectedCompradorIdRef.current).toBe("c1");
    await vi.waitFor(() => expect(acciones.setFichaComprador).toHaveBeenCalledWith(ficha));
    expect(acciones.setExigeOc).toHaveBeenCalledWith(false);
  });
});
