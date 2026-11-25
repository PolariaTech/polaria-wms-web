import { describe, expect, it, vi } from "vitest";

vi.mock("./orden-surtido-print-admin", () => ({
  buildPrintDataAdmin: vi.fn(),
}));
vi.mock("./orden-surtido-meta", () => ({ getOrdenMetaPublica: vi.fn() }));
vi.mock("./orden-surtido-captura-queries", () => ({
  getOrdenSurtidoCaptura: vi.fn(),
  listOrdenSurtidoCapturas: vi.fn(),
}));
vi.mock("./orden-surtido-captura-upsert", () => ({
  upsertOrdenSurtidoCaptura: vi.fn(),
}));
vi.mock("./orden-surtido-captura-fotos", () => ({
  listOrdenSurtidoCapturaOtsConFotos: vi.fn(),
  listOrdenSurtidoCapturaFotos: vi.fn(),
}));
vi.mock("./orden-surtido-apply-captura", () => ({
  applySurtidoCapturaToOrdenVenta: vi.fn(),
}));
vi.mock("./orden-surtido-sync-estado", () => ({
  syncOrdenVentaEstadoAlistamiento: vi.fn(),
}));

describe("orden-surtido.service facade", () => {
  it("reexporta API pública", async () => {
    const facade = await import("./orden-surtido.service");
    expect(typeof facade.getOrdenMetaPublica).toBe("function");
    expect(typeof facade.buildPrintDataAdmin).toBe("function");
    expect(typeof facade.getOrdenSurtidoCaptura).toBe("function");
    expect(typeof facade.listOrdenSurtidoCapturas).toBe("function");
    expect(typeof facade.upsertOrdenSurtidoCaptura).toBe("function");
    expect(typeof facade.listOrdenSurtidoCapturaOtsConFotos).toBe("function");
    expect(typeof facade.listOrdenSurtidoCapturaFotos).toBe("function");
    expect(typeof facade.applySurtidoCapturaToOrdenVenta).toBe("function");
    expect(typeof facade.syncOrdenVentaEstadoAlistamiento).toBe("function");
  });
});