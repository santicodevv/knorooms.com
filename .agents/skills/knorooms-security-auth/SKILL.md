---
name: knorooms-security-auth
description: Seguridad, autenticación con credenciales locales y JWT emitidos por el backend, BFF en Next.js con sesiones cifradas AES-256-GCM en Redis, cookies HttpOnly host-only, protección CSRF, RBAC + ABAC deny-by-default, MFA y auditoría de soporte temporal.
---

# Skill: Seguridad, Autenticación Propia, BFF y Autorización (`knorooms-security-auth`)

## 1. Propósito
Asegurar que la autenticación, el manejo de sesiones en el BFF (`apps/web`), la emisión/validación de tokens en el backend, la autorización RBAC + ABAC y el acceso temporal de soporte cumplan estándares de seguridad de grado producción. KNOROOMS usa credenciales locales (usuario/contraseña) y JWT propios emitidos por el backend; no hay proveedor de identidad externo.

## 2. Cuándo debe activarse
- Al modificar el flujo de login local, el almacén de sesiones en Redis, el cifrado de tokens o la protección CSRF en `apps/web/src/lib/auth/`.
- Al modificar la emisión de JWT (`JwtTokenIssuer`), el hash de contraseñas (`LocalPassword`), los refresh tokens (`RefreshToken`), la validación JWT Bearer, `PermissionCatalog`, `PermissionAuthorizationHandler` o `TenantAndIdentityResolutionMiddleware` en `backend/`.
- Al trabajar en el flujo de acceso temporal de soporte (`SupportAccess`) o en el registro de auditoría (`AuditLogEntry`).

## 3. Cuándo no debe activarse
- Para cambios de maquetación visual o componentes presentacionales sin interacción con sesiones, permisos ni endpoints protegidos.

## 4. Archivos y directorios relevantes
- `apps/web/src/lib/auth/backend-auth.ts` — Llamadas del BFF al backend (`/api/auth/login|refresh|logout`); los tokens nunca salen del servidor.
- `apps/web/src/lib/auth/request-origin.ts` — Derivación del origen/host efectivo de la petición (proxy headers).
- `apps/web/src/lib/auth/crypto.ts` — Cifrado autenticado AES-256-GCM de tokens antes de persistirlos en Redis.
- `apps/web/src/lib/auth/session-store.ts` y `session-policy.ts` — Almacén de sesiones en Redis, expiración por inactividad (`idle`) y absoluta, rotación/refresco de tokens e invalidación por usuario.
- `apps/web/src/lib/auth/csrf.ts` — Verificación de `X-CSRF-Token` en tiempo constante (`timingSafeEqual`) y validación de `Origin`.
- `apps/web/src/app/api/auth/{login,logout,session}/route.ts` — Endpoints BFF de sesión (login `POST`, logout `POST`, session `GET`).
- `apps/web/src/app/api/bff/[...path]/route.ts` — Proxy BFF que adjunta el `access_token` desde el servidor hacia `Knorooms.Api`.
- `backend/src/Knorooms.Modules/Modules/Identity/Domain/LocalPassword.cs` — Hash PBKDF2-HMAC-SHA256 (600.000 iteraciones) y verificación en tiempo constante.
- `backend/src/Knorooms.Modules/Modules/Identity/Infrastructure/JwtTokenIssuer.cs` — Emisión de JWT HS256 y refresh tokens opacos.
- `backend/src/Knorooms.Modules/Modules/Identity/Application/IdentityService.cs` — Login, rotación de refresh tokens, bloqueo por intentos fallidos y auditoría.
- `backend/src/Knorooms.Api/Controllers/AuthController.cs` — Endpoints `api/auth/login|refresh|logout`.
- `backend/src/Knorooms.SharedKernel/Authorization/PermissionCatalog.cs` — Catálogo de permisos y roles del sistema.
- `backend/src/Knorooms.Api/Security/PermissionAuthorizationHandler.cs` — Evaluación RBAC + ABAC y verificación de MFA para roles privilegiados.

