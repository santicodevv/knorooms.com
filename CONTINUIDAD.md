# KNOROOMS — Guía de continuidad para el propietario y la próxima IA

**Fecha de corte: 20 de octubre de 2026.**
**Proyecto:** `C:\dev\WebSite\knorooms.com`.
**Estado:** etapas 1, 2 y 3 implementadas localmente; próxima etapa funcional: Moodle para un piloto (orden 4).

**Actualización prioritaria 22/10/2026:** el propietario cambió el flujo: módulos directos por institución, sin seleccionar planes; asistente de tres pasos, ficha con pestañas, listado paginado, invitaciones contextuales con Resend y toasts. Ver [ADR-0006](docs/decisions/0006-direct-institution-modules-and-resend.md) y [guía vigente](docs/architecture/institution-management.md). Las descripciones de planes de abajo son antecedentes y compatibilidad; no representan el nuevo flujo visible. Moodle sigue pendiente.

**Actualización de interfaz 23/10/2026:** administración global y portal de colegios tienen diseños propios con Tailwind, basados en los HTML del propietario. El portal separa directorios, fichas, altas, asistencia, notas, boletas y configuración. Ver [guía del portal](docs/design/school-portal.md) para rutas, arquitectura, pruebas y límites funcionales. Moodle permanece pendiente.

Este archivo permite retomar el trabajo sin depender del historial del chat. Es una fotografía del estado revisado, no una promesa de que todo el producto esté terminado ni un reemplazo de revisar el código. Las pruebas mencionadas son las ejecutadas al cerrar el orden 3; no se volvieron a ejecutar por escribir esta guía.

## 1. Lo primero que debes saber

1. KNOROOMS es un SaaS para **colegios y escuelas de República Dominicana**, no para universidades en esta primera versión.
2. El equipo propietario administra colegios, suscripciones, módulos y acompañamiento desde una consola global. Cada colegio conserva sus datos, usuarios y permisos.
3. Moodle es opcional para cada colegio, pero es parte central del producto pendiente de construir. No debe desaparecer del plan mientras se agregan pantallas académicas.
4. Las etapas 2 y 3 están en el árbol de trabajo local, con numerosos archivos modificados y sin seguimiento de Git. **Un clon del remoto puede no contenerlas.**
5. No se desplegaron estas etapas a producción ni se hizo commit/push desde este trabajo. No confundir el nombre del dominio con un despliegue verificado.
6. Un colegio sin suscripción activa puede consultar sus datos, pero no registrar cambios académicos. Esto es comportamiento intencional.
7. No hay precios comerciales definidos, planes precargados, conexión Moodle activa ni pasarela de cobro implementada.
8. Hay limitaciones académicas conocidas que deben corregirse antes de importar notas o usar boletas como producto oficial.

## 2. Intención del propietario y contexto

El proyecto nace de la experiencia con dos sistemas universitarios anteriores, EFB y SEBTI, donde se trabajó con Moodle, jerarquías, sincronización, récord de notas y proyección académica. Esos sistemas son referencias de problemas y experiencia, **no la especificación escolar que debe copiarse literalmente**.

Referencias locales históricas: `C:\dev\WebSite\campusefb` y `C:\dev\WebSite\MODDLE`. Sus bases, credenciales, reglas de aprobación y despliegues son independientes. No asumir que la base Neon de EFB/SEBTI corresponde a KNOROOMS. En KNOROOMS se verificó PostgreSQL local con Docker; no se verificó un destino remoto de producción.

La decisión posterior fue enfocarse primero en colegios/escuelas. La estructura conceptual es:

```text
Colegio
  └── Año escolar (ej. 2026–2027)
        └── Nivel / grado / sección (ej. Secundaria / 1.º / A)
              └── Materias de su carga académica
                    └── Actividades, evaluaciones y calificaciones
```

Grado y sección son entidades distintas. Los períodos de evaluación no son lo mismo que el año escolar. El expediente del estudiante permanece entre años y la matrícula lo vincula con un año/sección.

Un curso externo de Moodle es un aula que requiere una correspondencia explícita; no debe convertirse automáticamente en un grado o una materia por su nombre o profundidad de categoría. Tampoco debe aplicarse la fórmula universitaria «cantidad de cursos aprobados = programa completado» a la promoción escolar. No asumir como regla general escolar 70/100 o 7/10 por lo usado en aquellos sistemas.

