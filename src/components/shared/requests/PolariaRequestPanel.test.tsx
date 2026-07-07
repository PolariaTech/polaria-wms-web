import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Box, MapPin } from "lucide-react";
import { PolariaRequestFlowCard } from "./PolariaRequestFlowCard";
import { PolariaRequestPanel } from "./PolariaRequestPanel";

describe("PolariaRequestPanel", () => {
  it("muestra estado vacío con paleta compartida", () => {
    render(
      <PolariaRequestPanel
        title="Integración"
        emptyMessage="No hay solicitudes pendientes."
        emptyHint="Las nuevas solicitudes aparecerán aquí."
      />,
    );

    expect(screen.getByText("Integración")).toBeInTheDocument();
    expect(screen.getByText("No hay solicitudes pendientes.")).toBeInTheDocument();
    expect(
      screen.getByText("Las nuevas solicitudes aparecerán aquí."),
    ).toBeInTheDocument();
  });

  it("muestra badges de pendientes y total", () => {
    render(
      <PolariaRequestPanel
        title="Integración"
        pendingCount={1}
        totalCount={1}
        emptyMessage="Vacío"
      >
        <p>Contenido</p>
      </PolariaRequestPanel>,
    );

    expect(screen.getByText("1 Pendiente")).toBeInTheDocument();
    expect(screen.getByText("1 solicitud")).toBeInTheDocument();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });

  it("renderiza footer dentro del panel", () => {
    render(
      <PolariaRequestPanel
        title="A bodega"
        emptyMessage="Vacío"
        footer={<button type="button">Alertas</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Alertas" })).toBeInTheDocument();
  });

  it("admite etiqueta de total y badge fijo Pendiente", () => {
    render(
      <PolariaRequestPanel
        title="A bodega"
        totalCount={0}
        formatTotalCount={(count) => `${count} tareas`}
        showPendingStatus
        emptyMessage="Vacío"
      >
        <p>Bandeja</p>
      </PolariaRequestPanel>,
    );

    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("0 tareas")).toBeInTheDocument();
    expect(screen.getByText("Bandeja")).toBeInTheDocument();
  });
});

describe("PolariaRequestFlowCard", () => {
  it("renderiza flujo origen → destino y metadatos", () => {
    render(
      <PolariaRequestFlowCard
        hint="Solicitud de integración"
        source={{
          label: "Cuenta",
          value: "Tecno-Tech",
          icon: MapPin,
          tone: "teal",
        }}
        destination={{
          label: "Bodega externa",
          value: "Prueba 3",
          icon: Box,
          tone: "warning",
        }}
        typeLabel="Scraping"
        metadata={[
          { icon: Box, label: "Solicitado por", value: "operador@test.com" },
        ]}
      />,
    );

    expect(screen.getByText("Solicitud de integración")).toBeInTheDocument();
    expect(screen.getByText("Tecno-Tech")).toBeInTheDocument();
    expect(screen.getByText("Prueba 3")).toBeInTheDocument();
    expect(screen.getByText("Scraping")).toBeInTheDocument();
    expect(screen.getByText("operador@test.com")).toBeInTheDocument();
  });
});
