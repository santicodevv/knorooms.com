import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ login: vi.fn(), session: vi.fn() }));
vi.mock("@/lib/auth/backend-auth", () => ({
  loginWithPassword: mocks.login,
  toSessionUser: () => ({ sub: "test", name: "Prueba", email: "test@example.invalid" }),
}));
vi.mock("@/lib/auth/session-store", () => ({
  createSession: mocks.session,
  getSessionCookieName: () => "knorooms_session",
  buildSessionCookieOptions: () => ({ httpOnly: true, sameSite: "lax", path: "/" }),
}));
import { POST } from "./route";
function request(origin = "http://admin.localhost:3000") {
  return new NextRequest("http://admin.localhost:3000/api/auth/login", {
    method: "POST",
    headers: { host: "admin.localhost:3000", origin, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test@example.invalid",
      password: "TestOnly123!",
      returnTo: "/plans",
    }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.login.mockResolvedValue({
    ok: true,
    tokens: {
      accessToken: "private-test-access",
      refreshToken: "private-test-refresh",
      accessTokenExpiresAtUtc: "2027-01-01T00:00:00Z",
    },
  });
  mocks.session.mockResolvedValue({ sessionId: "test-session" });
});
afterEach(() => vi.restoreAllMocks());
describe("Creación de sesión BFF", () => {
  it("mantiene protección de origen antes de autenticar", async () => {
    expect((await POST(request("http://otro.localhost:3000"))).status).toBe(403);
    expect(mocks.login).not.toHaveBeenCalled();
  });
  it("devuelve 503 sin cookie ni secretos cuando Redis falla", async () => {
    mocks.session.mockRejectedValue(new Error("private internal failure"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    const body = await response.text();
    expect(body).not.toContain("private");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("crea cookie HttpOnly y respuesta de navegación sin tokens", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(await response.json()).toEqual({ authenticated: true, returnTo: "/plans" });
  });
  it("conserva el error de credenciales sin intentar guardar una sesión", async () => {
    mocks.login.mockResolvedValue({
      ok: false,
      problem: { title: "Credenciales inválidas", status: 401 },
    });
    expect((await POST(request())).status).toBe(401);
    expect(mocks.session).not.toHaveBeenCalled();
  });
});