## 3. Lectura recomendada y autoridad de las decisiones

Antes de modificar código:

1. [AGENTS.md](AGENTS.md), [reglas backend](backend/AGENTS.md) y [reglas frontend](apps/web/AGENTS.md).
2. [Alcance del producto](docs/product/scope.md).
3. [Secuencia de implementación](docs/product/implementation-roadmap.md).
4. [Arquitectura SaaS y Moodle](docs/architecture/saas-administration-and-moodle.md).
5. [ADR-0005: enfoque escolar](docs/decisions/0005-school-saas-and-moodle-scope.md).
6. [Guía de ficha e invitaciones](docs/architecture/institution-setup-and-invitations.md).
7. [Guía de suscripciones y derechos](docs/architecture/subscriptions-and-entitlements.md).
8. [Contrato HTTP](docs/architecture/api-contract.md).

Los documentos Word de la raíz son antecedentes. Las decisiones técnicas vigentes y los ADR posteriores prevalecen sobre propuestas antiguas: el backend es .NET, no NestJS; la autenticación es propia, no Keycloak/OIDC externo.

Existen párrafos históricos que aún hablan de «12 módulos», de suscripciones pendientes o de invitaciones por completar. La fotografía actual tiene **14 módulos** y las etapas 2/3 implementadas. Interpretar esos párrafos en su contexto temporal; contrastar con el código y las guías específicas. El ADR-0004 sustituyó la decisión antigua de proveedor de identidad externo.

## 4. Qué existe y con qué alcance

| Área | Estado real | Límites relevantes |
|---|---|---|
| Aislamiento por colegio | Subdominios, membresías, permisos, filtros EF y RLS PostgreSQL | El host identifica; no autoriza por sí solo. |
| Autenticación | Usuario/contraseña, JWT propios y renovación; BFF con sesión Redis | No asumir un enrolamiento MFA completo solo por existir comprobación de MFA. |
| Consola global | Alta, suspensión/reactivación de colegios, asignación inicial y soporte | No da acceso académico irrestricto a superadministradores. |
| Ficha del colegio | Contacto, dirección, código del centro, logo por URL, zona horaria, responsable y notas | No hay subida de archivos para el logo. |
| Invitaciones | SMTP, aceptación, expiración, revocación y uso único | SMTP real de producción requiere configuración; Mailpit es solo local. |
| Seguimiento inicial | Porcentaje de cuatro tareas administrativas | No acredita preparación académica ni conexión Moodle. |
| Planes y suscripciones | Versiones, vigencias, estados, límites y excepciones auditadas | Administración manual; sin facturación ni cobro automático. |
| Módulos comerciales | Derechos efectivos y dependencias, validados al guardar | Los módulos del código no equivalen al catálogo comercial. |
| Estructura académica | Años, grados, secciones, materias y asignaciones docentes | Falta consolidar carga de materias independiente del docente. |
| Estudiantes y matrículas | Expedientes, responsables/vínculos, matrículas y reglas de capacidad | No equivale a un portal familiar completo. |
| Asistencia, notas y boletas | Servicios, pantallas y pruebas de la base académica | Existen hallazgos pendientes de integridad/publicación; ver sección 9. |
| Auditoría y soporte | Eventos y concesiones temporales con permisos | Mantenerlos operativos para regularización y asistencia. |
| Moodle | Diseño y entrada en catálogo con disponibilidad falsa | No hay conexión, diagnóstico, correspondencias ni sincronización implementados. |

## 5. Arquitectura y mapa del código

Monolito modular: ASP.NET Core/.NET 10 + EF Core/Npgsql + PostgreSQL 17; frontend Next.js 16, React, TypeScript, Tailwind y componentes propios con Tailwind CSS; Redis para sesiones; Mailpit para correo local. Mantener el gestor de paquetes pnpm y el lockfile existente.

```text
backend/src/Knorooms.SharedKernel/   Entidades base, Result, permisos, contexto de colegio
backend/src/Knorooms.Modules/        Módulos y persistencia compartida
backend/src/Knorooms.Api/            Controllers, seguridad, validación y host
backend/tests/                      Unitarias, arquitectura e integración PostgreSQL real
apps/web/src/app/                   Rutas Next y BFF
apps/web/src/features/              Funcionalidades separadas en schemas/api/hooks/components
apps/web/src/components/            Shell, bloques compartidos y primitivas UI
apps/web/src/lib/                   Sesión, CSRF, llamadas servidor/BFF y resolución de host
infrastructure/docker/             PostgreSQL, Redis y compose adicional de Mailpit
infrastructure/scripts/            Configuración local de SMTP
.agents/skills/                     Reglas especializadas del repositorio
```

