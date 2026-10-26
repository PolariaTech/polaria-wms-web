import { describe, expect, it } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
import {
  matchCompradorFromNombre,
  rankCompradoresFromNombre,
  shouldAutoAssignComprador,
} from "./match-comprador-from-nombre";

const rows: CompradorListRow[] = [
  {
    idComprador: "c1",
    codigo: "CYU0L",
    comprador: "Aureliano Buendía",
    apodo: "",
    telefono: null,
    rfc: "",
    grupo: "",
    estaActivo: true,
  },
  {
    idComprador: "c2",
    codigo: "HTLAVA",
    comprador: "Hotel Ava Resorts Cancun",
    apodo: "",
    telefono: null,
    rfc: "",
    grupo: "",
    estaActivo: true,
  },
  {
    idComprador: "c3",
    codigo: "LDCM",
    comprador: "LUIS DAVID CASTILLO MENDEZ",
    apodo: "",
    telefono: null,
    rfc: "",
    grupo: "",
    estaActivo: true,
  },
];

describe("matchCompradorFromNombre", () => {
  it("coincide por nombre exacto", () => {
    expect(matchCompradorFromNombre("Aureliano Buendía", rows)?.idComprador).toBe(
      "c1",
    );
  });

  it("coincide por código", () => {
    expect(matchCompradorFromNombre("CYU0L", rows)?.idComprador).toBe("c1");
  });

  it("no auto-asigna por frase larga (solo exacto)", () => {
    expect(
      matchCompradorFromNombre("Pedido para Hotel Ava Resorts Cancun", rows),
    ).toBeNull();
  });

  it("devuelve null si no hay match", () => {
    expect(matchCompradorFromNombre("Cliente inventado XYZ", rows)).toBeNull();
  });

  it("devuelve null con vacío", () => {
    expect(matchCompradorFromNombre(null, rows)).toBeNull();
    expect(matchCompradorFromNombre("  ", rows)).toBeNull();
  });
});

describe("rankCompradoresFromNombre", () => {
  it("sugiere hotel aunque el texto traiga ruido (score alto)", () => {
    const ranked = rankCompradoresFromNombre(
      "Pedido para Hotel Ava Resorts Cancun",
      rows,
    );
    expect(ranked.exact).toBeNull();
    expect(ranked.best?.idComprador).toBe("c2");
    expect(ranked.candidates[0]?.comprador.idComprador).toBe("c2");
  });

  it("sugiere por nombre parcial / typo leve con overlap fuerte", () => {
    const ranked = rankCompradoresFromNombre("Luis David Castillo", rows);
    expect(ranked.candidates.some((c) => c.comprador.idComprador === "c3")).toBe(
      true,
    );
  });

  it("sin exacto y score bajo: no inventa el más cercano (alerta de cliente)", () => {
    const ranked = rankCompradoresFromNombre("Carnitas Michoacan", rows);
    expect(ranked.exact).toBeNull();
    expect(ranked.candidates).toEqual([]);
    expect(ranked.best).toBeNull();
  });

  it("con match exacto no lista sugerencias", () => {
    const ranked = rankCompradoresFromNombre("Aureliano Buendía", rows);
    expect(ranked.exact?.idComprador).toBe("c1");
    expect(ranked.candidates).toEqual([]);
  });

  it("auto-asigna solo coincidencia total; parcial solo sugiere", () => {
    expect(
      shouldAutoAssignComprador(rankCompradoresFromNombre("Aureliano Buendía", rows))
        ?.idComprador,
    ).toBe("c1");

    const fuzzy = rankCompradoresFromNombre("Luis David", rows);
    expect(shouldAutoAssignComprador(fuzzy)).toBeNull();
    expect(fuzzy.candidates.length).toBeGreaterThan(0);

    const hiltonRows: CompradorListRow[] = [
      ...rows,
      {
        idComprador: "c-hilton",
        codigo: "CESHIL",
        comprador: "CESAR HILTON",
        apodo: "",
        telefono: null,
        rfc: "",
        grupo: "",
        estaActivo: true,
      },
    ];
    const hilton = rankCompradoresFromNombre(
      "Hilton CANCUN MAR CARIBE ALL-INCLUSIVE RESORT, MEXICO",
      hiltonRows,
    );
    // Solo comparte «Hilton»: nunca auto-asignar CESAR HILTON.
    expect(shouldAutoAssignComprador(hilton)).toBeNull();
    expect(hilton.exact).toBeNull();
    // Score bajo → sin sugerencia débil (más alertas de cliente).
    expect(hilton.candidates).toEqual([]);
    expect(hilton.best).toBeNull();
  });

  it("REQ-116: auto-asigna FAIRMONT MAYAKOBA con ≥2 tokens fuertes", () => {
    const fairmontRows: CompradorListRow[] = [
      ...rows,
      {
        idComprador: "c-fairmont",
        codigo: "FAIRMAY",
        comprador: "FAIRMONT MAYAKOBA",
        apodo: "",
        telefono: null,
        rfc: "",
        grupo: "",
        estaActivo: true,
      },
      {
        idComprador: "c-fairmont-other",
        codigo: "FAIROTHER",
        comprador: "FAIRMONT ACAPULCO",
        apodo: "",
        telefono: null,
        rfc: "",
        grupo: "",
        estaActivo: true,
      },
    ];
    const ranked = rankCompradoresFromNombre(
      "FAIRMONT MAYAKOBA",
      fairmontRows,
    );
    expect(
      shouldAutoAssignComprador(ranked, "FAIRMONT MAYAKOBA")?.idComprador,
    ).toBe("c-fairmont");
  });

  it("token genérico Cancun no auto-asigna ni fuerza sugerencia débil", () => {
    const cancunRows: CompradorListRow[] = [
      ...rows,
      {
        idComprador: "c-other",
        codigo: "OTRCAN",
        comprador: "Otro Resort Cancun",
        apodo: "",
        telefono: null,
        rfc: "",
        grupo: "",
        estaActivo: true,
      },
    ];
    const ranked = rankCompradoresFromNombre(
      "Pedido urgente Cancun zona hotelera",
      cancunRows,
    );
    expect(shouldAutoAssignComprador(ranked)).toBeNull();
    expect(ranked.exact).toBeNull();
    // Contención/token débil no debe quedar como cliente elegido.
    expect(ranked.candidates.every((c) => c.score >= 0.55)).toBe(true);
  });
});
