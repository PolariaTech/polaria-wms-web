import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EmpresaListRow } from "../services/empresas.service";
import { EmpresaEditModal } from "./EmpresaEditModal";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- mock de next/image en tests
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

vi.mock("../services/empresas.service", () => ({
  updateEmpresaConfigurator: vi.fn(),
}));

const empresa: EmpresaListRow = {
  codigoEmpresa: "Y9IHZ",
  razonSocial: "Aguacates de puebla",
  telefono: null,
  estaActiva: true,
  schemaName: "emp_jbr_cygnus_y9ihz",
  rfc: "APU210325668",
  regimenFiscal: "601",
  codigoPostalExpedicion: "77560",
  nombreCuentaBancaria: "Aguacates de Puebla",
  banco: "BBVA",
  clabe: "012528001186364430",
  correoCobranza: "cobranza@aguacatesdepuebla.com",
  serieFactura: "CS-",
  logoPath: "Y9IHZ/logo.jpg",
};

describe("EmpresaEditModal", () => {
  it("muestra la ficha fiscal cargada y el logo guardado", () => {
    render(
      <EmpresaEditModal
        open
        empresa={empresa}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("RFC")).toHaveValue("APU210325668");
    expect(screen.getByLabelText("CLABE")).toHaveValue("012528001186364430");
    expect(screen.getByRole("img", { name: "Logo" })).toHaveAttribute(
      "src",
      "/api/empresa-logo?path=Y9IHZ%2Flogo.jpg",
    );
  });

  it("rechaza un GIF al elegirlo y conserva el logo guardado", () => {
    render(
      <EmpresaEditModal
        open
        empresa={empresa}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Logo"), {
      target: { files: [new File(["gif"], "logo.gif", { type: "image/gif" })] },
    });

    expect(screen.getByText("El logo debe ser JPEG o PNG.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Logo" })).toHaveAttribute(
      "src",
      "/api/empresa-logo?path=Y9IHZ%2Flogo.jpg",
    );
  });
});