Módulos actuales: `Identity`, `Tenants`, `Platform`, `Students`, `Academic`, `Enrollments`, `Attendance`, `Grading`, `ReportCards`, `Authorization`, `SupportAccess`, `Audit`, `Subscriptions`, `Entitlements`. `Integrations` todavía no existe como módulo funcional.

Archivos especialmente importantes:

| Responsabilidad | Ubicación |
|---|---|
| Contexto y modos de ejecución | `backend/src/Knorooms.SharedKernel/Tenancy/TenantContext.cs` |
| Permisos y roles | `backend/src/Knorooms.SharedKernel/Authorization/PermissionCatalog.cs` |
| Resolución y autorización HTTP | `backend/src/Knorooms.Api/Security/` |
| DbContext, RLS y migraciones | `backend/src/Knorooms.Modules/Common/Persistence/` |
| Control comercial al persistir | `backend/src/Knorooms.Modules/Common/Persistence/CommercialWriteGuard.cs` |
| Configuración y registro de módulos | `backend/src/Knorooms.Modules/ModulesDependencyInjection.cs` |
| Planes, asignaciones y derechos | `backend/src/Knorooms.Modules/Modules/Subscriptions/` y `Entitlements/` |
| Invitaciones | `Modules/Identity/Application/AdministratorInvitationService.cs` dentro de Knorooms.Modules |
| Ficha y coordinación inicial | `Modules/Platform/Application/InstitutionSetupService.cs` dentro de Knorooms.Modules |
| Pantallas comerciales | `apps/web/src/features/subscriptions/` |
| Ficha y administradores | `apps/web/src/features/platform/` |
| Shell y navegación | `apps/web/src/components/shell/`, navegación en features/platform y features/school |
| Procesamiento de correo | `Modules/Platform/Infrastructure/OutboxProcessorHostedService.cs` dentro de Knorooms.Modules |

## 6. Reglas técnicas que no deben romperse

- Reutilizar arquitectura, contratos y componentes. No reescribir el proyecto, introducir microservicios ni crear un .csproj por módulo.
- `Contracts` expone interfaces y DTOs; las implementaciones `Application`/`Infrastructure` son internas. Comunicar módulos por contratos; evitar nuevas dependencias a entidades internas ajenas.
- Controllers delgados, validación en servidor, errores ProblemDetails y `CancellationToken` en I/O.
- Interfaz/documentación en español; identificadores y código en inglés. Sin datos ficticios que aparenten funcionalidad real.
- Separar frontend en `schemas/`, `api/`, `hooks/` y `components/`. Usar los bloques existentes en `components/shared`.
- Leer las skills locales pertinentes antes de modificar áreas especializadas. Next.js instalado incluye documentación local; `apps/web/AGENTS.md` pide consultarla antes de asumir APIs de otras versiones.
- JWT y refresh tokens no llegan al JavaScript del navegador. La sesión está cifrada en Redis, con cookie HttpOnly host-only y CSRF en mutaciones del BFF.
- No aceptar `TenantId` del cliente para seleccionar el colegio en rutas institucionales. Los IDs objetivo de rutas globales solo sirven dentro de operaciones administrativas autorizadas.
- Runtime PostgreSQL: `knorooms_app` sin SUPERUSER/BYPASSRLS. Migraciones: rol migrador separado. No cambiar esto para «hacer que funcione».
- Nuevas tablas institucionales requieren ENABLE/FORCE RLS, filtros y claves foráneas compuestas cuando referencien entidades de otro registro del mismo colegio.
- `PlatformCommercial` es un modo acotado a datos comerciales del colegio objetivo, no un acceso a notas/expedientes. El soporte académico necesita concesión vigente.
- Mantener los efectos externos después del commit con Outbox. No enviar correo ni llamar a Moodle dentro de una transacción larga de base de datos.
- No editar migraciones ya aplicadas para corregir el modelo; crear una incremental.

