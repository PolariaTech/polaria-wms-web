import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FILTROS_BATCH_INICIALES } from "./batch-seleccion";
import {
  filtrosActivos,
  ImpresionBatchFiltros,
} from "./ImpresionBatchFiltros";

describe("filtrosActivos", () => {
  it("es falso con los filtros iniciales y verdadero con cualquier cambio", () => {
    expect(filtrosActivos(FILTROS_BATCH_INICIALES)).toBe(false);
    expect(filtrosActivos({ ...FILTROS_BATCH_INICIALES, texto: " " })).toBe(false);
    expect(filtrosActivos({ ...FILTROS_BATCH_INICIALES, cliente: "Hotel Sol" })).toBe(true);
    expect(filtrosActivos({ ...FILTROS_BATCH_INICIALES, tipo: "una_ot" })).toBe(true);
  });
});

describe("ImpresionBatchFiltros", () => {
  it("cambia el tipo de OV con los botones y avisa cuál está activo", async () => {
    const onChange = vi.fn();
    render(
      <ImpresionBatchFiltros
        filtros={FILTROS_BATCH_INICIALES}
        clientes={["Hotel Sol"]}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Todas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: "Más de 1 OT" }));
    expect(onChange).toHaveBeenCalledWith({
      ...FILTROS_BATCH_INICIALES,
      tipo: "varias_ot",
    });
  });

  it("filtra por cliente desde la lista", async () => {
    const onChange = vi.fn();
    render(
      <ImpresionBatchFiltros
        filtros={FILTROS_BATCH_INICIALES}
        clientes={["Hotel Luna", "Hotel Sol"]}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(screen.getByLabelText("Cliente"), "Hotel Sol");
    expect(onChange).toHaveBeenCalledWith({
      ...FILTROS_BATCH_INICIALES,
      cliente: "Hotel Sol",
    });
  });

  it("«Quitar filtros» siempre está en su lugar: apagado sin filtros y activo con alguno", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ImpresionBatchFiltros
        filtros={FILTROS_BATCH_INICIALES}
        clientes={[]}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Quitar filtros" })).toBeDisabled();
    rerender(
      <ImpresionBatchFiltros
        filtros={{ ...FILTROS_BATCH_INICIALES, texto: "oc" }}
        clientes={[]}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Quitar filtros" }));
    expect(onChange).toHaveBeenCalledWith(FILTROS_BATCH_INICIALES);
  });
});
