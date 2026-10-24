import { afterEach, describe, expect, it, vi } from "vitest";
import { submitLogin } from "./auth-api";
import { LOGIN_REQUEST_TIMEOUT_MS } from "@/lib/auth/auth-timeouts";
const payload = { email: "test@example.invalid", password: "TestOnly123!", returnTo: "/" };
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("Respuesta del formulario de acceso", () => {
  it("interrumpe una solicitud que excede su espera y permite reintentar", async () => {
    const controller = new AbortController();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener(
              "abort",
              () => reject(new DOMException("Timeout", "AbortError")),
              { once: true },
            );
          }),
      ),
    );
    const pending = submitLogin(payload);
    controller.abort();
    const result = await pending;
    expect(timeout).toHaveBeenCalledWith(LOGIN_REQUEST_TIMEOUT_MS);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem.status).toBe(503);
  });
  it("maneja respuestas exitosas con contenido inválido sin dejar el envío rechazado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>Error</html>", { status: 200 })),
    );
    expect((await submitLogin(payload)).ok).toBe(false);
  });
  it("presenta errores de sesión del servidor y acepta una sesión correcta", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { title: "Sesión no disponible", detail: "Reintente", status: 503 },
          { status: 503 },
        ),
      )
      .mockResolvedValueOnce(Response.json({ authenticated: true, returnTo: "/plans" }));
    vi.stubGlobal("fetch", fetcher);
    const failed = await submitLogin(payload);
    expect(failed.ok).toBe(false);
    if (!failed.ok) expect(failed.problem.title).toBe("Sesión no disponible");
    const result = await submitLogin(payload);
    expect(result).toEqual({ ok: true, data: { authenticated: true, returnTo: "/plans" } });
  });
});
