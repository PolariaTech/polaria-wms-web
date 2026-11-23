import { describe, expect, it, vi } from "vitest";
import { buildImpresorasListColumns } from "./impresoras-list-view.columns";

describe("buildImpresorasListColumns", () => {
  it("incluye cuenta solo si no hay cuenta bloqueada", () => {
    const withCuenta = buildImpresorasListColumns({
      lockedCuenta: undefined,
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });
    expect(withCuenta.some((col) => col.id === "cuenta")).toBe(true);

    const locked = buildImpresorasListColumns({
      lockedCuenta: "ACME",
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });
    expect(locked.some((col) => col.id === "cuenta")).toBe(false);
  });
});
