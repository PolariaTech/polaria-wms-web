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
    telefono: null,
    grupo: "",
    estaActivo: true,
  },
  {
    idComprador: "c2",
    codigo: "HTLAVA",
    comprador: "Hotel Ava Resorts Cancun",
    telefono: null,
    grupo: "",
    estaActivo: true,
  },
  {
    idComprador: "c3",
    codigo: "LDCM",
    comprador: "LUIS DAVID CASTILLO MENDEZ",
    telefono: null,
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
  it("sugiere hotel aunque el texto traiga ruido", () => {
    const ranked = rankCompradoresFromNombre(
      "Pedido para Hotel Ava Resorts Cancun",
      rows,
    );
    expect(ranked.exact).toBeNull();
    expect(ranked.best?.idComprador).toBe("c2");
    expect(ranked.candidates[0]?.comprador.idComprador).toBe("c2");
  });

  it("sugiere por nombre parcial / typo leve", () => {
    const ranked = rankCompradoresFromNombre("Luis David Castillo", rows);
    expect(ranked.candidates.some((c) => c.comprador.idComprador === "c3")).toBe(
      true,
    );
  });

  it("sin exacto siempre sugiere al más cercano (aunque el score sea bajo)", () => {
    const ranked = rankCompradoresFromNombre("Carnitas Michoacan", rows);
    expect(ranked.exact).toBeNull();
    expect(ranked.candidates.length).toBeGreaterThan(0);
    expect(ranked.best).not.toBeNull();
  });

  it("con match exacto no lista sugerencias", () => {
    const ranked = rankCompradoresFromNombre("Aureliano Buendía", rows);
    expect(ranked.exact?.idComprador).toBe("c1");
    expect(ranked.candidates).toEqual([]);
  });

  it("auto-asigna solo exactos o fuzzy muy claros", () => {
    expect(
      shouldAutoAssignComprador(rankCompradoresFromNombre("Aureliano Buendía", rows))
        ?.idComprador,
    ).toBe("c1");

    const fuzzy = rankCompradoresFromNombre("Luis David", rows);
    // Puede sugerir, pero no siempre auto-asignar si el score no es alto.
    const auto = shouldAutoAssignComprador(fuzzy);
    if (auto) {
      expect(auto.idComprador).toBe("c3");
    } else {
      expect(fuzzy.candidates.length).toBeGreaterThan(0);
    }
  });
});
