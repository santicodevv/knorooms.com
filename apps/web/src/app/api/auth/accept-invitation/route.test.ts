import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
import { POST } from "./route";
const payload = {
  invitationId: "00000000-0000-4000-8000-000000000001",
  token: "A".repeat(64),
  displayName: "Director piloto",
  password: "TestPassword123!",
};
function request(host: string, origin: string, body: unknown = payload) {
  return new NextRequest(`http://${host}/api/auth/accept-invitation`, {
    method: "POST",
    headers: { host, origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Aceptación de invitaciones en BFF", () => {
  it("rechaza otros orígenes sin invocar la API", async () => {
    vi.stubEnv("APP_BASE_DOMAIN", "localhost");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect(
      (await POST(request("colegio.localhost:3000", "http://otro.localhost:3000"))).status,
    ).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rechaza el host de plataforma y cuerpos inválidos", async () => {
    vi.stubEnv("APP_BASE_DOMAIN", "localhost");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect(
      (await POST(request("admin.localhost:3000", "http://admin.localhost:3000"))).status,
    ).toBe(403);
    expect(
      (await POST(request("colegio.localhost:3000", "http://colegio.localhost:3000", {}))).status,
    ).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("envía el colegio resuelto y devuelve éxito sin tokens", async () => {
    vi.stubEnv("APP_BASE_DOMAIN", "localhost");
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    const response = await POST(request("colegio.localhost:3000", "http://colegio.localhost:3000"));
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fetcher.mock.calls[0][1].headers["X-Forwarded-Host"]).toBe("colegio.localhost:3000");
  });
});
