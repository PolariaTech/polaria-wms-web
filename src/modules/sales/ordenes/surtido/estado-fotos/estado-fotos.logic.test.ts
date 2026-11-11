import { describe, expect, it } from "vitest";
import {
  claveComparable,
  estaColgada,
  formatearDuracion,
  limitesDeRango,
  MENSAJE_FOTO_GENERICO,
  mensajeParaOperador,
  otsDeOrigen,
  partesDeOt,
  resumirFotos,
  tiempoTotalMs,
} from "./estado-fotos.logic";

// 2026-11-06 20:00 en Colombia = 2026-11-07 01:00 UTC: el día de Colombia sigue siendo el 6.
const AHORA = new Date("2026-11-07T01:00:00.000Z");

describe("limitesDeRango (día de Colombia, UTC-5)", () => {
  it("hoy va de la medianoche de Colombia a la siguiente", () => {
    expect(limitesDeRango("hoy", AHORA)).toEqual({
      desde: "2026-11-06T05:00:00.000Z",
      hasta: "2026-11-07T05:00:00.000Z",
    });
  });

  it("ayer termina donde empieza hoy", () => {
    expect(limitesDeRango("ayer", AHORA)).toEqual({
      desde: "2026-11-05T05:00:00.000Z",
      hasta: "2026-11-06T05:00:00.000Z",
    });
  });

  it("los últimos 7 días incluyen hoy", () => {
    expect(limitesDeRango("7dias", AHORA)).toEqual({
      desde: "2026-10-31T05:00:00.000Z",
      hasta: "2026-11-07T05:00:00.000Z",
    });
  });

  it("los últimos 30 días incluyen hoy y empiezan 29 días antes", () => {
    expect(limitesDeRango("30dias", AHORA)).toEqual({
      desde: "2026-10-08T05:00:00.000Z",
      hasta: "2026-11-07T05:00:00.000Z",
    });
  });

  it("a las 23:30 UTC todavía es el mismo día en Colombia", () => {
    const tarde = new Date("2026-11-06T23:30:00.000Z");
    expect(limitesDeRango("hoy", tarde).desde).toBe("2026-11-06T05:00:00.000Z");
  });
});

describe("estaColgada", () => {
  const hace = (segundos: number) =>
    new Date(AHORA.getTime() - segundos * 1000).toISOString();

  it("marca recibida o procesando con más de 120 s", () => {
    expect(estaColgada({ estado: "recibida", created_at: hace(121) }, AHORA)).toBe(true);
    expect(estaColgada({ estado: "procesando", created_at: hace(300) }, AHORA)).toBe(true);
  });

  it("no marca 120 s exactos ni intentos recientes", () => {
    expect(estaColgada({ estado: "procesando", created_at: hace(120) }, AHORA)).toBe(false);
    expect(estaColgada({ estado: "recibida", created_at: hace(5) }, AHORA)).toBe(false);
  });

  it("nunca marca lista ni fallo, por viejos que sean", () => {
    expect(estaColgada({ estado: "lista", created_at: hace(9999) }, AHORA)).toBe(false);
    expect(estaColgada({ estado: "fallo", created_at: hace(9999) }, AHORA)).toBe(false);
  });
});

describe("resumirFotos", () => {
  it("cuenta cada estado y los colgados aparte", () => {
    const hace = (s: number) => new Date(AHORA.getTime() - s * 1000).toISOString();
    const resumen = resumirFotos(
      [
        { estado: "lista", created_at: hace(10) },
        { estado: "lista", created_at: hace(20) },
        { estado: "fallo", created_at: hace(30) },
        { estado: "procesando", created_at: hace(10) },
        { estado: "recibida", created_at: hace(500) },
      ],
      AHORA,
    );
    expect(resumen).toEqual({
      recibida: 1,
      procesando: 1,
      lista: 2,
      fallo: 1,
      colgadas: 1,
      total: 5,
    });
  });

  it("sin filas devuelve todo en cero", () => {
    expect(resumirFotos([], AHORA).total).toBe(0);
  });
});