### Particularidad del control comercial

`ApplicationDbContext.SaveChangesAsync` valida las escrituras académicas, incluida la sobrecarga con `acceptAllChangesOnSuccess`. Usa un bloqueo transaccional por colegio compartido con las modificaciones de suscripción. Comprueba vigencia, módulos y delta de cupos. La vía síncrona rechaza escrituras académicas.

El mapeo de entidades a módulo está en `ChangedCommercialModules()` y depende del namespace de los módulos existentes. **Al añadir módulos o cambiar namespaces, ampliar y probar este mapeo.**

`ExecuteUpdate`, `ExecuteDelete` y SQL directo no pasan por SaveChanges. No usarlos para saltar la validación comercial. En futuros trabajos, establecer contexto institucional y llamar a `IEntitlementService.EnsureCanWriteAsync` antes de efectos externos, además de conservar la validación de persistencia. No existen todavía trabajos de Moodle que permitan declarar comprobada una sincronización real.

## 7. Decisiones funcionales ya confirmadas

### Incorporación e invitaciones

- SMTP configurable y buzón local fue la opción elegida por el propietario.
- Invitación válida durante 48 horas, revocable y de un solo uso.
- Usuario nuevo establece contraseña; usuario existente confirma la actual. El correo lo fija la invitación.
- El envío se procesa con Outbox después del commit. Hasta cinco intentos; estados en cola/enviado/fallido.
- Entrega al menos una vez: puede repetirse un correo tras un corte, pero la aceptación sigue siendo única.
- El enlace utiliza fragmento y la pantalla lo retira de la barra. Reabrir el correo si se recarga y se pierde el código.
- Clave de invitaciones independiente de la de JWT. No rotarla casualmente: afecta invitaciones pendientes.
- Preparación administrativa: contacto/dirección, responsable de acompañamiento, administrador activo y reunión inicial; cada tarea representa 25%.
- Lista de últimas 50 invitaciones; logo por URL HTTPS.

### Contratación y acceso

- Precio opcional e informativo; no hay pagos, factura ni renovación automática.
- Plan identificado por código y versión inmutable. Nueva versión no modifica colegios previamente contratados.
- Una asignación vigente por colegio; cambios con motivo y control de concurrencia. Historial de cambios en auditoría.
- Estados manuales: Active, Suspended, Cancelled. Estados efectivos adicionales: Unassigned, Scheduled, Expired.
- Inicio inclusivo y fin exclusivo en UTC. Formulario usa hora local. Sin período de gracia automático.
- **El propietario confirmó conservar consulta histórica y bloquear cambios al vencer/suspender.** Se aplica también a cancelación y ausencia de contrato; siempre sujeto a permisos originales.
- Suspensión operativa de la institución es otra cosa: mantiene su bloqueo institucional previo.
- Deshabilitar un módulo no elimina información. Se permiten excepciones por colegio, auditadas.
- Límite de estudiantes = expedientes activos; reactivación consume cupo. Límite de secciones = total guardado de todos los años, no cupo de alumnos ni solo secciones del año actual.
- Límite vacío = sin límite. Reducirlo no borra datos; impide incrementos que lo excedan.
- No se asignaron contratos ficticios automáticamente a los colegios existentes.

Dependencias comerciales actuales:

| Código | Requiere |
|---|---|
| students | Ninguno |
| academic | Ninguno |
| enrollments | students + academic |
| attendance | enrollments |
| grading | enrollments |
| reportcards | grading |
| moodle | enrollments + grading; además permanece no disponible |

La UI informa restricciones, pero el servidor es quien las impone. No asumir que todos los formularios académicos se ocultan o deshabilitan individualmente: el bloqueo definitivo está en el backend.

## 8. Siguiente etapa: orden 4, Moodle para un piloto

Esta guía no autoriza por sí sola comenzar otra etapa. Al recibir la indicación del propietario, el siguiente trabajo recomendado es:

