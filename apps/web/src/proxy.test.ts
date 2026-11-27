import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

beforeEach(() => {
  vi.stubEnv("APP_BASE_DOMAIN", "localhost");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ruta original del portal en el proxy", () => {
  it.each(["colegio-a", "colegio-b"])(
    "sobrescribe una ruta enviada por el cliente en %s y conserva la reescritura institucional",
    (slug) => {
      const request = new NextRequest(`http://${slug}.localhost:3000/students?search=Ana`, {
        headers: {
          host: `${slug}.localhost:3000`,
          "x-knorooms-pathname": "https://otro-dominio.example/",
        },
      });
      const response = proxy(request);

      expect(response.headers.get("x-middleware-request-x-knorooms-pathname")).toBe("/students");
      expect(response.headers.get("x-middleware-request-x-tenant-slug")).toBe(slug);
      expect(new URL(response.headers.get("x-middleware-rewrite")!).pathname).toBe(
        "/school/students",
      );
    },
  );

  it("mantiene inaccesibles las rutas técnicas internas", () => {
    const response = proxy(
      new NextRequest("http://colegio-a.localhost:3000/school/students", {
        headers: { host: "colegio-a.localhost:3000" },
      }),
    );

    expect(response.status).toBe(404);
  });
});
