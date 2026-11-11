import { describe, expect, it } from "vitest";
import { camposInicialesFilaOperador } from "./campos-iniciales-fila-operador";

describe("camposInicialesFilaOperador (REQ-180)", () => {
  it("copia el bloqueo de edición de la fila", () => {
    expect(
      camposInicialesFilaOperador({
        edit_locked_by: "u1",
        edit_locked_at: "2026-11-11T13:00:00.000Z",
        edit_locked_nombre: "Ana",
      }),
    ).toEqual({
      potencialDuplicado: false,
      potencialDuplicadoDe: [],
      editLockedBy: "u1",
      editLockedAt: "2026-11-11T13:00:00.000Z",
      editLockedNombre: "Ana",
    });
  });

  it.each([
    ["sin columnas", {}],
    ["columnas nulas", { edit_locked_by: null, edit_locked_at: null, edit_locked_nombre: null }],
  ])("%s: el bloqueo queda en null", (_nombre, fila) => {
    const campos = camposInicialesFilaOperador(fila);
    expect(campos.editLockedBy).toBeNull();
    expect(campos.editLockedAt).toBeNull();
    expect(campos.editLockedNombre).toBeNull();
  });

  it("el posible duplicado empieza en falso y sin coincidencias", () => {
    const campos = camposInicialesFilaOperador({});
    expect(campos.potencialDuplicado).toBe(false);
    expect(campos.potencialDuplicadoDe).toEqual([]);
  });
});
