import { describe, expect, it } from "vitest";
import { OV_EDIT_LOCK_HEARTBEAT_MS } from "../utils/pedido/ov-edit-lock";

/**
 * El hook enlaza heartbeat/release; la lógica de caducidad está en ov-edit-lock.
 * Aquí fijamos el contrato de intervalo (REQ-180).
 */
describe("useOvEditLockHeartbeat (REQ-180)", () => {
  it("usa heartbeat de 30s", () => {
    expect(OV_EDIT_LOCK_HEARTBEAT_MS).toBe(30_000);
  });
});
