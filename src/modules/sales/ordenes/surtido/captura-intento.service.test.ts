import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  INTENTO_VENCE_MS,
  MENSAJE_SIN_RESPUESTA,
  cargarIntento,
  crearIntento,
  guardarUrlFoto,
  leerIntentos,
  marcarFallo,
  marcarLista,
  marcarProcesando,
  olvidarEsquemasEnCache,
  prepararReintento,
} from "./captura-intento.service";

type Fila = Record<string, unknown>;
function uuid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

/** Base falsa: una lista de filas por esquema («public» para null). */
const bd = vi.hoisted(() => ({
  tablas: new Map<string, Fila[]>(),
  fkViolada: new Set<string>(),
  contador: 0,
  consultasEsquema: 0,
}));

function filas(esquema: string | null): Fila[] {
  const clave = esquema ?? "public";
  if (!bd.tablas.has(clave)) bd.tablas.set(clave, []);
  return bd.tablas.get(clave)!;
}

function constructor(esquema: string | null) {
  return {
    insert(fila: Fila) {
      return {
        select: () => ({
          single: async () => {
            if (bd.fkViolada.has(esquema ?? "public")) {
              return { data: null, error: { code: "23503", message: "fk" } };
            }
            const nueva = {
              id_intento: uuid(++bd.contador),
              estado: "recibida",
              numero_intento: 1,
              created_at: new Date().toISOString(),
              ...fila,
            };
            filas(esquema).push(nueva);
            return { data: nueva, error: null };
          },
        }),
      };
    },
    update(cambios: Fila) {
      return {
        eq: async (_columna: string, id: string) => {
          const fila = filas(esquema).find((f) => f.id_intento === id);
          if (fila) Object.assign(fila, cambios);
          return { error: null };
        },
      };
    },
    select() {
      let ids: string[] = [];
      let ov = "";
      const consulta = {
        in(_c: string, valores: string[]) {
          ids = valores;
          return consulta;
        },
        eq: async (_c: string, valor: string) => {
          ov = valor;
          const data = filas(esquema).filter(
            (f) => ids.includes(String(f.id_intento)) && f.id_orden_venta === ov,
          );
          return { data, error: null };
        },
      };
      return consulta;
    },
  };
}

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({
    from: () => constructor(null),
    schema: (esquema: string) => ({ from: () => constructor(esquema) }),
  }),
}));

vi.mock("@/modules/sales/shared/services/sales-catalog.server", () => ({
  resolveTenantSchemaForCuenta: async (_c: unknown, cuenta: string) => {
    bd.consultasEsquema += 1;
    return cuenta === "SIN-ESQUEMA" ? null : "emp_demo";
  },
}));

const ID1 = uuid(1);
const ID2 = uuid(2);

const ENTRADA = { idOrdenVenta: "ov-1", idOrdenTrabajo: "ot-1", codigoCuenta: "1YW43" };

beforeEach(() => {
  bd.tablas.clear();
  bd.fkViolada.clear();
  bd.contador = 0;
  bd.consultasEsquema = 0;
  olvidarEsquemasEnCache();
});

describe("crearIntento", () => {
  it("reserva la foto en el esquema del cliente, en estado recibida", async () => {
    const ref = await crearIntento(ENTRADA);

    expect(ref).toEqual({ idIntento: ID1, esquema: "emp_demo" });
    expect(filas("emp_demo")[0]).toMatchObject({
      id_orden_venta: "ov-1",
      id_orden_trabajo: "ot-1",
      codigo_cuenta: "1YW43",
      estado: "recibida",
    });
    expect(filas(null)).toHaveLength(0);
  });

  it("una cuenta sin esquema propio guarda en public", async () => {
    const ref = await crearIntento({ ...ENTRADA, codigoCuenta: "SIN-ESQUEMA" });

    expect(ref.esquema).toBeNull();
    expect(filas(null)).toHaveLength(1);
  });

  it("si la OV vive en public aunque la cuenta tenga esquema, cae a public", async () => {
    bd.fkViolada.add("emp_demo");

    const ref = await crearIntento(ENTRADA);

    expect(ref.esquema).toBeNull();
    expect(filas(null)).toHaveLength(1);
  });

  it("consulta el esquema de la cuenta una sola vez por proceso", async () => {
    await crearIntento(ENTRADA);
    await crearIntento(ENTRADA);

    expect(bd.consultasEsquema).toBe(1);
  });
});

