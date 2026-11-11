import { describe, expect, it } from "vitest";
import { OV_EDIT_PRESENCE_POLL_MS } from "../utils/pedido/ov-edit-lock";
import { mergeOvEditPresence } from "./use-ov-edit-presence-poll";

describe("useOvEditPresencePoll (REQ-180)", () => {
  it("poll de presencia cada 4s", () => {
    expect(OV_EDIT_PRESENCE_POLL_MS).toBe(4_000);
  });

  it("mergeOvEditPresence pisa lock del listado con el poll", () => {
    const rows = [
      {
        idOrdenVenta: "ov1",
        editLockedBy: null as string | null,
        editLockedAt: null as string | null,
        editLockedNombre: null as string | null,
      },
    ];
    const merged = mergeOvEditPresence(rows, {
      ov1: {
        editLockedBy: "u2",
        editLockedAt: "2026-01-01T00:00:00.000Z",
        editLockedNombre: "Luis",
      },
    });
    expect(merged[0]).toMatchObject({
      editLockedBy: "u2",
      editLockedNombre: "Luis",
    });
  });
});
