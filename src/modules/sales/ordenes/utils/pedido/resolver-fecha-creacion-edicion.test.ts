import { resolverFechaCreacionEdicion } from "./resolver-fecha-creacion-edicion";

describe("fecha de creación al editar el pedido", () => {
  it("usa created_at cuando viene", () => {
    expect(
      resolverFechaCreacionEdicion("2026-11-02T18:00:00.000Z", "2026-01-01"),
    ).toBe("2026-11-02T18:00:00.000Z");
  });

  it("usa fecha_pedido si created_at viene vacío", () => {
    expect(resolverFechaCreacionEdicion("", "2026-01-01")).toBe("2026-01-01");
  });

  it("queda vacío si no hay ninguna fecha", () => {
    expect(resolverFechaCreacionEdicion(null, null)).toBe("");
  });

  it("conserva un texto que no es fecha y no lo convierte", () => {
    expect(resolverFechaCreacionEdicion("no-es-fecha", "2026-01-01")).toBe(
      "no-es-fecha",
    );
  });
});