1. Elegir colegio piloto, instancia Moodle y datos autorizados. Confirmar versión y funciones expuestas por su servicio web. No reutilizar tokens de EFB/SEBTI.
2. Crear `Integrations` dentro del monolito, con conexión institucional y secretos cifrados o referencia a gestor seguro; nunca devolverlos al frontend/logs/auditoría.
3. Diagnóstico real, con funciones faltantes y último resultado visibles. Proteger URL contra SSRF: HTTPS en producción, bloqueo de destinos privados/metadatos, DNS/redirecciones, timeouts y tamaño máximo.
4. Inventario y correspondencias explícitas entre categorías/cursos externos y año, sección y materia locales. No deducir todo por nivel del árbol.
5. Vista previa de altas, coincidencias, conflictos y rechazados; conciliación de personas por identificadores fiables, nunca solo nombres.
6. Antes de aplicar notas/matrículas, resolver la carga académica y validaciones de relación materia-sección indicadas en la sección siguiente.
7. Confirmación del lote; trabajo persistente con Outbox, contexto del colegio, comprobación de permisos/derechos y resultados por registro.
8. Idempotencia por colegio + conexión + tipo + ID externo. Reintentos sin duplicados, exclusión de ejecuciones incompatibles y errores parciales recuperables.
9. Importar notas para revisión, preservando escala, valor y procedencia. No sobrescribir notas aprobadas ni publicar boletas automáticamente.
10. Probar caída de Moodle, cambios posteriores a vista previa, cancelación/deshabilitación, dos colegios aislados y repetición del lote.

Primera integración: importación manual y revisable. Fuera de esta entrega: programación automática, sincronización bidireccional y creación/reorganización remota de categorías.

Autoridad propuesta: KNOROOMS gobierna estructura y calificación oficial; Moodle aporta actividades y notas fuente. Confirmar la matriz con el piloto. No mantener una transacción de base abierta durante llamadas de red.

## 9. Hallazgos académicos pendientes y criterio de solución

Estos hallazgos se registraron antes del piloto y no se resolvieron al implementar suscripciones. Revisar su estado en el código antes de intervenir:

| Hallazgo | Trabajo necesario |
|---|---|
| Validación incompleta de relación materia-sección en notas | Modelar carga académica explícita por año/sección, independiente del docente; rechazar notas ajenas a ella. |
| Boletas usan catálogo completo del colegio | Contar solo materias esperadas de la matrícula/sección. |
| Publicación basada en notas presentes | Distinguir parcial/completa y exigir completitud/revisión según política. |
| Promedio simple/umbral de respaldo | Validar reglas por nivel/año con el piloto; no inventar normas MINERD. |
| Asistencia acumulada sin delimitar período de boleta | Filtrar por fechas correctas del período. |

Puntos de entrada: `Modules/Grading/Application/GradingService.cs` y `Modules/ReportCards/Application/ReportCardsService.cs` dentro de Knorooms.Modules.

El orden 5 consolida estas áreas. La parte indispensable para una importación íntegra **se adelanta dentro del orden 4**, antes de guardar datos importados. Después, orden 6: recorrido completo del piloto desde alta del colegio hasta publicación revisada de boleta.

## 10. Otras cosas que faltan o requieren decisión

- Colegio piloto y validación humana del recorrido completo.
- Experiencias completas para docentes y familias, comunicaciones, exportaciones operativas y cobros familiares.
- Tarifas y condiciones comerciales reales, retención a largo plazo y procedimiento de salida/exportación de datos.
- SMTP y secretos de producción, dominio/TLS, despliegue, respaldo/restauración y observabilidad operativa verificados.
- Reglas y formatos escolares oficiales validados con el centro; no afirmar certificación ni integración SIGERD/MINERD.
- Pruebas visuales autenticadas de las pantallas nuevas. La etapa 2 encontró rechazo de las credenciales locales de prueba; no se cambió la contraseña. En etapa 3 se verificó HTTP 200 de la ruta de planes, no un recorrido completo de usuario autenticado en navegador.
- Revisión final del diff y preservación del trabajo en Git con aprobación/contexto apropiado.

Fuera del alcance inicial: universidades, contabilidad completa, nómina, transporte, biblioteca, app móvil nativa, pasarela automática, sincronización bidireccional e integración estatal oficial.

## 11. Ejecutar el proyecto localmente

### Requisitos

Windows/PowerShell en el entorno usado, .NET SDK 10 y dotnet-ef, Node/pnpm según archivos del proyecto, Docker Desktop activo. Revisar versiones y configuración existentes antes de instalar o reemplazar nada.

Desde la raíz:

```powershell
Set-Location C:\dev\WebSite\knorooms.com
git status --short
docker compose -f infrastructure/docker/docker-compose.yml up -d
docker compose -f infrastructure/docker/docker-compose.mail.yml up -d
```

