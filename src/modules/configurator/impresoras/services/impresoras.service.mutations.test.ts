import { describe, expect, it } from "vitest";
import * as barrel from "./impresoras.service";
import * as part from "./impresoras.service.mutations";

describe("impresoras.service.mutations", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.createImpresoraConfigurator).toBe(part.createImpresoraConfigurator);
    expect(barrel.updateImpresoraConfigurator).toBe(part.updateImpresoraConfigurator);
    expect(barrel.deleteImpresoraConfigurator).toBe(part.deleteImpresoraConfigurator);
  });
});
