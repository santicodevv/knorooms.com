---
name: knorooms-security-auth
description: Seguridad, autenticación OIDC agnóstica del proveedor, BFF en Next.js con sesiones cifradas AES-256-GCM en Redis, cookies HttpOnly host-only, protección CSRF, RBAC + ABAC deny-by-default, MFA y auditoría de soporte temporal.
---

# Skill: Seguridad, Autenticación OIDC, BFF y Autorización (`knorooms-security-auth`)

## 1. Propósito
Asegurar que la autenticación, el manejo de sesiones en el BFF (`apps/web`), la validación de tokens en el backend (`Knorooms.Api`), la autorización RBAC + ABAC y el acceso temporal de soporte cumplan estándares de seguridad de grado producción sin acoplarse a un proveedor OIDC propietario.

## 2. Cuándo debe activarse
- Al modificar el flujo OIDC Authorization Code + PKCE, el almacén de sesiones en Redis, el cifrado de tokens o la protección CSRF en `apps/web/src/lib/auth/`.
- Al modificar la validación JWT Bearer, `PermissionCatalog`, `PermissionAuthorizationHandler` o `TenantAndIdentityResolutionMiddleware` en `backend/`.
- Al trabajar en el flujo de acceso temporal de soporte (`SupportAccess`) o en el registro de auditoría (`AuditLogEntry`).

## 3. Cuándo no debe activarse
- Para cambios de maquetación visual o componentes presentacionales sin interacción con sesiones, permisos ni endpoints protegidos.

## 4. Archivos y directorios relevantes
- `apps/web/src/lib/auth/oidc.ts` — Cliente OIDC estándar (`openid-client` v6) con PKCE (`S256`), `state` y `nonce`.
- `apps/web/src/lib/auth/crypto.ts` — Cifrado autenticado AES-256-GCM de tokens antes de persistirlos en Redis.
- `apps/web/src/lib/auth/session-store.ts` y `session-policy.ts` — Almacén de sesiones en Redis, expiración por inactividad (`idle`) y absoluta, rotación/refresco de tokens e invalidación por usuario.
- `apps/web/src/lib/auth/csrf.ts` — Verificación de `X-CSRF-Token` en tiempo constante (`timingSafeEqual`) y validación de `Origin`.
- `apps/web/src/app/api/bff/[...path]/route.ts` — Proxy BFF que adjunta el `access_token` desde el servidor hacia `Knorooms.Api`.
- `backend/src/Knorooms.SharedKernel/Authorization/PermissionCatalog.cs` — Catálogo de permisos y roles del sistema.
- `backend/src/Knorooms.Api/Security/PermissionAuthorizationHandler.cs` — Evaluación RBAC + ABAC y verificación de MFA para roles privilegiados.

## 5. Reglas obligatorias
1. **Cero tokens en el navegador**: `access_token`, `refresh_token` e `id_token` nunca deben enviarse al cliente en respuestas JSON (`/api/auth/session` solo devuelve `{ authenticated, user, csrfToken, expiresAt }`) ni guardarse en `localStorage`/`sessionStorage` o cookies legibles por JavaScript.
2. **Cookies de sesión host-only y `HttpOnly`**: la cookie de sesión nunca debe definir el atributo `Domain`, evitando que un subdominio comprometido lea cookies de otro subdominio. En HTTPS usa el prefijo `__Host-knorooms_session`.
3. **Tokens cifrados en reposo en Redis**: todo payload de tokens en Redis se cifra con AES-256-GCM usando `SESSION_ENCRYPTION_KEY` (32 bytes).
4. **Protección CSRF obligatoria**: toda petición `POST`, `PUT`, `PATCH` o `DELETE` hacia `/api/bff/*` o `/api/auth/logout` exige validación de `Origin` y cabecera `X-CSRF-Token` comparada en tiempo constante.
5. **Deny-by-default en Backend**: `FallbackPolicy` en `Program.cs` exige usuario autenticado por defecto, y cada endpoint de negocio requiere una política explícita de `PermissionCatalog`.
6. **Soporte técnico con aprobación previa y expiración**: `PlatformSupport` no tiene acceso libre a colegios; requiere una `SupportAccessRequest` aprobada por el administrador del colegio (`Approved`), no expirada (`ExpiresAtUtc > UtcNow`) y no revocada.

## 6. Patrones permitidos
- Configuración OIDC basada exclusivamente en descubrimiento estándar (`.well-known/openid-configuration`) mediante `OIDC_ISSUER` y `Authentication__Oidc__Authority`.
- Exigencia configurable de MFA (`EnforceMfaForPrivilegedRoles`) verificando claims `amr`/`acr` del proveedor OIDC para `PlatformSuperAdmin`, `PlatformSupport` e `InstitutionAdmin`.

## 7. Antipatrones prohibidos
- Implementar tablas de contraseñas propias o emisores JWT caseros en producción.
- Almacenar secretos reales en `appsettings.json`, `.env.example` o código fuente.
- Permitir comodines (`returnTo=https://sitio-externo.com`) en redirecciones post-login (open redirect).

## 8. Flujo recomendado paso a paso
1. Si se añade una nueva acción protegida, registrar primero el permiso atómico en `PermissionCatalog.cs` y asignarlo a los roles correspondientes en `PermissionCatalog.AllRoles`.
2. Proteger la acción del Controller con `[Authorize(Policy = PermissionCatalog.<Permiso>)]`.
3. Si la acción muta estado relevante de seguridad o soporte, registrar una entrada en `dbContext.AuditLogs`.
4. En el frontend, consumir la acción desde Server Components (`server-api.ts`) o Client Components (`bff-client.ts`, que adjunta automáticamente `X-CSRF-Token`).

## 9. Checklist de verificación
- [ ] ¿Ningún token OIDC se expone al JavaScript del navegador?
- [ ] ¿Las mutaciones al BFF validan `Origin` y `X-CSRF-Token`?
- [ ] ¿El nuevo endpoint tiene `[Authorize(Policy = PermissionCatalog....)]`?
- [ ] ¿Se registra auditoría (`AuditLogEntry`) para cambios de permisos, membresías o soporte?

## 10. Comandos reales del repositorio
```powershell
pnpm --dir apps/web test
dotnet test backend/Knorooms.slnx
```
