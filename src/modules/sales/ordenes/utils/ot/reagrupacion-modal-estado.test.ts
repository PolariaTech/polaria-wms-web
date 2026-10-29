import { describe, expect, it, vi } from "vitest";
import type { PropuestaReagrupacionApi } from "./reagrupar-ordenes-trabajo";
import {
  armarPickerOtRespaldo,
  decidirAperturaReagruparAlCargar,
  ESTADO_INICIAL_REAGRUPACION,
  LIMITE_INSTRUCCION_REAGRUPACION,
  MENSAJE_FUERA_DE_ALCANCE,
  puedeGenerar,
  puedeModificarConIaDesdeLista,
  reagruparAbiertoSegunCypher,
  reagruparModalAbierto,
  reducirModalReagrupacion,
  type AccionModalReagrupacion,
  type EstadoModalReagrupacion,
} from "./reagrupacion-modal-estado";

const propuesta: PropuestaReagrupacionApi = {
  propuestaId: "prop-1",
  baseHash: "hash",
  ots: [],
  resumen: { antes: 5, despues: 3, nuevas: 0, vacias: 2 },
  movimientos: [],
};

function correr(...acciones: AccionModalReagrupacion[]): EstadoModalReagrupacion {
  return acciones.reduce(reducirModalReagrupacion, ESTADO_INICIAL_REAGRUPACION);
}

const escribir = (texto: string): AccionModalReagrupacion => ({ tipo: "ESCRIBIR", texto });
const generar = (requestId: string): AccionModalReagrupacion => ({
  tipo: "GENERAR",
  requestId,
  firmaBase: "firma-1",
});

