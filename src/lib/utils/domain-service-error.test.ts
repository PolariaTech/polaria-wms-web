import { describe, expect, it } from "vitest";
import { DomainServiceError } from "@/lib/utils/domain-service-error";

describe("DomainServiceError", () => {
  it("expone code y cause", () => {
    const cause = new Error("root");
    const error = new DomainServiceError("falló", "QUERY_FAILED", cause);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("DomainServiceError");
    expect(error.code).toBe("QUERY_FAILED");
    expect(error.message).toBe("falló");
    expect(error.cause).toBe(cause);
  });
});
