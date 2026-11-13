import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { describe, expect, it } from "vitest";
import { PolariaFormModal } from "./PolariaFormModal";

function ModalAnfitrion({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <PolariaFormModal
        open={open}
        onClose={() => setOpen(false)}
        title="Crear equivalencia"
        onSubmit={(event) => event.preventDefault()}
      >
        {children ?? <input aria-label="Frase del cliente" />}
      </PolariaFormModal>
    </>
  );
}

describe("PolariaFormModal foco", () => {
  it("al abrir, el foco va al diálogo", async () => {
    const user = userEvent.setup();
    render(<ModalAnfitrion />);

    await user.click(screen.getByRole("button", { name: "Abrir" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveFocus();
    });
    expect(screen.getByLabelText("Frase del cliente")).not.toHaveFocus();
  });

  it("respeta un campo con autoFocus", async () => {
    render(
      <PolariaFormModal
        open
        onClose={() => undefined}
        title="Crear equivalencia"
        onSubmit={(event) => event.preventDefault()}
      >
        <input aria-label="Uno" />
        <input aria-label="Dos" autoFocus />
      </PolariaFormModal>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Dos")).toHaveFocus();
    });
  });

  it("Tab en el último elemento vuelve al primero", async () => {
    const user = userEvent.setup();
    render(
      <PolariaFormModal
        open
        onClose={() => undefined}
        title="Crear equivalencia"
        onSubmit={(event) => event.preventDefault()}
      >
        <input aria-label="Frase del cliente" />
      </PolariaFormModal>,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveFocus();
    });

    screen.getByRole("button", { name: "Guardar" }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();
  });

  it("Shift+Tab en el primero va al último", async () => {
    const user = userEvent.setup();
    render(
      <PolariaFormModal
        open
        onClose={() => undefined}
        title="Crear equivalencia"
        onSubmit={(event) => event.preventDefault()}
      >
        <input aria-label="Frase del cliente" />
      </PolariaFormModal>,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveFocus();
    });

    screen.getByRole("button", { name: "Cerrar" }).focus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Guardar" })).toHaveFocus();
  });

  it("recién abierto, Shift+Tab desde el diálogo va al último y no sale del modal", async () => {
    const user = userEvent.setup();
    render(<ModalAnfitrion />);

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveFocus();
    });

    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Guardar" })).toHaveFocus();
  });

  it("recién abierto, Tab desde el diálogo va al primero", async () => {
    const user = userEvent.setup();
    render(<ModalAnfitrion />);

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveFocus();
    });

    await user.tab();
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();
  });

  it("Tab y Shift+Tab no salen del modal anidado", async () => {
    const user = userEvent.setup();
    render(
      <PolariaFormModal
        open
        asForm={false}
        onClose={() => undefined}
        title="Editar cliente"
        onSubmit={(event) => event.preventDefault()}
      >
        <input aria-label="Campo atras" />
        <PolariaFormModal
          open
          onClose={() => undefined}
          title="Crear equivalencia"
          onSubmit={(event) => event.preventDefault()}
          stackLevel="elevated"
        >
          <input aria-label="Campo encima" />
        </PolariaFormModal>
      </PolariaFormModal>,
    );

    const dialogos = screen.getAllByRole("dialog");
    const atras = dialogos[0];
    const encima = dialogos[1];
    if (!atras || !encima) throw new Error("faltan los dos diálogos");

    await waitFor(() => {
      expect(encima).toHaveFocus();
    });

    const guardarEncima = within(encima).getByRole("button", { name: "Guardar" });
    const cerrarEncima = within(encima).getByRole("button", { name: "Cerrar" });
    const campoAtras = within(atras).getByLabelText("Campo atras");
    const cancelarAtras = within(atras)
      .getAllByRole("button", { name: "Cancelar" })
      .at(-1);

    guardarEncima.focus();
    await user.tab();
    expect(cerrarEncima).toHaveFocus();
    expect(campoAtras).not.toHaveFocus();
    expect(atras).not.toHaveFocus();
    expect(cancelarAtras).not.toHaveFocus();

    cerrarEncima.focus();
    await user.tab({ shift: true });
    expect(guardarEncima).toHaveFocus();
    expect(campoAtras).not.toHaveFocus();
    expect(atras).not.toHaveFocus();
  });

  it("no roba el Tab de un alertdialog portaleado encima", async () => {
    const user = userEvent.setup();
    render(
      <>
        <PolariaFormModal
          open
          onClose={() => undefined}
          title="Editar cliente"
          onSubmit={(event) => event.preventDefault()}
        >
          <input aria-label="Campo atras" />
        </PolariaFormModal>
        {createPortal(
          <div role="alertdialog" aria-modal="true" aria-label="Confirmar">
            <button type="button">Conservar</button>
            <button type="button">Borrar</button>
          </div>,
          document.body,
        )}
      </>,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveFocus();
    });

    const primero = screen.getByRole("button", { name: "Conservar" });
    const segundo = screen.getByRole("button", { name: "Borrar" });
    primero.focus();
    await user.tab();
    expect(segundo).toHaveFocus();
    expect(screen.getByRole("dialog")).not.toHaveFocus();
    expect(screen.getByLabelText("Campo atras")).not.toHaveFocus();
  });

  it("no roba el Tab de un popover portaleado sin aria-modal", async () => {
    const user = userEvent.setup();
    render(
      <>
        <PolariaFormModal
          open
          onClose={() => undefined}
          title="Editar cliente"
          onSubmit={(event) => event.preventDefault()}
        >
          <input aria-label="Campo atras" />
        </PolariaFormModal>
        {createPortal(
          <div>
            <button type="button">Opción A</button>
            <button type="button">Opción B</button>
          </div>,
          document.body,
        )}
      </>,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveFocus();
    });

    screen.getByRole("button", { name: "Opción A" }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Opción B" })).toHaveFocus();
    expect(screen.getByRole("dialog")).not.toHaveFocus();
    expect(screen.getByLabelText("Campo atras")).not.toHaveFocus();
  });

  it("con el foco en body, Tab enfoca el diálogo", async () => {
    const user = userEvent.setup();
    render(
      <PolariaFormModal
        open
        onClose={() => undefined}
        title="Crear equivalencia"
        onSubmit={(event) => event.preventDefault()}
      >
        <input aria-label="Frase del cliente" />
      </PolariaFormModal>,
    );

    const dialogo = screen.getByRole("dialog");
    await waitFor(() => {
      expect(dialogo).toHaveFocus();
    });

    dialogo.blur();
    expect(document.activeElement).toBe(document.body);
    await user.tab();
    expect(dialogo).toHaveFocus();
  });

  it("al cerrar, el foco vuelve al botón que abrió el modal", async () => {
    const user = userEvent.setup();
    render(<ModalAnfitrion />);

    const abrir = screen.getByRole("button", { name: "Abrir" });
    await user.click(abrir);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toHaveFocus();
    });

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    await waitFor(() => {
      expect(abrir).toHaveFocus();
    });
  });
});
