import { afterEach, describe, expect, it, vi } from "vitest";
import {
  setSupabaseClientForTests,
  setTenantSchemaGetter,
} from "@/lib/supabase/domain-query";
import { MENSAJE_FOTO_GENERICO } from "./estado-fotos.logic";
import { leerEstadoFotos } from "./estado-fotos.service";

const MSG_NO_HOJA =
  "No se ve la hoja de surtido. Toma la foto de la hoja impresa, de frente y completa.";
const AHORA = new Date("2026-11-07T01:00:00.000Z");
const CUENTA = "023WA";
const hace = (segundos: number) =>
  new Date(AHORA.getTime() - segundos * 1000).toISOString();

type Llamada = { metodo: string; args: unknown[] };

/** Cadena de consulta simulada: registra cada llamada y se resuelve con `resultado`. */
function cadena(resultado: { data: unknown; error: unknown }) {
  const llamadas: Llamada[] = [];
  const proxy: Record<string, unknown> = {};
  for (const metodo of ["select", "gte", "lt", "eq", "in", "order", "limit"]) {
    proxy[metodo] = (...args: unknown[]) => {
      llamadas.push({ metodo, args });
      return proxy;
    };
  }
  proxy.then = (resolver: (valor: unknown) => unknown) => resolver(resultado);
  return { proxy, llamadas };
}

function clienteSimulado(porTabla: {
  intentosLivianos: unknown[];
  intentos: unknown[];
  ordenes: unknown[];
}) {
  const livianos = cadena({ data: porTabla.intentosLivianos, error: null });
  const completos = cadena({ data: porTabla.intentos, error: null });
  const ordenes = cadena({ data: porTabla.ordenes, error: null });
  const esquema = vi.fn();
  let consultasIntentos = 0;
  const from = vi.fn((tabla: string) => {
    if (tabla === "orden_venta") return ordenes.proxy;
    // La primera consulta a la tabla de intentos es la liviana (resumen); la segunda, la de filas.
    consultasIntentos += 1;
    return consultasIntentos === 1 ? livianos.proxy : completos.proxy;
  });
  const cliente = {
    from,
    schema: esquema.mockImplementation(() => ({ from })),
  };
  setSupabaseClientForTests(cliente as never);
  return { from, esquema, livianos, completos, ordenes };
}

afterEach(() => {
  setSupabaseClientForTests(null);
  setTenantSchemaGetter(null);
});