describe("reducirModalReagrupacion", () => {
  it("arranca escribiendo, sin instrucción y sin permitir generar", () => {
    expect(ESTADO_INICIAL_REAGRUPACION.fase).toBe("escribiendo");
    expect(puedeGenerar(ESTADO_INICIAL_REAGRUPACION)).toBe(false);
  });

  it("no genera con una instrucción vacía o de solo espacios", () => {
    expect(puedeGenerar(correr(escribir("   ")))).toBe(false);
    expect(correr(escribir("   "), generar("r1")).fase).toBe("escribiendo");
  });

  it("respeta el límite de la instrucción: 4000 permite generar, 4001 no (se cuenta tras recortar)", () => {
    const enElLimite = "a".repeat(LIMITE_INSTRUCCION_REAGRUPACION);
    expect(puedeGenerar(correr(escribir(enElLimite)))).toBe(true);
    expect(puedeGenerar(correr(escribir(`  ${enElLimite}  `)))).toBe(true);
    expect(puedeGenerar(correr(escribir(`${enElLimite}a`)))).toBe(false);
    expect(correr(escribir(`${enElLimite}a`), generar("r1")).fase).toBe("escribiendo");
  });

  it("generar pasa a 'generando' con el requestId y la firma del estado", () => {
    const estado = correr(escribir("Junta las OT"), generar("r1"));

    expect(estado.fase).toBe("generando");
    expect(estado.requestId).toBe("r1");
    expect(estado.firmaBase).toBe("firma-1");
  });

  it("CA5: un segundo GENERAR mientras hay una petición en curso se ignora", () => {
    const enCurso = correr(escribir("Junta las OT"), generar("r1"));
    const despues = reducirModalReagrupacion(enCurso, generar("r2"));

    expect(despues).toBe(enCurso);
    expect(despues.requestId).toBe("r1");
  });

  it("el texto no se puede editar mientras genera ni mientras se revisa la propuesta", () => {
    const generando = correr(escribir("Junta las OT"), generar("r1"));
    expect(reducirModalReagrupacion(generando, escribir("otra cosa"))).toBe(generando);

    const conPropuesta = reducirModalReagrupacion(generando, {
      tipo: "RESPUESTA",
      requestId: "r1",
      respuesta: { tipo: "propuesta", propuesta },
    });
    expect(reducirModalReagrupacion(conPropuesta, escribir("otra cosa"))).toBe(conPropuesta);
  });

  it("una propuesta válida pasa a 'propuesta' y libera el requestId", () => {
    const estado = correr(escribir("Junta las OT"), generar("r1"), {
      tipo: "RESPUESTA",
      requestId: "r1",
      respuesta: { tipo: "propuesta", propuesta },
    });

    expect(estado.fase).toBe("propuesta");
    expect(estado.propuesta).toBe(propuesta);
    expect(estado.requestId).toBeNull();
  });

  it("CA6: una respuesta de otra petición (o tardía tras cancelar) se descarta", () => {
    const generando = correr(escribir("Junta las OT"), generar("r1"));

    const deOtraPeticion = reducirModalReagrupacion(generando, {
      tipo: "RESPUESTA",
      requestId: "r-vieja",
      respuesta: { tipo: "propuesta", propuesta },
    });
    expect(deOtraPeticion).toBe(generando);

    const cancelado = reducirModalReagrupacion(generando, { tipo: "CANCELAR" });
    const tardia = reducirModalReagrupacion(cancelado, {
      tipo: "RESPUESTA",
      requestId: "r1",
      respuesta: { tipo: "propuesta", propuesta },
    });
    expect(tardia).toBe(cancelado);
    expect(tardia.fase).toBe("escribiendo");
  });

  it("un fallo de otra petición se ignora y uno vigente deja el error visible con el texto conservado", () => {
    const generando = correr(escribir("Junta las OT"), generar("r1"));

    expect(
      reducirModalReagrupacion(generando, { tipo: "FALLO", requestId: "otra", mensaje: "x" }),
    ).toBe(generando);

    const conError = reducirModalReagrupacion(generando, {
      tipo: "FALLO",
      requestId: "r1",
      mensaje: "La IA tardó demasiado.",
    });
    expect(conError.fase).toBe("error");
    expect(conError.error).toBe("La IA tardó demasiado.");
    expect(conError.instruccion).toBe("Junta las OT");
    expect(puedeGenerar(conError)).toBe(true);
  });

  it("tras un error se puede editar el texto y volver a generar", () => {
    const conError = correr(escribir("Junta"), generar("r1"), {
      tipo: "FALLO",
      requestId: "r1",
      mensaje: "falló",
    });
    const reintento = reducirModalReagrupacion(
      reducirModalReagrupacion(conError, escribir("Junta las OT de bares")),
      generar("r2"),
    );

    expect(reintento.fase).toBe("generando");
    expect(reintento.requestId).toBe("r2");
    expect(reintento.error).toBeNull();
  });

  it("aclaración y rechazo del modelo vuelven a escribir con un aviso", () => {
    const aclaracion = correr(escribir("arréglalas"), generar("r1"), {
      tipo: "RESPUESTA",
      requestId: "r1",
      respuesta: { tipo: "aclaracion", mensaje: "No quedó claro." },
    });
    expect(aclaracion.fase).toBe("escribiendo");
    expect(aclaracion.aviso).toBe("No quedó claro.");
    expect(aclaracion.instruccion).toBe("arréglalas");

    const rechazo = correr(escribir("cambia la cantidad"), generar("r1"), {
      tipo: "RESPUESTA",
      requestId: "r1",
      respuesta: { tipo: "rechazo" },
    });
    expect(rechazo.fase).toBe("escribiendo");
    expect(rechazo.aviso).toBe(MENSAJE_FUERA_DE_ALCANCE);
  });

  it("cancelar solo actúa mientras genera y devuelve el control al usuario", () => {
    expect(
      reducirModalReagrupacion(ESTADO_INICIAL_REAGRUPACION, { tipo: "CANCELAR" }),
    ).toBe(ESTADO_INICIAL_REAGRUPACION);

    const cancelado = correr(escribir("Junta"), generar("r1"), { tipo: "CANCELAR" });
    expect(cancelado.fase).toBe("escribiendo");
    expect(cancelado.requestId).toBeNull();
    expect(cancelado.instruccion).toBe("Junta");
  });

  it("rechazar guarda la instrucción en el historial y deja escribir una nueva", () => {
    const rechazada = correr(
      escribir("  Junta todo  "),
      generar("r1"),
      { tipo: "RESPUESTA", requestId: "r1", respuesta: { tipo: "propuesta", propuesta } },
      { tipo: "RECHAZAR" },
    );

    expect(rechazada.fase).toBe("escribiendo");
    expect(rechazada.historial).toEqual(["Junta todo"]);
    expect(rechazada.instruccion).toBe("");
    expect(rechazada.propuesta).toBeNull();

    // Segundo turno: el historial se acumula en orden.
    const segundoTurno = reducirModalReagrupacion(
      correr(
        escribir("Junta todo"),
        generar("r1"),
        { tipo: "RESPUESTA", requestId: "r1", respuesta: { tipo: "propuesta", propuesta } },
        { tipo: "RECHAZAR" },
        escribir("deja spa aparte"),
        generar("r2"),
        { tipo: "RESPUESTA", requestId: "r2", respuesta: { tipo: "propuesta", propuesta } },
      ),
      { tipo: "RECHAZAR" },
    );
    expect(segundoTurno.historial).toEqual(["Junta todo", "deja spa aparte"]);
  });

  it("rechazar solo actúa cuando hay una propuesta", () => {
    const escribiendo = correr(escribir("Junta"));
    expect(reducirModalReagrupacion(escribiendo, { tipo: "RECHAZAR" })).toBe(escribiendo);
  });

  it("invalidar descarta la propuesta, conserva el texto y deja volver a generar", () => {
    const conPropuesta = correr(escribir("Junta"), generar("r1"), {
      tipo: "RESPUESTA",
      requestId: "r1",
      respuesta: { tipo: "propuesta", propuesta },
    });

    const invalidada = reducirModalReagrupacion(conPropuesta, {
      tipo: "INVALIDAR",
      mensaje: "El formulario cambió.",
    });

    expect(invalidada.fase).toBe("error");
    expect(invalidada.error).toBe("El formulario cambió.");
    expect(invalidada.propuesta).toBeNull();
    expect(invalidada.instruccion).toBe("Junta");
    expect(puedeGenerar(invalidada)).toBe(true);

    // Solo aplica cuando hay una propuesta que invalidar.
    const escribiendo = correr(escribir("Junta"));
    expect(
      reducirModalReagrupacion(escribiendo, { tipo: "INVALIDAR", mensaje: "x" }),
    ).toBe(escribiendo);
  });

  it("reiniciar vuelve al estado inicial", () => {
    const estado = correr(escribir("Junta"), generar("r1"), { tipo: "REINICIAR" });
    expect(estado).toEqual(ESTADO_INICIAL_REAGRUPACION);
  });
});

