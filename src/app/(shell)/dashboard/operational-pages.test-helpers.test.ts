import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("operational-pages dynamic harness", () => {
  it("el catch del loader re-lanza el error (no deja el body vacío)", () => {
    const src = readFileSync(
      path.join(
        process.cwd(),
        "src/app/(shell)/dashboard/operational-pages.test-helpers.tsx",
      ),
      "utf8",
    );
    expect(src).toContain("throw error");
    expect(src).not.toMatch(/\.catch\(\(\) =>/);
  });
});
