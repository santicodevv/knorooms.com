# ADR-0003: Autenticación OIDC Agnóstica con BFF y Autorización RBAC + ABAC + Soporte Temporal

- **Estado:** Reemplazado parcialmente por [ADR-0004](./0004-local-credentials-and-backend-issued-jwt.md) (la parte de autenticación OIDC fue sustituida por credenciales locales + JWT propios; la autorización RBAC + ABAC + soporte temporal sigue vigente)
- **Fecha:** 2026-10-19

## Contexto

El proveedor OIDC definitivo aún no está cerrado y el sistema requiere proteger sesiones frente a robo de tokens en navegador (XSS), impedir escalación de privilegios entre colegios y evitar que el equipo de soporte tenga acceso permanente a datos escolares.

## Decisión

1. Implementar Authorization Code Flow + PKCE (`S256`) en el BFF de Next.js (`openid-client`), guardando tokens cifrados con **AES-256-GCM** en Redis y entregando al navegador únicamente una cookie `HttpOnly` host-only más protección CSRF (`X-CSRF-Token` + validación `Origin`).
2. Resolver permisos en el backend (`PermissionAuthorizationHandler`) contra la base de datos (`TenantMembership` activa o `SupportAccessGrant` aprobada y vigente), nunca confiando solo en claims estáticos del JWT ni en el subdominio por sí solo.
3. Exigir flujo explícito para soporte técnico: solicitud con motivo y duración (máx. 8h) → aprobación por la dirección del colegio → vigencia temporal con banner visible → revocación inmediata en cualquier momento.

## Consecuencias

- Cero exposición de tokens en el navegador.
- Trazabilidad completa y cumplimiento del principio de mínimo privilegio para personal escolar y de soporte.
