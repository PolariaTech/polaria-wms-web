import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaFormEstado } from "../../types/orden-venta-form-estado";
import { OrdenVentaFormStep } from "./OrdenVentaFormToolbar";

// Primer bloque: con catálogo vacío solo se pinta la franja superior. Segundo bloque: con catálogo, las tres secciones.
function estadoToolbar(parcial: Record<string, unknown> = {}) {
  const espias: Record<string, ReturnType<typeof vi.fn>> = {};
  const datos: Record<string, unknown> = {
    isEditing: false,
    hijaFormActiva: null,
    ordenesTrabajoForm: [],
    afterCutoff: false,
    successMessage: null,
    hasProductos: false,
    emptyCatalogMessage: "No hay catálogo",
    startMode: "scratch",
    origenTexto: "",
    origenArchivosNombres: [],
    denominacionComercial: "",
    setDenominacionComercial: vi.fn(),
    setStep: vi.fn(),
    setStartMode: vi.fn(),
    setError: vi.fn(),
    ...parcial,
  };
  const estado = new Proxy(datos, {
    get: (destino, clave: string) => (clave in destino ? destino[clave] : (espias[clave] ??= vi.fn())),
  }) as unknown as OrdenVentaFormEstado;
  return { estado, datos };
}

describe("OrdenVentaFormStep — franja superior (REQ-232)", () => {
  it("en una alta sin tarea activa ofrece volver al inicio y limpia el modo y el error", async () => {
    const user = userEvent.setup();
    const { estado, datos } = estadoToolbar();
    render(<OrdenVentaFormStep {...estado} />);

    await user.click(screen.getByRole("button", { name: "← Volver al inicio" }));

    expect(datos.setStep).toHaveBeenCalledWith("start");
    expect(datos.setStartMode).toHaveBeenCalledWith(null);
    expect(datos.setError).toHaveBeenCalledWith(null);
  });

  it("al editar una OV no ofrece volver al inicio", () => {
    const { estado } = estadoToolbar({ isEditing: true });
    render(<OrdenVentaFormStep {...estado} />);

    expect(screen.queryByRole("button", { name: "← Volver al inicio" })).not.toBeInTheDocument();
  });

  it("con una tarea activa no ofrece volver al inicio ni lleva botones de eliminar (pasaron al pie)", () => {
    const { estado } = estadoToolbar({
      hijaFormActiva: { id: "ot-1" },
      ordenesTrabajoForm: [{ id: "ot-1" }, { id: "ot-2" }],
    });
    render(<OrdenVentaFormStep {...estado} />);

    expect(screen.queryByRole("button", { name: "← Volver al inicio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Eliminar/ })).not.toBeInTheDocument();
  });

  it("avisa que no hay catálogo y el horario de captura", () => {
    const { estado } = estadoToolbar({ afterCutoff: true });
    render(<OrdenVentaFormStep {...estado} />);

    expect(screen.getByText("No hay catálogo")).toBeInTheDocument();
    expect(screen.getByText(/Después del corte de las 17:00/)).toBeInTheDocument();
  });
});

describe("OrdenVentaFormStep — secciones con catálogo (REQ-216/217/254)", () => {
  /** Estado con lo que consultan las tres secciones del formulario. */
  function estadoCompleto(parcial: Record<string, unknown> = {}) {
    return estadoToolbar({
      hasProductos: true,
      idComprador: "",
      compradorLabel: "",
      compradorNombreIa: null,
      compradorSugerencias: [],
      missingFields: new Set<string>(),
      autoFields: new Set<string>(),
      warnFields: new Set<string>(),
      codigoClienteCatalogo: "",
      denominacionComercialCatalogo: "",
      denominacionComercial: "",
      setDenominacionComercial: vi.fn(),
      ordenCompraHotel: "",
      exigeOc: false,
      centroConsumo: "",
      fechaEntrega: "2099-01-15",
      esPorConfirmar: true,
      ventanaDesde: "",
      ventanaHasta: "",
      prioridad: "Normal",
      moneda: "MXN",
      observaciones: "",
      direccion: "",
      avisoVerificarDireccion: false,
      contacto: "",
      telefono: "",
      correo: "",
      lineasConIndice: [],
      lineas: [],
      subtotalVenta: 0,
      ivaVenta: 0,
      totalVenta: 0,
      totalOvCompleta: 0,
      mostrarTotalOv: false,
      puedeAgregarProducto: true,
      aceptaSustituciones: "",
      requiereLote: "",
      registrarTemperatura: "",
      ...parcial,
    });
  }

  const seccion = (titulo: string) => {
    const encabezado = screen.getByRole("heading", { name: titulo });
    return encabezado.closest("section") as HTMLElement;
  };

  it("«Datos del pedido» queda con el cliente, la orden de compra y el centro de consumo", () => {
    render(<OrdenVentaFormStep {...estadoCompleto().estado} />);

    const datos = within(seccion("Datos del pedido"));
    expect(datos.getByLabelText(/Orden de compra del cliente/)).toBeInTheDocument();
    expect(datos.getByLabelText(/Centro de consumo/)).toBeInTheDocument();
    for (const etiqueta of [/Notas generales/, /Prioridad/, /Fecha de entrega/, /Ventana de entrega — desde/, /Dirección de entrega/]) {
      expect(datos.queryByLabelText(etiqueta)).not.toBeInTheDocument();
    }
  });

  it("«Entrega» recibe notas, prioridad, moneda, fecha, ventana y la dirección a todo el ancho", () => {
    render(<OrdenVentaFormStep {...estadoCompleto().estado} />);

    const entrega = within(seccion("Entrega"));
    for (const etiqueta of [
      /Notas generales/,
      /Prioridad/,
      /Fecha de entrega/,
      /Ventana de entrega — desde/,
      /Ventana de entrega — hasta/,
      /Dirección de entrega/,
      /Contacto del cliente/,
      /Teléfono del contacto/,
      /Correo del contacto/,
    ]) {
      expect(entrega.getByLabelText(etiqueta), String(etiqueta)).toBeInTheDocument();
    }
  });

  it("«Productos» muestra el conteo en su pie", () => {
    render(<OrdenVentaFormStep {...estadoCompleto().estado} />);

    expect(within(seccion("Productos")).getByText("0 productos")).toBeInTheDocument();
  });

  it("REQ-241: denominación comercial es editable (no readOnly)", () => {
    render(<OrdenVentaFormStep {...estadoCompleto().estado} />);
    const campo = screen.getByLabelText(/^Denominación comercial$/);
    expect(campo).not.toHaveAttribute("readonly");
  });
  describe("Folio de factura y Fecha de creación (solo al editar)", () => {
    const ot = (id: string, label: string) => ({ id, label });

    it("al editar, «Fecha de creación» se ve y es de solo lectura", async () => {
      const user = userEvent.setup();
      const { estado } = estadoCompleto({
        isEditing: true,
        fechaCreacion: "2026-11-03T15:00:00Z",
        folioFactura: { valores: {}, setValor: vi.fn() },
      });
      render(<OrdenVentaFormStep {...estado} />);

      const fecha = screen.getByLabelText(/Fecha de creación/);
      expect(fecha).toHaveAttribute("readonly");
      expect((fecha as HTMLInputElement).value).not.toBe("");
      const antes = (fecha as HTMLInputElement).value;
      await user.type(fecha, "x");
      expect((fecha as HTMLInputElement).value).toBe(antes);
    });

    it("sin fecha de creación muestra el valor vacío en lugar de romper", () => {
      const { estado } = estadoCompleto({
        isEditing: true,
        fechaCreacion: null,
        folioFactura: { valores: {}, setValor: vi.fn() },
      });
      render(<OrdenVentaFormStep {...estado} />);

      expect(screen.getByLabelText(/Fecha de creación/)).toBeInTheDocument();
    });

    it("al crear un pedido nuevo no aparecen ni la fecha de creación ni el folio", () => {
      const { estado } = estadoCompleto({ isEditing: false });
      render(<OrdenVentaFormStep {...estado} />);

      expect(screen.queryByLabelText(/Fecha de creación/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Folio de factura/)).not.toBeInTheDocument();
    });

    it("«Folio de factura» es opcional: acepta texto libre, no marca error y se guarda por orden de trabajo", async () => {
      const user = userEvent.setup();
      const setValor = vi.fn();
      const { estado } = estadoCompleto({
        isEditing: true,
        paginarPorOt: false,
        hijaFormActiva: ot("ot-1", "OT 1"),
        ordenesTrabajoForm: [ot("ot-1", "OT 1")],
        folioFactura: { valores: {}, setValor },
      });
      render(<OrdenVentaFormStep {...estado} />);

      const folio = screen.getByLabelText("Folio de factura");
      expect(folio).toHaveAttribute("placeholder", "Opcional");
      expect(screen.getByText(/Opcional\. Se muestra en el detalle de la orden de trabajo\./)).toBeInTheDocument();
      expect(folio).not.toBeRequired();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      await user.type(folio, "F");

      expect(setValor).toHaveBeenCalledWith("ot-1", "F");
    });

    it("con varias órdenes de trabajo hay un folio por cada una, con su nombre", () => {
      const { estado } = estadoCompleto({
        isEditing: true,
        paginarPorOt: false,
        hijaFormActiva: ot("ot-1", "OT 1"),
        ordenesTrabajoForm: [ot("ot-1", "OT 1"), ot("ot-2", "OT 2")],
        folioFactura: { valores: { "ot-1": "FAC-1001" }, setValor: vi.fn() },
      });
      render(<OrdenVentaFormStep {...estado} />);

      expect(screen.getByLabelText("Folio de factura · OT 1")).toHaveValue("FAC-1001");
      expect(screen.getByLabelText("Folio de factura · OT 2")).toHaveValue("");
    });

    it("paginando por orden de trabajo solo se ve el folio de la activa", () => {
      const { estado } = estadoCompleto({
        isEditing: true,
        paginarPorOt: true,
        hijaFormActiva: ot("ot-2", "OT 2"),
        ordenesTrabajoForm: [ot("ot-1", "OT 1"), ot("ot-2", "OT 2")],
        folioFactura: { valores: {}, setValor: vi.fn() },
      });
      render(<OrdenVentaFormStep {...estado} />);

      expect(screen.getAllByLabelText(/Folio de factura/)).toHaveLength(1);
      expect(screen.getByLabelText("Folio de factura")).toBeInTheDocument();
    });
  });
});