En una máquina nueva, restaurar dependencias con `dotnet restore backend/Knorooms.slnx` y `pnpm --dir apps/web install --frozen-lockfile`. Conservar archivos de configuración existentes; copiar ejemplos solo cuando falten, nunca sobrescribir `.env.local` ni claves ya configuradas.

### Configuración que se debe conocer

| Componente | Ubicación/nombres |
|---|---|
| Web/BFF | `apps/web/.env.local`; referencia en `apps/web/.env.example` |
| Host y API | APP_BASE_DOMAIN, PLATFORM_SUBDOMAIN, API_BASE_URL |
| Sesión | REDIS_URL, SESSION_ENCRYPTION_KEY, SESSION_COOKIE_SECURE y tiempos de sesión |
| Backend | appsettings y variables de entorno; `ConnectionStrings__DefaultConnection` para runtime |
| Identidad | Opciones de Authentication/Tokens en configuración existente; no copiar secretos al cliente |
| Invitaciones | Invitations__SigningKey, BaseDomain, Scheme y opciones SMTP |
| Workers/arranque | Database__EnableOutboxWorker, Database__AutoMigrateOnStartup, Database__SeedDevelopmentData |

`backend/src/Knorooms.Api/appsettings.Local.json` está ignorado por Git y se carga en Development. No se reproducen claves ni contraseñas en esta guía. Generar valores propios para un entorno nuevo; conservar los existentes si se desea mantener sesiones e invitaciones válidas.

Configurar correo local cuando sea necesario:

```powershell
pwsh -File infrastructure/scripts/configure-local-mail.ps1
```

El script prepara SMTP local y conserva la clave existente. Mailpit captura mensajes: no los envía a Internet.

### Migraciones y arranque

Migraciones nuevas aplicadas durante este trabajo a la base local:

- `20261020021011_AddInstitutionSetupAndInvitations`.
- `20261020155537_AddSubscriptionsAndEntitlements`.

Para otra copia/base, usar el rol migrador del entorno y revisar el destino. Ejemplo con variable previamente configurada de forma segura:

```powershell
dotnet ef database update --project backend/src/Knorooms.Modules --startup-project backend/src/Knorooms.Api --configuration Release --connection $env:KNOROOMS_MIGRATOR_CONNECTION
```

No ejecutar ese ejemplo con variable vacía ni con conexión de producción por accidente. No usar `EnsureCreated`, no borrar volúmenes y no ejecutar la API con el rol migrador.

