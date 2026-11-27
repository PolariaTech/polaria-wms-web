import { afterEach, describe, expect, it } from "vitest";
import {
  leerPreciosSeparados,
  publicarPreciosSeparados,
} from "./precios-comprador-separados";

describe("precios separados del comprador", () => {
  afterEach(() => {
    publicarPreciosSeparados({ ultimos: {}, equivalencia: {} });
  });

  it("publica el último precio y el de la equivalencia por separado", () => {
    publicarPreciosSeparados({
      ultimos: { epa: 60 },
      equivalencia: { epa: 16 },
    });
    expect(leerPreciosSeparados()).toEqual({
      ultimos: { epa: 60 },
      equivalencia: { epa: 16 },
    });
  });
});
