import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SchoolPageAccess, type SchoolPageAccessProps } from "./school-page-access";
import type { TenantContextDto } from "@/lib/api/types";
import type { StoredSessionRecord } from "@/lib/auth/session-store";

const mocks = vi.hoisted(() => ({ commercialStatus: vi.fn() }));
vi.mock("@/features/subscriptions/components/school-commercial-status", () => ({
  SchoolCommercialStatus: mocks.commercialStatus,
}));

const session: StoredSessionRecord = {
  sessionId: "sesion-de-prueba",
  user: { sub: "usuario-prueba", name: "Usuario de prueba", email: "usuario@example.invalid" },
  tokens: { accessToken: "test-access-secret", refreshToken: "test-refresh-secret" },
  csrfToken: "csrf-de-prueba",
  createdAt: 1,
  lastActivityAt: 1,
  expiresAt: 2,
  host: "colegio-a.localhost:3000",
};
const context: TenantContextDto = {
  tenant: { id: "colegio-a", slug: "colegio-a", name: "Colegio A", status: "Active" },
  accessType: "Member",
  membershipId: "membresia-prueba",
  roles: [],
  permissions: [],
  supportAccessExpiresAt: null,
};
const renderProtectedContent = vi.fn(() => createElement("p", null, "Contenido protegido"));

function renderAccess(overrides: Partial<SchoolPageAccessProps> = {}) {
  const props: SchoolPageAccessProps = {
    session,
    contextResult: { ok: true, status: 200, data: context },
    rawHost: session.host,
    slug: "colegio-a",
    returnTo: "/students",
    children: createElement(renderProtectedContent),
    ...overrides,
  };
  const markup = renderToStaticMarkup(createElement(SchoolPageAccess, props));
  expect(markup).not.toContain(session.tokens.accessToken);
  expect(markup).not.toContain(session.tokens.refreshToken);
  return markup;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.commercialStatus.mockReturnValue(null);
});

describe("guardas de acceso de cada página escolar", () => {
  it("no evalúa contenido protegido sin sesión aunque exista un contexto previo", () => {
    const markup = renderAccess({ session: null });

    expect(markup).toContain('id="school-login-email"');
    expect(markup).not.toContain("Contenido protegido");
    expect(renderProtectedContent).not.toHaveBeenCalled();
    expect(mocks.commercialStatus).not.toHaveBeenCalled();
  });

  it("deniega el contenido cuando no se pudo resolver el contexto", () => {
    const markup = renderAccess({ contextResult: null });

    expect(markup).toContain("Error al obtener el contexto institucional");
    expect(renderProtectedContent).not.toHaveBeenCalled();
    expect(mocks.commercialStatus).not.toHaveBeenCalled();
  });

  it.each([403, 404, 423, 500])("no evalúa contenido con un contexto rechazado (%s)", (status) => {
    const markup = renderAccess({
      contextResult: { ok: false, status, problem: { title: "Acceso rechazado", status } },
    });

    expect(markup).not.toContain("Contenido protegido");
    expect(renderProtectedContent).not.toHaveBeenCalled();
    expect(mocks.commercialStatus).not.toHaveBeenCalled();
  });

  it("renderiza el contenido y el aviso comercial con sesión y contexto válidos", () => {
    expect(renderAccess()).toContain("Contenido protegido");
    expect(renderProtectedContent).toHaveBeenCalledTimes(1);
    expect(mocks.commercialStatus).toHaveBeenCalledTimes(1);
  });

  it("permite que Inicio o el layout omitan el aviso sin duplicarlo", () => {
    expect(renderAccess({ hideCommercialStatus: true })).toContain("Contenido protegido");
    expect(renderProtectedContent).toHaveBeenCalledTimes(1);
    expect(mocks.commercialStatus).not.toHaveBeenCalled();
  });
});