describe("estados del intento", () => {
  it("recorre recibida, procesando y lista con la URL, el modelo y los tiempos", async () => {
    const ref = await crearIntento(ENTRADA);

    await marcarProcesando(ref);
    expect(filas("emp_demo")[0]?.estado).toBe("procesando");

    await guardarUrlFoto(ref, "https://foto/1.jpg");
    await marcarLista(ref, {
      modelo: "gpt-4o",
      tiempos: { ia: 12000, total: 15000 },
      urlFoto: "https://foto/1.jpg",
    });

    expect(filas("emp_demo")[0]).toMatchObject({
      estado: "lista",
      modelo: "gpt-4o",
      url_foto: "https://foto/1.jpg",
      tiempos: { ia: 12000, total: 15000 },
    });
    expect(filas("emp_demo")[0]?.terminado_at).toBeTruthy();
  });

  it("un fallo guarda el código y el motivo, y recorta el código a 40 caracteres", async () => {
    const ref = await crearIntento(ENTRADA);

    await marcarFallo(ref, { codigo: "x".repeat(60), mensaje: "La foto fue tomada mal." });

    const fila = filas("emp_demo")[0];
    expect(fila).toMatchObject({ estado: "fallo", mensaje_error: "La foto fue tomada mal." });
    expect(String(fila?.codigo_error)).toHaveLength(40);
  });

  it("reintentar deja el intento en cola con un número más y sin el error anterior", async () => {
    const ref = await crearIntento(ENTRADA);
    await marcarFallo(ref, { codigo: "foto_mala", mensaje: "mala" });

    await prepararReintento(ref, 2);

    expect(filas("emp_demo")[0]).toMatchObject({
      estado: "recibida",
      numero_intento: 2,
      codigo_error: null,
      mensaje_error: null,
      terminado_at: null,
    });
  });
});

describe("leerIntentos", () => {
  it("devuelve el estado de cada foto pedida y solo las de esa OV", async () => {
    const a = await crearIntento(ENTRADA);
    await marcarLista(a, { modelo: "gpt-4o", tiempos: {}, urlFoto: null });
    await crearIntento({ ...ENTRADA, idOrdenVenta: "otra-ov" });

    const resultado = await leerIntentos({
      ids: [ID1, ID2, "no-existe"],
      idOrdenVenta: "ov-1",
      codigoCuenta: "1YW43",
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({ idIntento: ID1, estado: "lista" });
  });

  it("encuentra un intento que quedó en public", async () => {
    bd.fkViolada.add("emp_demo");
    await crearIntento(ENTRADA);

    const resultado = await leerIntentos({
      ids: [ID1],
      idOrdenVenta: "ov-1",
      codigoCuenta: "1YW43",
    });

    expect(resultado).toHaveLength(1);
  });

  it("ignora los ids que no son UUID en vez de hacer fallar la consulta", async () => {
    const a = await crearIntento(ENTRADA);

    const resultado = await leerIntentos({
      ids: ["no-existe", "'; drop table x; --", a.idIntento],
      idOrdenVenta: "ov-1",
      codigoCuenta: "1YW43",
    });

    expect(resultado).toHaveLength(1);
    await expect(
      leerIntentos({ ids: ["no-existe"], idOrdenVenta: "ov-1", codigoCuenta: "1YW43" }),
    ).resolves.toEqual([]);
  });

  it("sin ids no consulta nada", async () => {
    await expect(
      leerIntentos({ ids: [], idOrdenVenta: "ov-1", codigoCuenta: "1YW43" }),
    ).resolves.toEqual([]);
  });

  it("un intento en curso desde hace demasiado se da por perdido y se marca como fallo", async () => {
    const ref = await crearIntento(ENTRADA);
    await marcarProcesando(ref);
    filas("emp_demo")[0]!.created_at = new Date(
      Date.now() - INTENTO_VENCE_MS - 1000,
    ).toISOString();

    const [intento] = await leerIntentos({
      ids: [ref.idIntento],
      idOrdenVenta: "ov-1",
      codigoCuenta: "1YW43",
    });

    expect(intento).toMatchObject({
      estado: "fallo",
      codigoError: "sin_respuesta",
      mensajeError: MENSAJE_SIN_RESPUESTA,
    });
    expect(filas("emp_demo")[0]).toMatchObject({
      estado: "fallo",
      codigo_error: "sin_respuesta",
    });
  });

  it("uno reciente en curso sigue en curso", async () => {
    const ref = await crearIntento(ENTRADA);

    const [intento] = await leerIntentos({
      ids: [ref.idIntento],
      idOrdenVenta: "ov-1",
      codigoCuenta: "1YW43",
    });

    expect(intento?.estado).toBe("recibida");
  });
});

describe("cargarIntento", () => {
  it("devuelve la referencia y la foto guardada para reintentar", async () => {
    const ref = await crearIntento(ENTRADA);
    await marcarFallo(ref, { codigo: "ia", mensaje: "falló", urlFoto: "https://foto/9.jpg" });

    const cargado = await cargarIntento({
      idIntento: ref.idIntento,
      idOrdenVenta: "ov-1",
      codigoCuenta: "1YW43",
    });

    expect(cargado?.ref).toEqual(ref);
    expect(cargado?.intento).toMatchObject({
      estado: "fallo",
      urlFoto: "https://foto/9.jpg",
      numeroIntento: 1,
    });
  });

  it("no encuentra un intento de otra OV", async () => {
    const ref = await crearIntento(ENTRADA);

    await expect(
      cargarIntento({ idIntento: ref.idIntento, idOrdenVenta: "otra-ov", codigoCuenta: "1YW43" }),
    ).resolves.toBeNull();
  });
});
