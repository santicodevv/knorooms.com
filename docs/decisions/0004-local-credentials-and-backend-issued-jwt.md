# ADR-0004: Autenticación Propia con Usuario/Contraseña y JWT Emitidos por el Backend

- **Estado:** Aceptado
- **Fecha:** 2026-10-20
- **Reemplaza (parcialmente):** ADR-0003 (solo la parte de autenticación OIDC; la autorización RBAC + ABAC + soporte temporal sigue vigente)

## Contexto

El ADR-0003 dejó abierta la elección del proveedor OIDC definitivo y adoptó Authorization Code Flow + PKCE sobre un proveedor externo (Keycloak/Auth0/Entra ID). En la práctica:

- Levantar y operar un proveedor OIDC externo añade complejidad de infraestructura y un punto de fallo adicional en el arranque del entorno (el discovery OIDC no estaba disponible, causando respuestas `503` en `GET /api/auth/login`).
- El producto aún no tiene un requisito contractual que exija federación con proveedores externos de identidad.

## Decisión

1. **Eliminar el proveedor OIDC externo** (Keycloak) del stack y de la infraestructura local (compose y carpeta `infrastructure/docker/keycloak/`).
2. **Credenciales locales**: la entidad `UserAccount` almacena `PasswordHash` calculado con **PBKDF2-HMAC-SHA256** (600.000 iteraciones, sal aleatoria de 128 bits, formato `pbkdf2-sha256$iter$saltB64$hashB64`) y verificación en tiempo constante (`CryptographicOperations.FixedTimeEquals`).
3. **El backend emite sus propios JWT** (HS256, `Authentication:Tokens:SigningKey` en Base64 ≥ 32 bytes) con los claims `sub`, `iss`, `aud`, `email`, `name`, `roles`, `iat`, `exp`. La validación se realiza en `Knorooms.Api` con `SymmetricSecurityKey` y `ValidAlgorithms = [HmacSha256]`.
4. **Refresh tokens opacos**: 256 bits (Base64Url), persistidos como **SHA-256 hex** (`refresh_tokens.token_hash`), con **rotación obligatoria** y detección de reuso (el reuso revoca toda la familia de sesiones del usuario).
5. **Protección contra fuerza bruta**: bloqueo temporal de la cuenta tras `MaxFailedLoginAttempts` intentos fallidos (`locked_until_utc`), con auditoría `auth.login.failed` / `auth.login.succeeded`.
6. **El BFF de Next.js permanece** como única capa que custodia los tokens: el formulario de login del navegador hace `POST` a `/api/auth/login` del BFF, que autentica contra el backend (`POST /api/auth/login`), cifra los tokens con **AES-256-GCM** en Redis y entrega al navegador únicamente una cookie `HttpOnly` host-only más protección CSRF (`X-CSRF-Token` + validación `Origin`).
7. La autorización RBAC + ABAC + soporte temporal y la validación de permisos contra base de datos del ADR-0003 **no cambian**.

## Consecuencias

- Un componente menos de infraestructura; el arranque local solo requiere PostgreSQL 17 y Redis 7.4.
- KNOROOMS es responsable del almacenamiento seguro de contraseñas y de la protección contra fuerza bruta.
- Se mantiene la regla de "tokens fuera del navegador": ningún `access_token` ni `refresh_token` llega al JavaScript del navegador.
- Futuro: si se requiere federación (SSO, Google Workspace, MFA externa), puede reintroducirse un proveedor OIDC como mecanismo **adicional** sin reemplazar las credenciales locales.