## 5. Reglas obligatorias
1. **Cero tokens en el navegador**: `access_token` y `refresh_token` nunca deben enviarse al cliente en respuestas JSON (`/api/auth/session` solo devuelve `{ authenticated, user, csrfToken, expiresAt }`) ni guardarse en `localStorage`/`sessionStorage` o cookies legibles por JavaScript.
2. **Cookies de sesión host-only y `HttpOnly`**: la cookie de sesión nunca debe definir el atributo `Domain`, evitando que un subdominio comprometido lea cookies de otro subdominio. En HTTPS usa el prefijo `__Host-knorooms_session`.
3. **Tokens cifrados en reposo en Redis**: todo payload de tokens en Redis se cifra con AES-256-GCM usando `SESSION_ENCRYPTION_KEY` (32 bytes).
4. **Contraseñas y JWT propios**: las contraseñas se almacenan únicamente como hash PBKDF2-HMAC-SHA256 (600.000 iteraciones, sal aleatoria, verificación en tiempo constante). Los JWT se firman con HS256 usando `Authentication:Tokens:SigningKey` (Base64 ≥ 32 bytes) y nunca se registran en logs ni en `AuditLogEntry`.
5. **Rotación obligatoria de refresh tokens**: cada `POST /api/auth/refresh` rota el refresh token; el reuso de un token revocado invalida toda la familia de sesiones del usuario.
6. **Protección CSRF obligatoria**: toda petición `POST`, `PUT`, `PATCH` o `DELETE` hacia `/api/bff/*` o `/api/auth/logout` exige validación de `Origin` y cabecera `X-CSRF-Token` comparada en tiempo constante. `POST /api/auth/login` valida al menos `Origin`.
7. **Deny-by-default en Backend**: `FallbackPolicy` en `Program.cs` exige usuario autenticado por defecto, y cada endpoint de negocio requiere una política explícita de `PermissionCatalog`.
8. **Soporte técnico con aprobación previa y expiración**: `PlatformSupport` no tiene acceso libre a colegios; requiere una `SupportAccessRequest` aprobada por el administrador del colegio (`Approved`), no expirada (`ExpiresAtUtc > UtcNow`) y no revocada.

## 6. Patrones permitidos
- Bloqueo temporal de cuenta tras `MaxFailedLoginAttempts` intentos fallidos (`locked_until_utc`) con auditoría `auth.login.failed` / `auth.login.succeeded`.
- Exigencia configurable de MFA (`EnforceMfaForPrivilegedRoles`) para `PlatformSuperAdmin`, `PlatformSupport` e `InstitutionAdmin`.
- Emisión de JWT con los claims `sub`, `iss`, `aud`, `email`, `name`, `roles`, `iat`, `exp`.

## 7. Antipatrones prohibidos
- Introducir un proveedor de identidad externo (OIDC/Keycloak) o romper el flujo de credenciales locales + JWT propios sin un ADR que lo respalde (ver `docs/decisions/0004-local-credentials-and-backend-issued-jwt.md`).
- Almacenar contraseñas en texto plano o con hashes no adaptativos (MD5/SHA simple).
- Registrar contraseñas, tokens, cookies o secretos en logs o en `AuditLogEntry`.
- Almacenar secretos reales en `appsettings.json`, `.env.example` o código fuente.
- Permitir comodines (`returnTo=https://sitio-externo.com`) en redirecciones post-login (open redirect).

## 8. Flujo recomendado paso a paso
1. Si se añade una nueva acción protegida, registrar primero el permiso atómico en `PermissionCatalog.cs` y asignarlo a los roles correspondientes en `PermissionCatalog.AllRoles`.
2. Proteger la acción del Controller con `[Authorize(Policy = PermissionCatalog.<Permiso>)]`.
3. Si la acción muta estado relevante de seguridad o soporte, registrar una entrada en `dbContext.AuditLogs`.
4. En el frontend, consumir la acción desde Server Components (`server-api.ts`) o Client Components (`bff-client.ts`, que adjunta automáticamente `X-CSRF-Token`).

## 9. Checklist de verificación
- [ ] ¿Ningún token se expone al JavaScript del navegador?
- [ ] ¿Las mutaciones al BFF validan `Origin` y `X-CSRF-Token`?
- [ ] ¿El nuevo endpoint tiene `[Authorize(Policy = PermissionCatalog....)]`?
- [ ] ¿Se registra auditoría (`AuditLogEntry`) para cambios de permisos, membresías o soporte?
- [ ] ¿La rotación de refresh tokens y la detección de reuso siguen vigentes?

## 10. Comandos reales del repositorio
```powershell
pnpm --dir apps/web test
dotnet test backend/Knorooms.slnx
```