En una terminal para backend, después de aplicar migraciones:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Database__AutoMigrateOnStartup = 'false'
dotnet run --project backend/src/Knorooms.Api -c Release --no-launch-profile --urls http://localhost:5080
```

En otra terminal:

```powershell
pnpm --dir apps/web dev
```

No iniciar otra copia si el puerto ya está ocupado. Un proceso de API en Windows puede bloquear DLLs al compilar: detener únicamente el proceso de este proyecto y reiniciarlo después. No terminar indiscriminadamente todos los procesos dotnet/node.

### Direcciones útiles

| Servicio | URL/puerto |
|---|---|
| Web pública local | http://localhost:3000 |
| Administración | http://admin.localhost:3000 |
| Planes | http://admin.localhost:3000/plans |
| Portal de un colegio | http://SLUG.localhost:3000, usando un slug real |
| Ficha | Host administrativo, ruta `/institutions/ID` |
| Suscripción | Host administrativo, ruta `/institutions/ID/subscription` |
| API salud | http://localhost:5080/health/live y /health/ready |
| Mailpit | http://localhost:8025; SMTP 1025 |
| PostgreSQL / Redis | 5432 / 6379 según compose |

`/platform` y `/school` son rutas internas reescritas: no usarlas directamente en el navegador. Si PowerShell no resuelve `admin.localhost`, se comprobó la ruta usando localhost con encabezado `Host: admin.localhost:3000`; no cambiar las reglas de tenancy para resolver un problema de DNS local.

La semilla está en `DatabaseSeedAndInitializer.cs`. No asumir que sus credenciales de ejemplo coinciden con cuentas de una base existente. No resetear contraseñas automáticamente para una prueba. Redis local no tiene persistencia configurada: reiniciarlo puede invalidar sesiones; no representa pérdida de datos académicos de PostgreSQL.

## 12. Pruebas y evidencia disponible

Último cierre funcional del orden 3:

- 33 pruebas unitarias backend aprobadas.
- 15 pruebas de integración backend aprobadas, con PostgreSQL real/Testcontainers y rol sin bypass RLS.
- 43 pruebas frontend/BFF aprobadas.
- Total: **91 pruebas**.
- Lint, TypeScript, Prettier y build Next.js aprobados; diff sin errores de espacios.
- Migración local aplicada; salud de API respondió 200; ruta de planes respondió 200 con host administrativo.
- Había advertencias de analizadores ya existentes en backend. No interpretar «compila» como «cero advertencias».
- No se verificó despliegue de producción ni un recorrido manual autenticado completo de las pantallas nuevas.

Para repetir tras cambios:

```powershell
dotnet build backend/Knorooms.slnx -c Release
dotnet test backend/Knorooms.slnx -c Release
pnpm --dir apps/web format:check
pnpm --dir apps/web lint
pnpm --dir apps/web typecheck
pnpm --dir apps/web test
pnpm --dir apps/web build
```

Pruebas nuevas clave: `InstitutionSetupIntegrationTests`, `InvitationSmtpTests`, `SubscriptionsIntegrationTests`, `CommercialRulesTests`, `SubscriptionTestData` y `subscription-schemas.test.ts`. Los tests académicos ahora asignan explícitamente un plan de prueba; eso no es una semilla comercial de producción.

Mantener pruebas de: aislamiento entre dos colegios incluso con IgnoreQueryFilters, uso único/concurrente de invitaciones, acceso sin contrato, límites concurrentes, versión nueva sin alterar contratos anteriores, excepciones/dependencias, vencimiento/suspensión conservando registros y bloqueo fuera de HTTP. No saltar pruebas para ocultar errores.

## 13. Git, copias de seguridad y traslado a otra IA/máquina

Al redactar esta guía: rama `main`, último commit observado `2ad4b29` (`feat(attendance,grading,reportcards): implement evaluation vertical slices with RLS`). **Ese commit no representa por sí solo todo lo construido posteriormente.**

`git status` muestra cambios y archivos sin seguimiento de órdenes 1–3, además de cambios de interfaz ya existentes. No ejecutar `git reset --hard`, `git clean` ni revertir archivos por no haberlos escrito la nueva IA. Revisar también archivos sin seguimiento: `git diff` por sí solo no los incluye.

Cambios preexistentes de shell/navegación que se preservaron incluyen `apps/web/src/app/platform/page.tsx`, `components/school/school-shell.tsx`, `components/shell/`, navegación de platform/school y eliminación del antiguo `school-header.tsx`. El arranque de Next añadió un bloque de instrucciones a `apps/web/AGENTS.md`; no asumir que todo el diff fue escrito por una misma etapa.

Para transferir el trabajo hacen falta tres cosas distintas:

1. **Código y documentos**, incluidos archivos locales sin seguimiento, preservados mediante una copia o commits revisados.
2. **Configuración privada**, transferida por un medio seguro, fuera de Git y de este documento.
3. **Datos PostgreSQL**, con respaldo y restauración verificados si se desea conservar la misma base. Copiar el código no copia el volumen Docker.

No guardar tokens, claves, `.env.local`, `appsettings.Local.json` ni volcados con datos personales en el repositorio. Esta guía no realizó backup, commit, push ni despliegue.

## 14. Cómo continuar tú mismo

Para probar lo existente: iniciar servicios, entrar con una cuenta global válida, crear una versión de plan con condiciones reales, abrir un colegio y asignar vigencia/módulos; invitar a su administrador y revisar el correo en Mailpit. Probar con datos de desarrollo, sin afectar un colegio real.

Para avanzar en código: escoger una tarea concreta del orden 4, leer las reglas y contratos correspondientes, implementar una unidad verificable, probar dos colegios y actualizar esta guía. No comenzar directamente por importar notas sin resolver las relaciones académicas que deben validarlas.

Antes de cualquier despliegue, confirmar destino, configuración, credenciales privadas, respaldo, migraciones y forma de recuperación. La autorización para continuar desarrollo local no equivale automáticamente a autorización para modificar Moodle remoto o publicar producción.

## 15. Texto listo para entregar a otra IA

> Trabaja en C:\dev\WebSite\knorooms.com. Primero lee CONTINUIDAD.md, AGENTS.md y las reglas de backend/frontend, luego revisa git status incluyendo archivos sin seguimiento. No descartes cambios: las etapas 1–3 tienen trabajo local pendiente de commit. KNOROOMS es un SaaS escolar para República Dominicana, con .NET 10, Next.js BFF, PostgreSQL RLS y Redis. Ya existen ficha de colegio, invitaciones SMTP y planes/suscripciones/derechos. La próxima etapa funcional es Moodle para un piloto (orden 4), no universidades. Conserva consulta histórica al vencer una suscripción, bloquea cambios y mantén permisos separados de contratación. Moodle todavía no está implementado y no debe activarse ficticiamente. Antes de importar notas, resuelve carga académica y validación materia-sección. No copies credenciales de los sistemas anteriores ni alteres producción/Moodle remoto sin autorización. Dime qué tarea vas a abordar y desarrolla únicamente el alcance que te indique, preservando arquitectura, pruebas y documentación.

## 16. Mantenimiento de esta guía

Actualizar fecha, estado, decisiones, pruebas ejecutadas, migraciones, limitaciones y siguiente tarea al cerrar cada etapa. Diferenciar siempre: propuesto, implementado, probado automáticamente, probado manualmente y desplegado. Si cambia una política funcional aprobada, registrarla en los documentos correspondientes y no solo en el chat.

## Actualización 22/10/2026 — bloqueo de inicio de sesión
Se reportó un botón esperando indefinidamente. La cuenta administrativa indicada existe, está activa y no estaba bloqueada. Las solicitudes diagnósticas de credenciales inválidas respondieron 401 rápidamente; no se reprodujo el intento exacto del usuario ni se cambió su contraseña. Se añadieron límites de 12 s para la API de autenticación, 5 s para comandos Redis y 25 s para el cliente; manejo de respuesta inválida, errores de persistencia de sesión con 503 sin cookie y verificación de resultados de la transacción Redis. No equivale a confirmar un acceso exitoso con la contraseña del usuario: queda repetir ese intento. Pasaron 50 pruebas frontend/BFF, lint, TypeScript, formato y build. Se reinició únicamente la web local.

## Cierre del rediseño de instituciones — 22/10/2026
Flujo vigente en ADR-0006 y docs/architecture/institution-management.md. Se verificaron creación en 3 pasos, módulos/dependencias, guardado, ficha, modal y móvil con base QA aislada; luego se eliminó QA. Pasaron 105 pruebas (33 unitarias + 17 integración + 55 frontend), lint/tipos/formato/build. Migración AddDirectInstitutionModules aplicada a PostgreSQL local; respeta selecciones vigentes previas y conserva datos. La UI no depende de planes. Se reiniciaron API 5080 y web 3000. Resend preparado como proveedor predeterminado; el desarrollo mantiene SMTP/Mailpit explícito. Para correo real faltan clave de Resend y remitente verificado del propietario. Código y documentos siguen sin commit/push; no se desplegó producción.

## Actualización visual — Tailwind propio (22/10/2026)
ADR-0007 sustituye shadcn. Componentes React nativos en components/ui, sin Radix ni CVA; cambios de diseño preservan hooks/API y contratos. Resend MCP quedó registrado y autorizado en la sesión anterior; la clave y el remitente del backend todavía requieren validación. No afirmar que el envío real esté listo.

## Prioridad vigente: interfaz del HTML adjunto (23/10/2026)
El propietario entregó KNOROOMS-Administracion-Global (1).html y pidió seguir su interfaz conservando la fuente del sistema. Referencia copiada en docs/design/administration-global-reference.html; explicación en docs/design/administration-global.md. La entrada `/` es ahora Dashboard y el directorio `/institutions`. Se mantienen creación de tres pasos, módulos directos sin planes, Moodle Próximamente e invitación contextual. Dashboard, búsqueda y avisos consumen datos reales. No importar el script/datos demo ni las fuentes del HTML. Componentes pequeños separados de schemas/api/hooks; no reintroducir shadcn. El nuevo endpoint es GET /api/platform/institution-management/dashboard con permiso PlatformInstitutionsRead. Sin migraciones ni cambios RLS para esta ampliación.