describe("textos y cierre del chat de reorganizar OT", () => {
  it("el mensaje de fuera de alcance dice que se pueden crear, modificar o eliminar OT", () => {
    expect(MENSAJE_FUERA_DE_ALCANCE).toBe(
      "Solo puedo crear, modificar o eliminar órdenes de trabajo. No puedo cambiar cantidades ni datos del pedido.",
    );
  });

  it("el chat se cierra cuando se cierra el Cypher", () => {
    const abierto = {
      reagruparOpen: true,
      cypherOpen: true,
      isEditing: true,
      tieneOrdenVenta: true,
    };
    expect(reagruparModalAbierto(abierto)).toBe(true);
    expect(reagruparModalAbierto({ ...abierto, cypherOpen: false })).toBe(false);
  });

  it("el chat no se abre sin edición, sin OV o sin haberlo pedido", () => {
    const abierto = {
      reagruparOpen: true,
      cypherOpen: true,
      isEditing: true,
      tieneOrdenVenta: true,
    };
    expect(reagruparModalAbierto({ ...abierto, isEditing: false })).toBe(false);
    expect(reagruparModalAbierto({ ...abierto, tieneOrdenVenta: false })).toBe(false);
    expect(reagruparModalAbierto({ ...abierto, reagruparOpen: false })).toBe(false);
  });
});

