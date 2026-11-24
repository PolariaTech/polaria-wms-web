import { describe, expect, it } from "vitest";
import * as barrel from "./ImpresorasListView";
import * as part from "./impresoras-list-view.switch";

describe("impresoras-list-view.switch", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.AutoImprimirSwitchTrack).toBe(part.AutoImprimirSwitchTrack);
  });
});
