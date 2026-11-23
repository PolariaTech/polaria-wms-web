import { describe, expect, it } from "vitest";
import * as barrel from "./impresoras.service";
import * as part from "./impresoras.service.shared";

describe("impresoras.service.shared", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.IMPRESORA_LIST_COLUMNS).toBe(part.IMPRESORA_LIST_COLUMNS);
    expect(barrel.IMPRESORA_CREATE_COLUMNS).toBe(part.IMPRESORA_CREATE_COLUMNS);
    expect(barrel.mapListRow).toBe(part.mapListRow);
    expect(barrel.validateCreateInput).toBe(part.validateCreateInput);
    expect(barrel.IMPRESORA_PRINT_COLUMNS).toBe(part.IMPRESORA_PRINT_COLUMNS);
  });
});