describe("puedeModificarConIaDesdeLista (REQ-188)", () => {
  const base = {
    inspect: false,
    cypherId: "ov-1",
    formularioAbierto: false,
    detalleAbierto: false,
    estadoOrdenVenta: "por_confirmar",
  };

  it("CA1: con el Cypher solo abierto y la OV por confirmar, el botón aparece", () => {
    expect(puedeModificarConIaDesdeLista(base)).toBe(true);
  });

  it.each(["confirmada", "alistamiento", "alistada", "cancelada", null, undefined])(
    "CA2: con la OV en %s no aparece",
    (estadoOrdenVenta) => {
      expect(puedeModificarConIaDesdeLista({ ...base, estadoOrdenVenta })).toBe(false);
    },
  );

  it("CA2b: un estado legado se trata como el formulario (por confirmar), igual que normalizeEstadoOrdenVenta", () => {
    expect(puedeModificarConIaDesdeLista({ ...base, estadoOrdenVenta: "borrador" })).toBe(true);
    expect(puedeModificarConIaDesdeLista({ ...base, estadoOrdenVenta: "   " })).toBe(false);
  });

  it("CA3: no aparece sin Cypher abierto ni en modo inspección", () => {
    expect(puedeModificarConIaDesdeLista({ ...base, cypherId: null })).toBe(false);
    expect(puedeModificarConIaDesdeLista({ ...base, inspect: true })).toBe(false);
  });

  it("CA4: con el formulario o el detalle abiertos el botón lo publica el formulario", () => {
    expect(puedeModificarConIaDesdeLista({ ...base, formularioAbierto: true })).toBe(false);
    expect(puedeModificarConIaDesdeLista({ ...base, detalleAbierto: true })).toBe(false);
  });
});

describe("armarPickerOtRespaldo (REQ-188)", () => {
  const hijas = [
    { id: "ot-1", label: "OT 1", renglones: [{}, {}], totalCantidad: 5, almacen: "Frío" },
    { id: "ot-2", label: "OT 2", renglones: [{}], totalCantidad: 1, almacen: "Seco" },
  ];

  it("CA1: lleva el botón «Modificar con IA» cuando la página lo entrega", () => {
    const onReagrupar = vi.fn();
    const picker = armarPickerOtRespaldo({
      hijas,
      selectedId: null,
      onSelect: vi.fn(),
      onReagrupar,
    });

    expect(picker?.onReagrupar).toBe(onReagrupar);
    expect(picker?.hijas.map((hija) => hija.productosCount)).toEqual([2, 1]);
  });

  it("CA2: sin acción de la página no hay botón", () => {
    const picker = armarPickerOtRespaldo({
      hijas,
      selectedId: "ot-2",
      onSelect: vi.fn(),
    });

    expect(picker?.onReagrupar).toBeUndefined();
    expect(picker?.selectedId).toBe("ot-2");
  });

  it("CA3: sin selección toma la primera OT, y sin OT no hay selector", () => {
    expect(
      armarPickerOtRespaldo({ hijas, selectedId: null, onSelect: vi.fn() })?.selectedId,
    ).toBe("ot-1");
    expect(
      armarPickerOtRespaldo({ hijas: [], selectedId: null, onSelect: vi.fn() }),
    ).toBeNull();
  });
});

