import { describe, expect, it, vi } from "vitest";
import { aplicarDetalleExternoPorConfirmar } from "./cargar-orden-al-abrir";

vi.mock("@/modules/admin-panel", () => ({
  getCompradorAdmin: vi.fn(),
  listCompradorProductoAliasAdmin: vi.fn(),
}));

vi.mock("../../shared/services/sales.service", () => ({
  fetchUltimosPreciosPorComprador: vi.fn(),
}));

describe("REQ-344: horas al reabrir con sello", () => {
  it("con sello, horas vienen de BD aunque Mateo proponga otra", () => {
    const setVentanaDesde = vi.fn();
    const setVentanaHasta = vi.fn();
    aplicarDetalleExternoPorConfirmar({
      origenCorreoRows: [
        {
          Producto: "Aguacate",
          Cantidad: 1,
          "Ventana desde": "06:00",
          "Ventana hasta": "08:00",
          _cabeceraUsuario: {
            notasGenerales: "ok",
            centroConsumo: "Cocina",
            referenciaPedido: "",
            fechaEntrega: "2099-06-01",
            direccionEntrega: "",
            contacto: "",
            telefono: "",
            correo: "",
          },
        },
      ],
      detalle: {
        origen_texto: "Hora de entrega 6:00 am",
        notas_almacen: "ok",
        centro_consumo: "Cocina",
        ventana_desde: "09:00",
        ventana_hasta: "",
        direccion_entrega: "",
        anden: "",
        contacto_entrega: "",
        telefono_contacto: "",
        correo_contacto: "",
        acepta_sustituciones: "",
        requiere_lote: "",
        registrar_temperatura: "",
        fecha_entrega: "2099-06-01",
        observaciones: "captura",
      },
      idCompradorDetalle: "",
      nombreEscritoOrigen: "",
      setCompradorNombreIa: vi.fn(),
      compradorRows: [],
      handleSelectComprador: vi.fn(),
      selectedCompradorIdRef: { current: "" },
      ovMaterializada: false,
      setCompradorSugerencias: vi.fn(),
      setIdComprador: vi.fn(),
      setCompradorLabel: vi.fn(),
      setPrioridad: vi.fn(),
      productoRows: [],
      hijasEdit: [],
      setFechaEntrega: vi.fn(),
      setCentroConsumo: vi.fn(),
      setReferenciaPedido: vi.fn(),
      setObservaciones: vi.fn(),
      setOrdenCompraHotel: vi.fn(),
      setDireccion: vi.fn(),
      setAnden: vi.fn(),
      setContacto: vi.fn(),
      setTelefono: vi.fn(),
      setCorreo: vi.fn(),
      setVentanaDesde,
      setVentanaHasta,
      setAceptaSustituciones: vi.fn(),
      setRequiereLote: vi.fn(),
      setRegistrarTemperatura: vi.fn(),
      setAutoFields: vi.fn(),
      setWarnFields: vi.fn(),
      setMissingFields: vi.fn(),
      setDiscrepancias: vi.fn(),
      skipOtSeedFromOrigenRef: { current: true },
      lineasDesdeDetalle: () => [],
      setLineas: vi.fn(),
      setStartMode: vi.fn(),
      setFormOtPage: vi.fn(),
      setStep: vi.fn(),
      setOrdenesTrabajoPreview: vi.fn(),
      setOrigenCorreoDraft: vi.fn(),
    });
    expect(setVentanaDesde).toHaveBeenCalledWith("09:00");
    expect(setVentanaHasta).toHaveBeenCalledWith("");
  });
});
