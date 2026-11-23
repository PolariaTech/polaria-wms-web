import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ImpresoraCreateCaminoFields,
  ImpresoraCreateCaminoPicker,
} from "./impresora-create-modal.fields";
import { INITIAL_FORM } from "./impresora-create-modal.constants";

describe("impresora-create-modal.fields", () => {
  it("notifica el camino elegido", async () => {
    const onChange = vi.fn();
    render(<ImpresoraCreateCaminoPicker camino="qz" disabled={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /Brother/ }));
    expect(onChange).toHaveBeenCalledWith("brother_email");
  });

  it("muestra el campo de nombre de Windows solo para QZ", () => {
    render(<ImpresoraCreateCaminoFields form={INITIAL_FORM} updateField={vi.fn()} />);
    expect(screen.getByLabelText(/Nombre en Windows/)).toBeInTheDocument();
  });
});
