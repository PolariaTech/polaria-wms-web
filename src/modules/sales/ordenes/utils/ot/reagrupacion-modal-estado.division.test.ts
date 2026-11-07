import { describe, expect, it } from "vitest";
import type { DivisionReagrupacionApi } from "../../services/reagrupar-ot.client";
import {
  ESTADO_INICIAL_REAGRUPACION,
  reducirModalReagrupacion,
  type EstadoModalReagrupacion,
} from "./reagrupacion-modal-estado";

const division: DivisionReagrupacionApi = {
  criterio: "oc",
  valoresSalen: ["4502988746"],
  valoresQuedan: ["4502988065"],
  otIdsQueSalen: ["ot-2"],
};

function generando(): EstadoModalReagrupacion {
  let estado = reducirModalReagrupacion(ESTADO_INICIAL_REAGRUPACION, {
    tipo: "ESCRIBIR",
    texto: "Crea dos pedidos, uno por cada orden de compra",
  });
  estado = reducirModalReagrupacion(estado, {
    tipo: "GENERAR",
    requestId: "req-1",
    firmaBase: "firma-1",
  });
  return estado;
}

describe("reducirModalReagrupacion con división en otra OV (REQ-262)", () => {
  it("una respuesta de división pasa a la fase propuesta con el plan y sin propuesta de movimientos", () => {
    const estado = reducirModalReagrupacion(generando(), {
      tipo: "RESPUESTA",
      requestId: "req-1",
      respuesta: { tipo: "division", division },
    });

    expect(estado.fase).toBe("propuesta");
    expect(estado.division).toEqual(division);
    expect(estado.propuesta).toBeNull();
    expect(estado.requestId).toBeNull();
    expect(estado.firmaBase).toBe("firma-1");
  });

  it("una respuesta tardía de otra petición no cambia nada", () => {
    const antes = generando();

    const despues = reducirModalReagrupacion(antes, {
      tipo: "RESPUESTA",
      requestId: "req-viejo",
      respuesta: { tipo: "division", division },
    });

    expect(despues).toBe(antes);
  });

  it("rechazar el plan limpia la división y guarda la instrucción en el historial", () => {
    const conPlan = reducirModalReagrupacion(generando(), {
      tipo: "RESPUESTA",
      requestId: "req-1",
      respuesta: { tipo: "division", division },
    });

    const estado = reducirModalReagrupacion(conPlan, { tipo: "RECHAZAR" });

    expect(estado.division).toBeNull();
    expect(estado.fase).toBe("escribiendo");
    expect(estado.historial).toEqual(["Crea dos pedidos, uno por cada orden de compra"]);
  });

  it("invalidar el plan (por ejemplo, si no se pudo dividir) muestra el mensaje y descarta la división", () => {
    const conPlan = reducirModalReagrupacion(generando(), {
      tipo: "RESPUESTA",
      requestId: "req-1",
      respuesta: { tipo: "division", division },
    });

    const estado = reducirModalReagrupacion(conPlan, {
      tipo: "INVALIDAR",
      mensaje: "Esta orden ya no está por confirmar.",
    });

    expect(estado.fase).toBe("error");
    expect(estado.division).toBeNull();
    expect(estado.error).toBe("Esta orden ya no está por confirmar.");
  });

  it("generar de nuevo descarta la división anterior", () => {
    const conPlan = reducirModalReagrupacion(generando(), {
      tipo: "RESPUESTA",
      requestId: "req-1",
      respuesta: { tipo: "division", division },
    });
    const conError = reducirModalReagrupacion(conPlan, {
      tipo: "INVALIDAR",
      mensaje: "x",
    });

    const estado = reducirModalReagrupacion(conError, {
      tipo: "GENERAR",
      requestId: "req-2",
      firmaBase: "firma-2",
    });

    expect(estado.division).toBeNull();
    expect(estado.fase).toBe("generando");
  });
});