describe("leerEstadoFotos", () => {
  it("consulta el esquema de la cuenta activa, nunca public", async () => {
    setTenantSchemaGetter(() => "emp_andino_4v053");
    const sim = clienteSimulado({ intentosLivianos: [], intentos: [], ordenes: [] });

    await leerEstadoFotos({ codigoCuenta: CUENTA, rango: "hoy", ahora: AHORA });

    expect(sim.esquema).toHaveBeenCalledWith("emp_andino_4v053");
    expect(sim.esquema).not.toHaveBeenCalledWith("public");
  });

  it("pide solo el rango del día de Colombia, lo más reciente primero y con tope de 50", async () => {
    const sim = clienteSimulado({ intentosLivianos: [], intentos: [], ordenes: [] });

    await leerEstadoFotos({ codigoCuenta: CUENTA, rango: "hoy", ahora: AHORA });

    const metodos = sim.completos.llamadas;
    expect(metodos).toContainEqual({
      metodo: "gte",
      args: ["created_at", "2026-11-06T05:00:00.000Z"],
    });
    expect(metodos).toContainEqual({
      metodo: "lt",
      args: ["created_at", "2026-11-07T05:00:00.000Z"],
    });
    expect(metodos).toContainEqual({
      metodo: "order",
      args: ["created_at", { ascending: false }],
    });
    expect(metodos).toContainEqual({ metodo: "limit", args: [50] });
  });

  it("cuenta cada estado y marca la fila colgada", async () => {
    clienteSimulado({
      intentosLivianos: [
        { estado: "lista", created_at: hace(10) },
        { estado: "fallo", created_at: hace(20) },
        { estado: "procesando", created_at: hace(600) },
      ],
      intentos: [
        {
          id_intento: "i-3",
          id_orden_venta: "ov-1",
          id_orden_trabajo: "2",
          estado: "procesando",
          mensaje_error: null,
          numero_intento: 1,
          tiempos: {},
          url_foto: null,
          created_at: hace(600),
        },
      ],
      ordenes: [{ id_orden_venta: "ov-1", codigo: "OV-00000552" }],
    });

    const { resumen, filas } = await leerEstadoFotos({ codigoCuenta: CUENTA, rango: "hoy", ahora: AHORA });

    expect(resumen).toMatchObject({ lista: 1, fallo: 1, procesando: 1, colgadas: 1, total: 3 });
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({
      codigoOv: "OV-00000552",
      idOrdenTrabajo: "2",
      colgada: true,
    });
  });

  it("trae del fallo el error, el intento, el tiempo total y la foto, y no pide el modelo de IA", async () => {
    clienteSimulado({
      intentosLivianos: [{ estado: "fallo", created_at: hace(30) }],
      intentos: [
        {
          id_intento: "i-1",
          id_orden_venta: "ov-1",
          id_orden_trabajo: "1",
          estado: "fallo",
          codigo_error: "no_hoja",
          mensaje_error: MSG_NO_HOJA,
          numero_intento: 2,
          tiempos: { ia: 9000, total: 9800 },
          url_foto: "https://res.cloudinary.com/x/foto.jpg",
          created_at: hace(30),
        },
      ],
      ordenes: [{ id_orden_venta: "ov-1", codigo: "OV-00000560" }],
    });

    const [fila] = (await leerEstadoFotos({ codigoCuenta: CUENTA, rango: "hoy", ahora: AHORA })).filas;

    expect(fila).toMatchObject({
      mensajeError: MSG_NO_HOJA,
      numeroIntento: 2,
      tiempoTotalMs: 9800,
      urlFoto: "https://res.cloudinary.com/x/foto.jpg",
      colgada: false,
    });
  });

  it("trae la posición de la OT en su OV (1/2, 2/2) con el almacén tal como viene en el pedido", async () => {
    const intento = (id: string, clave: string) => ({
      id_intento: id,
      id_orden_venta: "ov-1",
      id_orden_trabajo: clave,
      estado: "lista",
      mensaje_error: null,
      numero_intento: 1,
      tiempos: {},
      url_foto: null,
      created_at: hace(30),
    });
    clienteSimulado({
      intentosLivianos: [],
      intentos: [
        intento("i-2", "pedido:4501|almacen:blue ayb xc cena gran tlachco"),
        intento("i-1", "pedido:4501|almacen:blue ayb rest veracruz"),
        intento("i-x", "pedido:9|almacen:otra que ya no está en la orden"),
        // Mismo almacén que el de arriba pero sin tilde, como el intento fallido real de Demo.
        intento("i-sin-tilde", "pedido:4501|almacen:blue ayb xc cena gran tlachco".replace("cena", "cená")),
      ],
      ordenes: [
        {
          id_orden_venta: "ov-1",
          codigo: "OV-00000011",
          origen_correo: [
            { Producto: "Limón", Cantidad: 2, "Numero pedido": "4501", Almacen: "Blue AYB Rest Veracruz" },
            { Producto: "Limón", Cantidad: 2, "Numero pedido": "4501", Almacen: "Blue AYB XC Cena Gran Tlachco" },
          ],
        },
      ],
    });

    const { filas } = await leerEstadoFotos({ codigoCuenta: CUENTA, rango: "hoy", ahora: AHORA });

    expect(filas[0].ot).toMatchObject({ numero: 2, total: 2, almacen: "Blue AYB XC Cena Gran Tlachco" });
    expect(filas[1].ot).toMatchObject({ numero: 1, total: 2, almacen: "Blue AYB Rest Veracruz" });
    // Una OT que la OV ya no tiene queda sin posición, no inventa una.
    expect(filas[2].ot).toBeNull();
    // Y con una grafía distinta (tilde de más) sigue siendo la OT 2 de 2, no una sin posición.
    expect(filas[3].ot).toMatchObject({ numero: 2, total: 2 });
  });

  it("no pide el modelo de IA: el operador no lo necesita", async () => {
    const sim = clienteSimulado({ intentosLivianos: [], intentos: [], ordenes: [] });

    await leerEstadoFotos({ codigoCuenta: CUENTA, rango: "hoy", ahora: AHORA });

    const columnas = String(sim.completos.llamadas.find((l) => l.metodo === "select")?.args[0]);
    expect(columnas).not.toContain("modelo");
  });

  describe("mensaje del fallo para el operador", () => {
    const filaFallo = (codigo: string | null, mensaje: string | null, estado = "fallo") => ({
      id_intento: "i-1",
      id_orden_venta: "ov-1",
      id_orden_trabajo: "pedido:1|almacen:a",
      estado,
      codigo_error: codigo,
      mensaje_error: mensaje,
      numero_intento: 1,
      tiempos: {},
      url_foto: null,
      created_at: hace(30),
    });

    async function mensajeDe(fila: ReturnType<typeof filaFallo>) {
      clienteSimulado({
        intentosLivianos: [{ estado: fila.estado, created_at: hace(30) }],
        intentos: [fila],
        ordenes: [],
      });
      const { filas } = await leerEstadoFotos({ codigoCuenta: CUENTA, rango: "hoy", ahora: AHORA });
      return filas[0];
    }

    it("deja el mensaje de un código conocido, que es una frase fija para el operador", async () => {
      const fila = await mensajeDe(filaFallo("no_hoja", MSG_NO_HOJA));
      expect(fila.mensajeError).toBe(MSG_NO_HOJA);
    });

    it("cambia por una frase genérica el texto de un error de proceso, que puede ser técnico", async () => {
      const fila = await mensajeDe(
        filaFallo("error_proceso", 'relation "orden_venta_x" does not exist'),
      );
      expect(fila.mensajeError).toBe(MENSAJE_FOTO_GENERICO);
      expect(fila.mensajeError).not.toContain("relation");
    });

    it("usa la frase genérica con un código desconocido, sin código o sin mensaje", async () => {
      expect((await mensajeDe(filaFallo("algo_nuevo", "texto crudo"))).mensajeError).toBe(
        MENSAJE_FOTO_GENERICO,
      );
      expect((await mensajeDe(filaFallo(null, "texto crudo"))).mensajeError).toBe(
        MENSAJE_FOTO_GENERICO,
      );
      expect((await mensajeDe(filaFallo("no_hoja", null))).mensajeError).toBe(MENSAJE_FOTO_GENERICO);
    });

    it("no devuelve el código interno del error ni en la fila", async () => {
      const fila = await mensajeDe(filaFallo("no_hoja", MSG_NO_HOJA));
      expect(fila).not.toHaveProperty("codigoError");
      expect(fila).not.toHaveProperty("codigo_error");
    });

    it("una foto que no falló no lleva mensaje de error", async () => {
      const fila = await mensajeDe(filaFallo("no_hoja", MSG_NO_HOJA, "lista"));
      expect(fila.mensajeError).toBeNull();
    });
  });

  it("filtra la tabla por estado pero el resumen cuenta todo el rango", async () => {
    const sim = clienteSimulado({
      intentosLivianos: [
        { estado: "lista", created_at: hace(10) },
        { estado: "fallo", created_at: hace(20) },
      ],
      intentos: [],
      ordenes: [],
    });

    const { resumen } = await leerEstadoFotos({ codigoCuenta: CUENTA, rango: "hoy", estado: "fallo", ahora: AHORA });

    expect(sim.completos.llamadas).toContainEqual({ metodo: "eq", args: ["estado", "fallo"] });
    expect(
      sim.livianos.llamadas.some((l) => l.metodo === "eq" && l.args[0] === "estado"),
    ).toBe(false);
    expect(resumen.total).toBe(2);
  });

  it("solo pide los intentos de la cuenta activa, en el resumen y en la tabla", async () => {
    // En el esquema de la empresa la política de seguridad no separa cuentas: lo hace esta consulta.
    const sim = clienteSimulado({ intentosLivianos: [], intentos: [], ordenes: [] });

    await leerEstadoFotos({ codigoCuenta: "OTRA1", rango: "7dias", ahora: AHORA });

    const filtroCuenta = { metodo: "eq", args: ["codigo_cuenta", "OTRA1"] };
    expect(sim.livianos.llamadas).toContainEqual(filtroCuenta);
    expect(sim.completos.llamadas).toContainEqual(filtroCuenta);
  });

  it("el rango de 30 días pide desde 29 días antes de hoy", async () => {
    const sim = clienteSimulado({ intentosLivianos: [], intentos: [], ordenes: [] });

    await leerEstadoFotos({ codigoCuenta: CUENTA, rango: "30dias", ahora: AHORA });

    expect(sim.completos.llamadas).toContainEqual({
      metodo: "gte",
      args: ["created_at", "2026-10-08T05:00:00.000Z"],
    });
  });

  it("sin filas no consulta las órdenes", async () => {
    const sim = clienteSimulado({ intentosLivianos: [], intentos: [], ordenes: [] });

    const resultado = await leerEstadoFotos({ codigoCuenta: CUENTA, rango: "hoy", ahora: AHORA });

    expect(resultado.filas).toEqual([]);
    expect(sim.ordenes.llamadas).toHaveLength(0);
  });
});
