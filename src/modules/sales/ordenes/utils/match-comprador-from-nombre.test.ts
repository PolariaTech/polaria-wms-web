import { describe, expect, it } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
import { matchCompradorFromNombre } from "./match-comprador-from-nombre";

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

  it("no hace match difuso por frase larga", () => {
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
