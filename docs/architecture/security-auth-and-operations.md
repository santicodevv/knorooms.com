# Autenticación OIDC, BFF, Sesiones, Autorización y Guía Operativa

## 1. Flujo de Autenticación OIDC y BFF (Next.js)

KNOROOMS delega la autenticación a un proveedor **OpenID Connect (OIDC)** estándar (Keycloak, Entra ID, Auth0, Google Workspace) y utiliza **Next.js como Backend for Frontend (BFF)**:

1. El usuario accede a `admin.knorooms.com` o `{colegio}.knorooms.com` y pulsa **Iniciar sesión**.
2. `GET /api/auth/login` en el BFF genera `state`, `nonce` y `code_verifier` (PKCE `S256`), almacena la transacción temporal en Redis (TTL 10 min) ligada a una cookie `HttpOnly` de corta duración y redirige al `authorization_endpoint` del proveedor OIDC.
3. Tras autenticarse, el proveedor redirige a `GET /api/auth/callback` en el mismo subdominio.
4. El BFF valida `state`, `nonce` y `PKCE`, intercambia el `code` por `access_token`, `refresh_token` e `id_token`, cifra los tokens con **AES-256-GCM** (`SESSION_ENCRYPTION_KEY`) y los guarda en Redis bajo un identificador de sesión criptográfico de 256 bits.
5. El navegador recibe únicamente una cookie **host-only** (`__Host-knorooms_session` en HTTPS o `knorooms_session` en HTTP local), `HttpOnly`, `SameSite=Lax`. **Ningún token llega al JavaScript del navegador ni a `localStorage`.**

---

## 2. Políticas de Sesión, Renovación y MFA

- **Access token JWT**: 10–15 minutos (`ExpectedAccessTokenMaxLifetimeMinutes = 15`).
- **Inactividad de sesión (Idle Timeout)**: 30 minutos (`SESSION_IDLE_TIMEOUT_MINUTES = 30`).
- **Duración máxima absoluta**: 8 horas (`SESSION_ABSOLUTE_TIMEOUT_MINUTES = 480`).
- **Renovación automática**: el BFF renueva silenciosamente el `access_token` usando el `refresh_token` cuando restan menos de 60 segundos de vigencia.
- **Revocación**:
  - En el BFF: eliminación inmediata de la sesión en Redis e índice `user-sessions:{sub}`.
  - En el backend: `UserAccount.SessionRevokedBeforeUtc` invalida inmediatamente cualquier JWT emitido antes de la marca de revocación, y `TenantMembership.Revoke` revoca el acceso a un colegio específico en tiempo real.
- **MFA obligatorio para roles privilegiados**:
  - Controlado por `Authentication:Oidc:EnforceMfaForPrivilegedRoles` (`true` por defecto en `appsettings.json` de producción).
  - Exige que el token contenga `amr` o `acr` con evidencia de segundo factor (`mfa`, `otp`, `totp`, `hwk`, `urn:keycloak:acr:2fa`) para `PlatformAdmin`, `PlatformSupport`, `InstitutionAdmin` y `Principal`.

---

## 3. Estrategia de Migraciones y Pruebas

### Migraciones EF Core
- Centralizadas en `Knorooms.Modules/Common/Persistence/Migrations`.
- Nunca se utiliza `EnsureCreated()`.
- Crear nueva migración:
  ```powershell
  cd backend
  dotnet ef migrations add <NombreMigracion> --project src/Knorooms.Modules --startup-project src/Knorooms.Api --output-dir Common/Persistence/Migrations
  ```
- Aplicar migraciones localmente:
  ```powershell
  cd backend
  dotnet ef database update --project src/Knorooms.Modules --startup-project src/Knorooms.Api
  ```

### Estrategia de Pruebas
- `Knorooms.UnitTests`: pruebas de dominio, parser de subdominios y reglas de arquitectura (`NetArchTest`).
- `Knorooms.IntegrationTests`: pruebas de integración sobre **PostgreSQL 17 real** mediante `Testcontainers.PostgreSql`, verificando explícitamente `rolbypassrls = false`, políticas RLS con `.IgnoreQueryFilters()`, bloqueo de escrituras cruzadas (`SQLSTATE 42501`), integridad referencial compuesta y flujos HTTP extremo a extremo.
- `apps/web` (`Vitest`): pruebas unitarias de resolución de host, cifrado AES-256-GCM de sesión, expiración idle/absoluta, validación `returnTo` y protección CSRF.
