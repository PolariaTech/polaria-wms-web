import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("root layout", () => {
  it("monta ProductVersionGate (REQ-293)", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    expect(source).toContain("ProductVersionGate");
    expect(source).toContain("<ProductVersionGate />");
  });
});
