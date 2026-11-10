/**
 * REQ-300: instrucciones modelo del modal «Reorganizar órdenes de trabajo».
 *
 * Los de «corregir» solo prometen lo que la relectura usa hoy: pedir releer, el total
 * esperado y el número de órdenes de trabajo. El resto del texto no llega al modelo que
 * relee (POL-414); cuando llegue, se agregan modelos más específicos.
 *
 * Además de ahorrar escritura, enseñan cómo se redacta una buena instrucción:
 * qué quiero, sobre qué (almacén, producto, orden de compra) y, al corregir la
 * lectura, cómo debe quedar (el total o el número de órdenes que se espera).
 * Son plantillas: no llevan nombres de ninguna orden. Almacenes, productos, días,
 * horarios y números quedan entre corchetes para que la persona los complete
 * («Generar» no avanza hasta entonces).
 */
export type GrupoInstruccion = "reorganizar" | "dividir" | "corregir";

export const TITULO_GRUPO_INSTRUCCION: Record<GrupoInstruccion, string> = {
  reorganizar: "Reorganizar las órdenes de trabajo",
  dividir: "Dividir la orden de venta",
  corregir: "Corregir la lectura del correo",
};

export const ORDEN_GRUPOS_INSTRUCCION: readonly GrupoInstruccion[] = [
  "reorganizar",
  "dividir",
  "corregir",
];

export interface InstruccionFrecuente {
  id: string;
  grupo: GrupoInstruccion;
  /** Texto corto del botón. */
  etiqueta: string;
  /** Instrucción completa que se escribe en el campo, con sus huecos. */
  texto: string;
}

const LEER_CORREO = "Vuelve a leer el correo y los archivos.";

export const INSTRUCCIONES_FRECUENTES_REAGRUPACION: readonly InstruccionFrecuente[] = [
  {
    id: "juntar-ordenes",
    grupo: "reorganizar",
    etiqueta: "Juntar dos órdenes",
    texto:
      "Junta las órdenes de trabajo de [almacén 1] y [almacén 2] en una sola. Deja todos los productos en la orden de [almacén 1].",
  },
  {
    id: "mover-producto",
    grupo: "reorganizar",
    etiqueta: "Mover un producto",
    texto:
      "Mueve [producto] de la orden de [almacén de origen] a la orden de [almacén de destino].",
  },
  {
    id: "partir-orden",
    grupo: "reorganizar",
    etiqueta: "Partir una orden en dos",
    texto:
      "Divide la orden de trabajo de [almacén] en dos: deja [producto] en una orden nueva y el resto en la actual.",
  },
  {
    id: "dividir-por-oc",
    grupo: "dividir",
    etiqueta: "Por orden de compra",
    texto:
      "Divide la orden de venta por orden de compra: la orden de compra [número de orden de compra] pasa a una orden de venta nueva y las demás se quedan en esta.",
  },
  {
    id: "dividir-por-dia",
    grupo: "dividir",
    etiqueta: "Por día de entrega",
    texto:
      "Divide la orden de venta por día de entrega: lo que se entrega el [día] pasa a una orden de venta nueva y lo demás se queda en esta.",
  },
  {
    id: "dividir-por-horario",
    grupo: "dividir",
    etiqueta: "Por horario de entrega",
    texto:
      "Divide la orden de venta por horario de entrega: lo que se entrega en el horario [horario] pasa a una orden de venta nueva y lo demás se queda en esta.",
  },
  {
    id: "nombres-incorrectos",
    grupo: "corregir",
    etiqueta: "Nombres incorrectos",
    texto:
      "Vuelve a leer el correo. Los nombres de los productos están incorrectos.",
  },
  {
    id: "total-no-coincide",
    grupo: "corregir",
    etiqueta: "El total no coincide",
    texto:
      `${LEER_CORREO} El total del pedido debe ser [total].`,
  },
  {
    id: "faltan-ordenes-de-trabajo",
    grupo: "corregir",
    etiqueta: "Faltan órdenes de trabajo",
    texto:
      `${LEER_CORREO} Debería haber [número] órdenes de trabajo.`,
  },
];

const HUECO = /\[[^\]\n]+\]/;

/** Queda algún «[hueco]» sin completar: la instrucción no está lista para enviarse. */
export function tieneHuecosSinCompletar(instruccion: string): boolean {
  return HUECO.test(instruccion);
}

/**
 * Campo vacío: queda la instrucción modelo. Con texto escrito: se agrega en una línea
 * nueva (sin pisar lo que la persona escribió) y, si ya estaba, no se repite.
 * `seleccion` marca el primer hueco por completar; si no hay, el cursor va al final.
 */
export function aplicarInstruccionFrecuente(
  actual: string,
  texto: string,
): { valor: string; seleccion: { inicio: number; fin: number } } {
  let valor: string;
  if (actual.trim() === "") valor = texto;
  else if (actual.includes(texto)) valor = actual;
  else valor = `${actual.trimEnd()}\n${texto}`;

  const base = Math.max(valor.lastIndexOf(texto), 0);
  const hueco = HUECO.exec(texto);
  return {
    valor,
    seleccion: hueco
      ? { inicio: base + hueco.index, fin: base + hueco.index + hueco[0].length }
      : { inicio: valor.length, fin: valor.length },
  };
}
