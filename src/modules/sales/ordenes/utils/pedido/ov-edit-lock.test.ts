import { describe, expect, it } from "vitest";
import {
  decideOvEditLockMode,
  hasActiveForeignOvEditLock,
  initialsFromNombre,
  isOvEditLockStale,
  ovEditPresenceLabel,
  OV_EDIT_LOCK_STALE_MS,
} from "./ov-edit-lock";

describe("ov-edit-lock (REQ-180)", () => {
  it("initialsFromNombre toma 1 o 2 letras", () => {
    expect(initialsFromNombre("Ana")).toBe("A");
    expect(initialsFromNombre("Ana Ruiz")).toBe("AR");
    expect(initialsFromNombre("  ")).toBe("?");
  });

  it("isOvEditLockStale: sin fecha o vieja → stale", () => {
    const now = 1_700_000_000_000;
    expect(isOvEditLockStale(null, now)).toBe(true);
    expect(isOvEditLockStale("", now)).toBe(true);
    expect(
      isOvEditLockStale(new Date(now - OV_EDIT_LOCK_STALE_MS - 1).toISOString(), now),
    ).toBe(true);
    expect(
      isOvEditLockStale(new Date(now - 30_000).toISOString(), now),
    ).toBe(false);
  });

  it("hasActiveForeignOvEditLock ignora propio y caducado", () => {
    const now = 1_700_000_000_000;
    const fresh = new Date(now - 30_000).toISOString();
    expect(
      hasActiveForeignOvEditLock(
        { editLockedBy: "u1", editLockedAt: fresh, editLockedNombre: "Ana" },
        "u1",
        now,
      ),
    ).toBe(false);
    expect(
      hasActiveForeignOvEditLock(
        { editLockedBy: "u2", editLockedAt: fresh, editLockedNombre: "Luis" },
        "u1",
        now,
      ),
    ).toBe(true);
    expect(
      hasActiveForeignOvEditLock(
        {
          editLockedBy: "u2",
          editLockedAt: new Date(now - OV_EDIT_LOCK_STALE_MS - 5).toISOString(),
          editLockedNombre: "Luis",
        },
        "u1",
        now,
      ),
    ).toBe(false);
  });

  it("decideOvEditLockMode: extranjero activo → soloLectura", () => {
    const now = 1_700_000_000_000;
    const fresh = new Date(now - 10_000).toISOString();
    expect(
      decideOvEditLockMode(
        { editLockedBy: "u2", editLockedAt: fresh, editLockedNombre: "Luis" },
        "u1",
        now,
      ),
    ).toEqual({
      mode: "soloLectura",
      holderId: "u2",
      holderNombre: "Luis",
    });
    expect(
      decideOvEditLockMode(
        { editLockedBy: null, editLockedAt: null, editLockedNombre: null },
        "u1",
        now,
      ).mode,
    ).toBe("edit");
  });

  it("ovEditPresenceLabel distingue tú / otro / null", () => {
    const now = 1_700_000_000_000;
    const fresh = new Date(now - 5_000).toISOString();
    expect(
      ovEditPresenceLabel(
        { editLockedBy: "u1", editLockedAt: fresh, editLockedNombre: "Ana" },
        "u1",
        now,
      ),
    ).toBe("Tú estás editando");
    expect(
      ovEditPresenceLabel(
        { editLockedBy: "u2", editLockedAt: fresh, editLockedNombre: "Luis" },
        "u1",
        now,
      ),
    ).toBe("Luis está editando");
    expect(
      ovEditPresenceLabel(
        {
          editLockedBy: "u2",
          editLockedAt: new Date(now - OV_EDIT_LOCK_STALE_MS - 1).toISOString(),
          editLockedNombre: "Luis",
        },
        "u1",
        now,
      ),
    ).toBeNull();
  });
});
