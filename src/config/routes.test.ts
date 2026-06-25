import { describe, expect, it } from "vitest";
import { getPostLoginRoute, ROUTES } from "./routes";

describe("getPostLoginRoute", () => {
  it("redirige scope platform a /configurador", () => {
    expect(getPostLoginRoute("platform")).toBe(ROUTES.configurator);
    expect(getPostLoginRoute("platform")).toBe("/configurador");
  });

  it("redirige scope tenant a /dashboard", () => {
    expect(getPostLoginRoute("tenant")).toBe(ROUTES.dashboard);
    expect(getPostLoginRoute("tenant")).toBe("/dashboard");
  });
});
