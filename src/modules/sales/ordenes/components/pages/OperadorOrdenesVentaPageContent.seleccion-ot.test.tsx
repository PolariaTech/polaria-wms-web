import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../../print/orden-tarea-almacen.types";
import { OperadorOrdenesVentaPageContent } from "./OperadorOrdenesVentaPageContent";

const listOrdenes = vi.fn();
const imprimirPdf = vi.fn();
const armarPdf = vi.fn();
const fetchLog = vi.fn();
const postLogOts = vi.fn();

vi.mock("@/modules/sales/shared/services/sales.service", () => ({
  listOrdenesVentaOperador: (...args: unknown[]) => listOrdenes(...args),
  listProductosVentaCatalogo: vi.fn().mockResolvedValue([]),
  getOrdenVentaDetalle: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/modules/sales/shared/hooks/useOrdenesVentaSubscription", () => ({
  useOrdenesVentaSubscription: () => undefined,
}));
vi.mock("@/providers/tenant/CompanyProvider", () => ({
  useCompany: () => ({ codigoCuenta: "CUENTA-01", activeBodegaId: "bod-1" }),
}));
vi.mock("@/components/shared/module/OperationalModuleShell", () => ({
  OperationalModuleShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../modals/OrdenVentaCreateModal", () => ({ OrdenVentaCreateModal: () => null }));
vi.mock("../modals/OrdenVentaDetalleModal", () => ({ OrdenVentaDetalleModal: () => null }));
// El Cypher real es enorme: se sustituye por los dos botones que importan aquí.
vi.mock("../modals/OrdenVentaCypherDrawer", () => ({
  OrdenVentaCypherDrawer: (props: { idOrdenVenta: string | null; onPrint: () => void; onPreview: () => void; onClose: () => void }) =>
    props.idOrdenVenta ? (
      <div>
        <button type="button" onClick={props.onPrint}>Imprimir desde Cypher</button>
        <button type="button" onClick={props.onPreview}>Descarga desde Cypher</button>
        <button type="button" onClick={props.onClose}>Cerrar Cypher</button>
      </div>
    ) : null,
}));
vi.mock("../../print/map-orden-tarea-almacen", async (importarOriginal) => ({
  ...(await importarOriginal<object>()),
  mapOrdenVentaToAlmacenPrintSheets: () => HOJAS,
}));
vi.mock("../../print/download-orden-tarea-almacen-pdf", async (importarOriginal) => ({
  ...(await importarOriginal<object>()),
  printOrdenTareaAlmacenLandscape: (...args: unknown[]) => imprimirPdf(...args),
  buildOrdenTareaAlmacenLandscapePdfBlob: (...args: unknown[]) => armarPdf(...args),
}));
vi.mock("../../surtido/list-orden-surtido-capturas.client", () => ({
  listOrdenSurtidoCapturasClient: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../services/orden-venta-log.client", async (importarOriginal) => ({
  ...(await importarOriginal<object>()),
  fetchOrdenVentaLog: (...args: unknown[]) => fetchLog(...args),
  postOrdenVentaLog: vi.fn().mockResolvedValue(undefined),
  postOrdenVentaLogForOts: (...args: unknown[]) => postLogOts(...args),
}));

const HOJAS = [
  { idOrdenVenta: "ov-1", idOrdenTrabajo: "ot-1", tareaIndex: 1, tareaTotal: 2, centroConsumo: "Cocina", lineas: [{ producto: "A" }] },
  { idOrdenVenta: "ov-1", idOrdenTrabajo: "ot-2", tareaIndex: 2, tareaTotal: 2, centroConsumo: "Bar", lineas: [{ producto: "B" }] },
] as unknown as OrdenTareaAlmacenPrintData[];

function ov(estado: OrdenVentaOperadorRow["estado"]): OrdenVentaOperadorRow {
  return {
    idOrdenVenta: "ov-1",
    venta: "OV-0001",
    occ: "",
    occTodas: [],
    cuenta: "JBR",
    comprador: "Hotel Sol",
    productos: "—",
    cantidadKg: 0,
    total: 0,
    estado,
    fecha: "2026-11-01",
    fechaEntrega: "2026-11-06",
    ordenesTrabajo: 2,
    destino: "—",
    idBodega: "bod-1",
    idBodegaDestino: null,
    slaStatus: "en_tiempo",
    alertaStatus: "ok",
    minutosEnEstado: 0,
    slaMinutos: 60,
    alertaMinutos: 45,
  };
}

async function abrirCypher() {
  render(<OperadorOrdenesVentaPageContent />);
  await userEvent.click(await screen.findByRole("button", { name: "Ver detalle de OV-0001" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  listOrdenes.mockResolvedValue([ov("confirmada")]);
  fetchLog.mockResolvedValue([]);
  imprimirPdf.mockResolvedValue({ queue: { kind: "printing" }, impresora: "Brother", via: "ipp" });
  armarPdf.mockResolvedValue({ blob: new Blob(["%PDF"]), filename: "x.pdf" });
  URL.createObjectURL = vi.fn(() => "blob:pdf");
  URL.revokeObjectURL = vi.fn();
});

describe("Cypher: elegir qué OT salen (OV confirmada)", () => {
  it("«Imprimir» abre el modal en vez de mandar todo, y manda solo las OT elegidas", async () => {
    await abrirCypher();

    await userEvent.click(screen.getByRole("button", { name: "Imprimir desde Cypher" }));
    expect(await screen.findByRole("heading", { name: "Imprimir OV-0001" })).toBeInTheDocument();
    expect(imprimirPdf).not.toHaveBeenCalled();

    await userEvent.click(await screen.findByRole("checkbox", { name: /OT 1 de 2/ }));
    await userEvent.click(screen.getByRole("button", { name: "Imprimir 1 hoja" }));

    await waitFor(() => expect(imprimirPdf).toHaveBeenCalledTimes(1));
    expect(imprimirPdf.mock.calls[0]![0]).toEqual([HOJAS[1]]);
    // El log de la OV también dice solo las OT que salieron.
    await waitFor(() => expect(postLogOts).toHaveBeenCalled());
    expect(postLogOts.mock.calls[0]![0].idOrdenesTrabajo).toEqual(["ot-2"]);
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Imprimir OV-0001" })).not.toBeInTheDocument());
  });

  it("con todas marcadas (lo que viene de entrada) imprime la OV completa, como antes", async () => {
    await abrirCypher();
    await userEvent.click(screen.getByRole("button", { name: "Imprimir desde Cypher" }));

    await userEvent.click(await screen.findByRole("button", { name: "Imprimir 2 hojas" }));

    await waitFor(() => expect(imprimirPdf).toHaveBeenCalledTimes(1));
    expect(imprimirPdf.mock.calls[0]![0]).toEqual(HOJAS);
  });

  it("«Descarga» abre el mismo modal y arma el PDF solo con las OT elegidas", async () => {
    await abrirCypher();

    await userEvent.click(screen.getByRole("button", { name: "Descarga desde Cypher" }));
    expect(await screen.findByRole("heading", { name: "Descargar OV-0001" })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("checkbox", { name: /OT 2 de 2/ }));
    await userEvent.click(screen.getByRole("button", { name: "Ver PDF de 1 hoja" }));

    await waitFor(() => expect(armarPdf).toHaveBeenCalledTimes(1));
    expect(armarPdf.mock.calls[0]![0]).toEqual([HOJAS[0]]);
    expect(imprimirPdf).not.toHaveBeenCalled();
  });

  it("si la OV ya se imprimió lo avisa dentro del modal, sin otro diálogo de confirmación", async () => {
    fetchLog.mockResolvedValue([{ payloadTipo: "impresion_pdf" }]);
    await abrirCypher();

    await userEvent.click(screen.getByRole("button", { name: "Imprimir desde Cypher" }));

    expect(await screen.findByText(/ya se imprimió para alistamiento/)).toBeInTheDocument();
    expect(screen.queryByText("¿Imprimir de nuevo?")).not.toBeInTheDocument();
  });

  it("Cancelar cierra el modal sin imprimir nada", async () => {
    await abrirCypher();
    await userEvent.click(screen.getByRole("button", { name: "Imprimir desde Cypher" }));
    await screen.findByRole("checkbox", { name: /OT 1 de 2/ });

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("heading", { name: "Imprimir OV-0001" })).not.toBeInTheDocument();
    expect(imprimirPdf).not.toHaveBeenCalled();
  });

  it("si se cierra el Cypher, el modal de OT que abrió se cierra con él", async () => {
    await abrirCypher();
    await userEvent.click(screen.getByRole("button", { name: "Imprimir desde Cypher" }));
    await screen.findByRole("checkbox", { name: /OT 1 de 2/ });

    await userEvent.click(screen.getByRole("button", { name: "Cerrar Cypher" }));

    expect(screen.queryByRole("heading", { name: "Imprimir OV-0001" })).not.toBeInTheDocument();
    expect(imprimirPdf).not.toHaveBeenCalled();
  });

  it("si el envío falla, «Reintentar» manda solo las OT que se habían elegido", async () => {
    imprimirPdf
      .mockRejectedValueOnce(new Error("SMTP caído"))
      .mockResolvedValue({ queue: { kind: "printing" }, impresora: "Brother", via: "ipp" });
    await abrirCypher();
    await userEvent.click(screen.getByRole("button", { name: "Imprimir desde Cypher" }));
    await userEvent.click(await screen.findByRole("checkbox", { name: /OT 1 de 2/ }));
    await userEvent.click(screen.getByRole("button", { name: "Imprimir 1 hoja" }));

    await userEvent.click(await screen.findByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(imprimirPdf).toHaveBeenCalledTimes(2));
    expect(imprimirPdf.mock.calls[1]![0]).toEqual([HOJAS[1]]);
  });
});

// El Cypher habilita «Imprimir» y «Descarga» desde que la OV está confirmada: en todos esos estados
// (no solo en «confirmada») debe abrirse el modal, nunca mandar directo a la impresora o al PDF.
describe.each(["confirmada", "alistamiento", "alistada", "revisada", "facturada", "despachada"] as const)(
  "Cypher: OV en estado «%s»",
  (estado) => {
    beforeEach(() => {
      listOrdenes.mockResolvedValue([ov(estado)]);
    });

    it("«Imprimir» abre el modal y no manda nada hasta confirmar", async () => {
      await abrirCypher();

      await userEvent.click(screen.getByRole("button", { name: "Imprimir desde Cypher" }));

      expect(await screen.findByRole("heading", { name: "Imprimir OV-0001" })).toBeInTheDocument();
      expect(imprimirPdf).not.toHaveBeenCalled();
    });

    it("«Descarga» abre el modal y no arma ningún PDF hasta confirmar", async () => {
      await abrirCypher();

      await userEvent.click(screen.getByRole("button", { name: "Descarga desde Cypher" }));

      expect(await screen.findByRole("heading", { name: "Descargar OV-0001" })).toBeInTheDocument();
      expect(armarPdf).not.toHaveBeenCalled();
    });
  },
);
