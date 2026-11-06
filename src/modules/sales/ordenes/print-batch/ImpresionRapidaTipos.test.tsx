import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ImpresionRapidaTipos,
  TIPOS_RAPIDA_INICIALES,
  type TipoDocumentoRapida,
} from "./ImpresionRapidaTipos";

function montar(value: ReadonlySet<TipoDocumentoRapida> = TIPOS_RAPIDA_INICIALES) {
  const onChange = vi.fn();
  render(
    <>
      <ImpresionRapidaTipos value={value} onChange={onChange} />
      <button type="button">Fuera</button>
    </>,
  );
  return { onChange, boton: screen.getByRole("button", { name: /Tipo de documentos/ }) };
}

describe("ImpresionRapidaTipos", () => {
  it("por defecto va solo lo que hoy se puede imprimir: las órdenes de tarea", () => {
    const { boton } = montar();

    expect(boton).toHaveTextContent("Órdenes de tarea");
  });

  it("cerrado muestra lo elegido y no lista las opciones", () => {
    const { boton } = montar();

    expect(boton).toHaveTextContent("Órdenes de tarea");
    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("al abrir ofrece órdenes de tarea, OC y facturas (sin el resumen, que va siempre) en selección múltiple", async () => {
    const { boton } = montar();

    await userEvent.click(boton);

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Órdenes de tarea",
      "Órdenes de compra originales",
      "FacturasPróximamente",
    ]);
    expect(screen.queryByRole("option", { name: /Resumen/ })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Órdenes de tarea" })).toHaveAttribute("aria-selected", "true");
  });

  it("marcar y desmarcar una opción disponible avisa el nuevo conjunto y deja la lista abierta", async () => {
    const { boton, onChange } = montar();
    await userEvent.click(boton);

    await userEvent.click(screen.getByRole("option", { name: "Órdenes de tarea" }));

    expect(onChange).toHaveBeenCalledWith(new Set());
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("las órdenes de compra originales (REQ-260) se pueden marcar junto a las de tarea", async () => {
    const { boton, onChange } = montar();
    await userEvent.click(boton);

    const oc = screen.getByRole("option", { name: "Órdenes de compra originales" });
    expect(oc).not.toHaveAttribute("aria-disabled");
    await userEvent.click(oc);

    expect(onChange).toHaveBeenCalledWith(new Set(["ot", "oc"]));
  });

  it.each(["Facturas"])(
    "«%s» está apagada: no se marca y su «Próximamente» aparece con el mouse encima",
    async (nombre) => {
      const { boton, onChange } = montar();
      await userEvent.click(boton);
      const opcion = screen.getByRole("option", { name: new RegExp(nombre) });

      expect(opcion).toHaveAttribute("aria-disabled", "true");
      expect(opcion).toHaveClass("cursor-not-allowed");
      expect(opcion.querySelector(".group-hover\\:opacity-100")).toHaveClass("opacity-0");
      await userEvent.click(opcion);

      expect(onChange).not.toHaveBeenCalled();
    },
  );

  it("sin nada elegido el botón pide elegir al menos un tipo", () => {
    const { boton } = montar(new Set());

    expect(boton).toHaveTextContent("Elige al menos un tipo");
  });

  it("con varios elegidos cuenta los tipos", () => {
    const { boton } = montar(new Set<TipoDocumentoRapida>(["ot", "oc"]));

    expect(boton).toHaveTextContent("2 tipos de documentos");
  });

  it("con el teclado: abre con la flecha, se mueve, marca con espacio y Escape devuelve el foco", async () => {
    const { boton, onChange } = montar(new Set());
    boton.focus();

    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toHaveFocus();
    await userEvent.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith(new Set(["ot"]));

    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      expect.stringMatching(/-op-factura$/),
    );
    // La apagada muestra su aviso al llegar con el teclado y no se marca.
    expect(screen.getByText("Próximamente", { selector: "span.opacity-100" })).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledTimes(1);

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(boton).toHaveFocus();
  });

  it("un clic fuera cierra la lista", async () => {
    const { boton } = montar();
    await userEvent.click(boton);

    await userEvent.click(screen.getByRole("button", { name: "Fuera" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