describe("otsDeOrigen", () => {
  const renglon = (pedido: string, almacen: string, producto = "Limón") => ({
    Producto: producto,
    Cantidad: 2,
    "Numero pedido": pedido,
    Almacen: almacen,
  });

  it("numera las OT de la OV como la hoja impresa: por nombre, de 1 al total", () => {
    // REQ-238: Veracruz → Tlachco → Veracruz = 3 OT (misma cocina no contigua no se fusiona).
    const ots = otsDeOrigen([
      renglon("4501", "Blue AYB Rest Veracruz"),
      renglon("4501", "Blue AYB XC Cena Gran Tlachco"),
      renglon("4501", "Blue AYB Rest Veracruz", "Cebolla"),
    ]);

    expect(ots.size).toBe(3);
    const veracruz1 = [...ots.entries()].find(
      ([, ot]) => ot.almacen === "Blue AYB Rest Veracruz" && ot.numero === 1,
    );
    const tlachco = ots.get("pedido:4501|almacen:blue ayb xc cena gran tlachco");
    const veracruz2 = [...ots.entries()].find(
      ([, ot]) => ot.almacen === "Blue AYB Rest Veracruz" && ot.numero === 3,
    );
    expect(veracruz1?.[1]).toMatchObject({
      numero: 1,
      total: 3,
      pedido: "4501",
      pedidoVaria: false,
    });
    expect(tlachco).toMatchObject({
      numero: 2,
      total: 3,
      almacen: "Blue AYB XC Cena Gran Tlachco",
    });
    expect(veracruz2?.[1]).toMatchObject({ numero: 3, total: 3 });
    expect(veracruz1?.[0]).not.toBe(veracruz2?.[0]);
  });


  it("encuentra la OT aunque la clave del intento difiera en tildes, mayúsculas o espacios", () => {
    const ots = otsDeOrigen([renglon("4501", "BLUE Ayb Xc Producción De Banquetes")]);

    for (const clave of [
      "pedido:4501|almacen:blue ayb xc producción de banquetes",
      "pedido:4501|almacen:blue ayb xc produccion de banquetes",
      "PEDIDO:4501|almacen:Blue  Ayb Xc Produccion de Banquetes ",
    ]) {
      expect(ots.get(claveComparable(clave))).toMatchObject({ numero: 1, total: 1 });
    }
  });

  it("marca que el pedido varía solo si las OT de la OV son de más de un pedido", () => {
    const mismoPedido = otsDeOrigen([renglon("4501", "A"), renglon("4501", "B")]);
    const variosPedidos = otsDeOrigen([renglon("4501", "A"), renglon("4502", "A")]);

    expect([...mismoPedido.values()].every((ot) => !ot.pedidoVaria)).toBe(true);
    expect(variosPedidos.size).toBe(2);
    expect([...variosPedidos.values()].every((ot) => ot.pedidoVaria)).toBe(true);
  });

  it("acepta el origen guardado como texto JSON", () => {
    const ots = otsDeOrigen(JSON.stringify([renglon("7", "Abar")]));
    expect(ots.get("pedido:7|almacen:abar")).toMatchObject({ numero: 1, total: 1 });
  });

  it("sin origen, vacío o con un formato raro no hay OT", () => {
    expect(otsDeOrigen(null).size).toBe(0);
    expect(otsDeOrigen("no es json").size).toBe(0);
    expect(otsDeOrigen({ no: "es un arreglo" }).size).toBe(0);
  });
});

describe("mensajeParaOperador", () => {
  it("deja el mensaje de cada código conocido", () => {
    for (const codigo of [
      "no_hoja",
      "foto_mala",
      "precision_baja",
      "imagen_ilegible",
      "orden_no_encontrada",
      "sin_respuesta",
    ]) {
      expect(mensajeParaOperador(codigo, " Texto claro ")).toBe("Texto claro");
    }
  });

  it("usa la frase genérica para error_proceso, códigos desconocidos y datos que faltan", () => {
    expect(mensajeParaOperador("error_proceso", "ECONNRESET at db.js:42")).toBe(MENSAJE_FOTO_GENERICO);
    expect(mensajeParaOperador("otro", "texto")).toBe(MENSAJE_FOTO_GENERICO);
    expect(mensajeParaOperador(null, "texto")).toBe(MENSAJE_FOTO_GENERICO);
    expect(mensajeParaOperador("no_hoja", null)).toBe(MENSAJE_FOTO_GENERICO);
    expect(mensajeParaOperador("no_hoja", "   ")).toBe(MENSAJE_FOTO_GENERICO);
  });
});

describe("partesDeOt", () => {
  it("separa el pedido y el almacén de la clave y pone el almacén con mayúscula inicial", () => {
    expect(partesDeOt("pedido:4501056534|almacen:blue ayb xc cena gran tlachco")).toEqual({
      pedido: "4501056534",
      almacen: "Blue Ayb Xc Cena Gran Tlachco",
    });
  });

  it("deja en minúscula las palabras menores salvo al inicio", () => {
    expect(partesDeOt("pedido:1|almacen:producción de banquetes")?.almacen).toBe(
      "Producción de Banquetes",
    );
    expect(partesDeOt("pedido:1|almacen:la terraza")?.almacen).toBe("La Terraza");
  });

  it("trata «_» y vacío como que falta esa parte", () => {
    expect(partesDeOt("pedido:_|almacen:abar")).toEqual({ pedido: null, almacen: "Abar" });
    expect(partesDeOt("pedido:450|almacen:_")).toEqual({ pedido: "450", almacen: null });
  });

  it("acepta un nombre de almacén con salto de línea sin perder el pedido", () => {
    expect(partesDeOt("pedido:7|almacen:sala\nvip")).toEqual({
      pedido: "7",
      almacen: "Sala Vip",
    });
  });

  it("una clave vacía es la captura de toda la OV", () => {
    expect(partesDeOt("")).toBeNull();
    expect(partesDeOt("   ")).toBeNull();
  });

  it("una clave con otro formato se muestra tal cual, como almacén", () => {
    expect(partesDeOt("hoja 2")).toEqual({ pedido: null, almacen: "Hoja 2" });
  });
});

describe("tiempos", () => {
  it("lee tiempos.total solo si es un número", () => {
    expect(tiempoTotalMs({ ia: 3000, total: 4200 })).toBe(4200);
    expect(tiempoTotalMs({ ia: 3000 })).toBeNull();
    expect(tiempoTotalMs({ total: "4200" })).toBeNull();
    expect(tiempoTotalMs(null)).toBeNull();
  });

  it("formatea milisegundos y segundos", () => {
    expect(formatearDuracion(850)).toBe("850 ms");
    expect(formatearDuracion(4200)).toBe("4,2 s");
    expect(formatearDuracion(null)).toBe("—");
  });
});
