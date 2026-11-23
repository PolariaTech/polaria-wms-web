import { describe, expect, it, vi } from "vitest";
import { buildCatalogoListColumns } from "./catalogo-list-view.columns";

const handlers = () => ({
  setEditingProductId: vi.fn(),
  setPendingToggle: vi.fn(),
  setToggleError: vi.fn(),
});

describe("buildCatalogoListColumns", () => {
  it("incluye la columna de acciones fuera de inspección", () => {
    const columns = buildCatalogoListColumns({ inspect: false, ...handlers() });
    const ids = columns.map((column) => column.id);
    expect(ids[0]).toBe("codigo");
    expect(ids).toContain("vigencia");
    expect(ids[ids.length - 1]).toBe("acciones");
  });

  it("omite acciones en modo inspección", () => {
    const columns = buildCatalogoListColumns({ inspect: true, ...handlers() });
    expect(columns.map((column) => column.id)).not.toContain("acciones");
  });
});
