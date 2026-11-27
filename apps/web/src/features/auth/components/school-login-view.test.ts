import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SchoolLoginView, type SchoolLoginViewProps } from "./school-login-view";

function renderLogin(overrides: Partial<SchoolLoginViewProps> = {}) {
  const props: SchoolLoginViewProps = {
    register: (name) => ({
      name,
      onChange: async () => {},
      onBlur: async () => {},
      ref: () => {},
    }),
    errors: {},
    busy: false,
    passwordVisible: false,
    onTogglePassword: () => {},
    problem: null,
    onSubmit: (event) => event.preventDefault(),
    ...overrides,
  };
  return renderToStaticMarkup(createElement(SchoolLoginView, props));
}

describe("acceso escolar", () => {
  it("etiqueta los campos nativos y permite que el gestor de contraseñas los reconozca", () => {
    const markup = renderLogin();
    expect(markup).toMatch(/<label[^>]*for="school-login-email"[^>]*>Correo electrónico<\/label>/);
    expect(markup).toMatch(/<label[^>]*for="school-login-password"[^>]*>Contraseña<\/label>/);
    expect(markup).toContain('type="email"');
    expect(markup).toContain('autoComplete="username"');
    expect(markup).toContain('type="password"');
    expect(markup).toContain('autoComplete="current-password"');
    expect(markup).not.toContain('aria-invalid="true"');
    expect(markup).not.toContain('aria-describedby="school-login-email-error"');
    expect(markup).not.toContain('disabled=""');
  });

  it.each([false, true])(
    "expone el estado visible=%s sin convertir el control en envío",
    (visible) => {
      const markup = renderLogin({ passwordVisible: visible });
      const password = markup.match(/<input[^>]*id="school-login-password"[^>]*>/)?.[0];
      const toggle = markup.match(/<button[^>]*aria-controls="school-login-password"[^>]*>/)?.[0];
      expect(password).toContain(`type="${visible ? "text" : "password"}"`);
      expect(toggle).toContain('type="button"');
      expect(toggle).toContain(`aria-pressed="${visible}"`);
      expect(toggle).toContain(`aria-label="${visible ? "Ocultar" : "Mostrar"} contraseña"`);
    },
  );

  it("asocia los errores de validación al campo correspondiente", () => {
    const markup = renderLogin({
      errors: {
        email: { type: "required", message: "El correo electrónico es obligatorio." },
        password: { type: "required", message: "La contraseña es obligatoria." },
      },
    });
    expect(markup.match(/aria-invalid="true"/g)).toHaveLength(2);
    for (const field of ["email", "password"]) {
      expect(markup).toContain(`aria-describedby="school-login-${field}-error"`);
      expect(markup).toContain(`id="school-login-${field}-error"`);
    }
    expect(markup).toContain("El correo electrónico es obligatorio.");
    expect(markup).toContain("La contraseña es obligatoria.");
  });

  it("impide nuevos envíos y cambios de campos durante la autenticación", () => {
    const markup = renderLogin({ busy: true });
    expect(markup).toMatch(/<form[^>]*aria-busy="true"/);
    const inputs = markup.match(/<input[^>]*>/g) ?? [];
    const buttons = markup.match(/<button[^>]*>/g) ?? [];
    expect(inputs).toHaveLength(2);
    expect(buttons).toHaveLength(2);
    expect([...inputs, ...buttons].every((control) => control.includes('disabled=""'))).toBe(true);
    expect(markup).toContain('role="status" aria-live="polite">Iniciando sesión…');
  });

  it("anuncia el rechazo de credenciales en el formulario", () => {
    const markup = renderLogin({
      problem: { status: 401, title: "Credenciales incorrectas", detail: "Verifica tu acceso." },
    });
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("El correo o la contraseña no son correctos.");
    expect(markup).not.toContain("Verifica tu acceso.");
    expect(markup).not.toContain('aria-busy="true"');
  });
});