describe("decidirAperturaReagruparAlCargar (REQ-188)", () => {
  const listo = {
    pedida: true,
    formularioAbierto: true,
    editando: true,
    ordenCargada: true,
    estadoOrdenVenta: "por_confirmar",
    cantidadOt: 2,
  };

  it("CA1: con el formulario cargado y la OV por confirmar, abre el chat", () => {
    expect(decidirAperturaReagruparAlCargar(listo)).toBe("abrir");
  });

  it("CA2: espera mientras el formulario no trae el estado ni las OT", () => {
    expect(decidirAperturaReagruparAlCargar({ ...listo, estadoOrdenVenta: null })).toBe("esperar");
    expect(decidirAperturaReagruparAlCargar({ ...listo, cantidadOt: 0 })).toBe("esperar");
  });

  it("CA3: si la OV ya no está por confirmar, descarta la petición sin abrir", () => {
    expect(
      decidirAperturaReagruparAlCargar({ ...listo, estadoOrdenVenta: "confirmada" }),
    ).toBe("descartar");
  });

  it("CA4: sin petición, sin formulario abierto o sin edición no hace nada", () => {
    expect(decidirAperturaReagruparAlCargar({ ...listo, pedida: false })).toBe("ninguna");
    expect(decidirAperturaReagruparAlCargar({ ...listo, formularioAbierto: false })).toBe("ninguna");
    expect(decidirAperturaReagruparAlCargar({ ...listo, editando: false })).toBe("ninguna");
  });
});

describe("decidirAperturaReagruparAlCargar — datos de la OV anterior (REQ-188, «a veces solo abre el formulario»)", () => {
  const pedido = {
    pedida: true,
    formularioAbierto: true,
    editando: true,
    estadoOrdenVenta: "por_confirmar",
    cantidadOt: 2,
  };

  it("mientras el formulario aún trae el estado y las OT de la OV anterior, espera (no abre ni descarta)", () => {
    // Primer render al abrir otra OV: estado y OT son los de la anterior, ordenCargada = false.
    expect(decidirAperturaReagruparAlCargar({ ...pedido, ordenCargada: false })).toBe("esperar");
    // Aunque la OV anterior hubiera estado confirmada, no se descarta la petición con datos ajenos.
    expect(
      decidirAperturaReagruparAlCargar({ ...pedido, ordenCargada: false, estadoOrdenVenta: "confirmada" }),
    ).toBe("esperar");
  });

  it("una vez cargada la OV pedida decide con sus datos", () => {
    expect(decidirAperturaReagruparAlCargar({ ...pedido, ordenCargada: true })).toBe("abrir");
    expect(
      decidirAperturaReagruparAlCargar({ ...pedido, ordenCargada: true, estadoOrdenVenta: "confirmada" }),
    ).toBe("descartar");
  });

  it("sin petición no hace nada aunque no esté cargada", () => {
    expect(decidirAperturaReagruparAlCargar({ ...pedido, pedida: false, ordenCargada: false })).toBe("ninguna");
  });
});

describe("reagruparAbiertoSegunCypher (el chat se cierra con el Cypher)", () => {
  it("con el Cypher cerrado el chat queda cerrado, aunque estuviera abierto", () => {
    expect(reagruparAbiertoSegunCypher(true, false)).toBe(false);
  });

  it("con el Cypher abierto respeta el estado del chat", () => {
    expect(reagruparAbiertoSegunCypher(true, true)).toBe(true);
    expect(reagruparAbiertoSegunCypher(false, true)).toBe(false);
  });

  it("cerrar el Cypher y volver a abrirlo no hace reaparecer el chat", () => {
    let reagruparOpen = true;
    // Se cierra el Cypher con la X.
    reagruparOpen = reagruparAbiertoSegunCypher(reagruparOpen, false);
    // Se vuelve a abrir el Cypher con el «+».
    reagruparOpen = reagruparAbiertoSegunCypher(reagruparOpen, true);
    expect(reagruparOpen).toBe(false);
    expect(reagruparModalAbierto({ reagruparOpen, cypherOpen: true, isEditing: true, tieneOrdenVenta: true })).toBe(false);
  });
});
