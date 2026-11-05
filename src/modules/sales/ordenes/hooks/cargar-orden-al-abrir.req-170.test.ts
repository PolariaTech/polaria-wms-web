import { describe, expect, it, vi } from "vitest";
import { aplicarDetalleExternoPorConfirmar } from "./cargar-orden-al-abrir";

describe("aplicarDetalleExternoPorConfirmar (REQ-170)", () => {
  it("con hotel vacío llena OCC desde origen_correo (igual que la tabla)", () => {
    const setOrdenCompraHotel = vi.fn();
    aplicarDetalleExternoPorConfirmar({
      origenCorreoRows: [
        {
          "Nombre cliente": "SLS Playa Mujeres",
          Producto: "Aguacate",
          Cantidad: 1,
          "Numero pedido": "000000000028590",
          Almacen: "SLS PLAYA MUJERES",
        },
      ],
      detalle: {
        origen_texto: "orden de compra: 000000000028590",
        notas_almacen: "",
        centro_consumo: "",
        ventana_desde: "",
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
        orden_compra_hotel: "",
        origen_correo: [
          {
            "Numero pedido": "000000000028590",
            Almacen: "SLS PLAYA MUJERES",
          },
        ],
        observaciones: "",
      },
      idCompradorDetalle: "",
      nombreEscritoOrigen: "SLS Playa Mujeres",
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
      setObservaciones: vi.fn(),
      setOrdenCompraHotel,
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
      setMissingFields: vi.fn(),
      setDiscrepancias: vi.fn(),
      skipOtSeedFromOrigenRef: { current: false },
      lineasDesdeDetalle: () => [],
      setLineas: vi.fn(),
      setStartMode: vi.fn(),
      setFormOtPage: vi.fn(),
      setStep: vi.fn(),
    } as never);
    expect(setOrdenCompraHotel).toHaveBeenCalledWith("000000000028590");
  });
});
