import { afterEach, describe, expect, it, vi } from "vitest";
import { buildErrorReport, reportError } from "./report-error";

describe("buildErrorReport", () => {
  it("incluye solo digest, nombre y ruta", () => {
    const error = Object.assign(new TypeError("token=secreto respuesta del BFF"), {
      digest: "abc123",
    });

    const report = buildErrorReport(error, "/platform/institutions");

    expect(report).toEqual({
      digest: "abc123",
      name: "TypeError",
      route: "/platform/institutions",
    });
    expect(JSON.stringify(report)).not.toContain("secreto");
  });

  it("usa valores nulos cuando no hay digest ni ruta", () => {
    expect(buildErrorReport(new Error("x"), null)).toEqual({
      digest: null,
      name: "Error",
      route: null,
    });
  });
});

describe("reportError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("registra la ruta sin query string ni hash y sin el mensaje ni el stack", () => {
    vi.stubGlobal("window", {
      location: { pathname: "/school/students", search: "?email=a@b.com", hash: "#x" },
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = Object.assign(new Error("detalle interno"), { digest: "d1" });

    reportError(error);

    expect(consoleError).toHaveBeenCalledOnce();
    const logged = JSON.stringify(consoleError.mock.calls[0]);
    expect(consoleError.mock.calls[0][1]).toEqual({
      digest: "d1",
      name: "Error",
      route: "/school/students",
    });
    expect(logged).not.toContain("detalle interno");
    expect(logged).not.toContain("email");
    expect(logged).not.toContain("at ");
  });
});
