# Autenticación Propia, BFF, Sesiones, Autorización y Guía Operativa

## 1. Flujo de Autenticación y BFF (Next.js)

KNOROOMS autentica con **credenciales locales (usuario/contraseña)** y el backend emite sus propios **JWT (HS256)** y refresh tokens opacos. **Next.js actúa como Backend for Frontend (BFF)** y custodia todos los tokens en el servidor:

1. El usuario accede a `admin.knorooms.com` o `{colegio}.knorooms.com` y ve el formulario de inicio de sesión.
2. El navegador envía usuario/contraseña por `POST /api/auth/login` al BFF (mismo subdominio), que valida `Origin`.
3. El BFF llama al backend (`POST /api/auth/login`), que verifica el hash PBKDF2 de la contraseña, aplica bloqueo por intentos fallidos y emite `access_token` (JWT HS256) + `refresh_token` (opaco, 256 bits).
4. El BFF cifra los tokens con **AES-256-GCM** (`SESSION_ENCRYPTION_KEY`) y los guarda en Redis bajo un identificador de sesión criptográfico de 256 bits.
5. El navegador recibe únicamente una cookie **host-only** (`__Host-knorooms_session` en HTTPS o `knorooms_session` en HTTP local), `HttpOnly`, `SameSite=Lax`. **Ningún token llega al JavaScript del navegador ni a `localStorage`.**
6. El cierre de sesión (`POST /api/auth/logout`) revoca el refresh token en el backend y elimina la sesión de Redis.

Detalles en `docs/decisions/0004-local-credentials-and-backend-issued-jwt.md`.

---

## 2. Políticas de Sesión, Renovación, Lockout y MFA

- **Access token JWT**: 15 minutos (`TokenLifetime.AccessTokenLifetime`).
- **Refresh token opaco**: 14 días (`TokenLifetime.RefreshTokenLifetime`), con **rotación obligatoria** en cada `POST /api/auth/refresh`; el reuso de un token revocado invalida toda la familia de sesiones del usuario.
- **Inactividad de sesión (Idle Timeout)**: 30 minutos (`SESSION_IDLE_TIMEOUT_MINUTES = 30`).
- **Duración máxima absoluta**: 8 horas (`SESSION_ABSOLUTE_TIMEOUT_MINUTES = 480`).
- **Renovación automática**: el BFF renueva silenciosamente el `access_token` usando el `refresh_token` cuando restan menos de 60 segundos de vigencia.
- **Bloqueo por fuerza bruta**: tras `MaxFailedLoginAttempts` intentos fallidos la cuenta se bloquea `LockoutMinutes` minutos (`locked_until_utc`), con auditoría `auth.login.failed` / `auth.login.succeeded`.
- **Revocación**:
  - En el BFF: eliminación inmediata de la sesión en Redis e índice `user-sessions:{sub}`.
  - En el backend: `UserAccount.SessionRevokedBeforeUtc` invalida inmediatamente cualquier JWT emitido antes de la marca de revocación, y `TenantMembership.Revoke` revoca el acceso a un colegio específico en tiempo real.
- **MFA obligatorio para roles privilegiados**:
  - Controlado por `Authentication:Tokens:EnforceMfaForPrivilegedRoles` (`true` por defecto en `appsettings.json` de producción).
  - Exige que el token contenga `amr` o `acr` con evidencia de segundo factor (`mfa`, `otp`, `totp`, `hwk`) para `PlatformAdmin`, `PlatformSupport`, `InstitutionAdmin` y `Principal`.

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
