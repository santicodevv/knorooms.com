# Administración SaaS y Moodle — arquitectura objetivo
Fecha: 2026-10-19. Diseño de evolución; no describe funcionalidades ya desplegadas.
Complementa [la arquitectura actual](overview-and-modules.md) y [el alcance](../product/scope.md).

## 1. Conservar la base
Continuar con .NET 10, EF Core, PostgreSQL compartido con RLS, Next.js BFF y Redis. No crear microservicios, nuevos proyectos por módulo ni reemplazar autenticación. Los 12 módulos actuales no son un límite permanente ni un catálogo de funcionalidades contratables.

## 2. Propiedad de responsabilidades
| Propietario | Responsabilidad objetivo | Estado |
|---|---|---|
| Tenants | Identidad, datos generales y estado operativo del colegio | Existe; ampliar configuración. |
| Platform | Orquestación de ficha, alta e implementación inicial | Existe con alta básica. |
| Identity / Authorization | Invitaciones, cuenta, membresía y permisos | Base existente; completar invitación. |
| Subscriptions | Planes versionados, asignación, vigencia y estado comercial | Implementado en orden 3; ver subscriptions-and-entitlements.md. |
| Entitlements | Catálogo de módulos, dependencias, límites y derechos efectivos | Implementado en orden 3; ver subscriptions-and-entitlements.md. |
| Integrations | Conexiones por colegio, adaptador Moodle, correspondencias y ejecuciones | Nuevo módulo previsto; Moodle es el primer adaptador. |
| Academic | Años, niveles, grados, secciones y carga académica | Existe; completar carga independiente del docente. |
| Students / Enrollments | Expedientes, responsables, identidad conciliada y matrículas | Existen; recibir importaciones mediante contratos. |
| Grading / ReportCards | Revisión, política y publicación oficial | Existen; corregir validaciones antes del piloto. |
| SupportAccess / Audit | Acceso temporal, trazabilidad y control de operaciones | Reutilizar base. |

Estos nombres son límites de responsabilidad acordados para evolucionar el monolito. No crear carpetas vacías ni endpoints ficticios solo para simular avance.

## 3. Contratos y autorización
Platform coordina mediante Contracts; no modifica entidades internas de otros módulos. Subscriptions informa las condiciones contratadas; Entitlements resuelve si la operación está habilitada y dentro de límites; Authorization verifica quién puede ejecutarla. Integrations usa contratos de los módulos académicos y no inserta directamente en sus tablas.

Evaluación de una operación institucional: contexto y membresía/concesión válidos + permiso + derecho efectivo + invariantes de negocio. El frontend consulta capacidades efectivas, pero la API y los trabajadores vuelven a validarlas. Un cambio de plan debe invalidar cachés de derechos; no depender de una sesión antigua para aplicar restricciones.

Los endpoints globales pueden identificar el colegio objetivo de una operación administrativa autorizada según el patrón actual de Platform. Esto no convierte un tenantId enviado por el cliente en autorización para acceder a sus datos académicos.

## 4. Datos y aislamiento
Planes y catálogo de producto son datos globales. Asignaciones, excepciones y suscripciones requieren políticas administrativas específicas: el colegio solo consulta sus propios datos comerciales permitidos, y el operador global usa permisos de plataforma. No extender ese acceso global a notas o expedientes.

Conexiones, correspondencias y ejecuciones son institucionales, con RLS forzada y referencias compuestas. Todo trabajo en segundo plano establece explícitamente un contexto institucional autorizado, lo limpia al terminar y no reutiliza el contexto de otro trabajo. No ejecutar sincronizaciones con un rol que evada RLS.

Claves lógicas mínimas: colegio + conexión + tipo de entidad + identificador externo. La deduplicación de personas exige identificadores y reglas verificadas, nunca solo coincidencia de nombres. Si cambia la instancia Moodle, no reutilizar correspondencias antiguas sin revisión.

## 5. Seguridad de conexiones
Guardar tokens cifrados mediante una clave gestionada fuera de la base o como referencia a secretos. Nunca devolver el token en consultas, auditoría, vista previa o errores. Permitir reemplazo/rotación y registrar quién lo hizo.

La URL de Moodle es entrada no confiable: exigir HTTPS en producción; bloquear destinos locales, privados y servicios de metadatos; controlar resolución DNS y redirecciones contra SSRF; limitar tiempo y tamaño de respuesta. Excepciones de desarrollo deben ser explícitas y separadas de producción.

Diagnosticar versión y capacidades reales del servicio. Mostrar las funciones faltantes y el último resultado de conexión. No asumir disponibilidad de una función ni copiar credenciales entre colegios.

## 6. Flujo de sincronización inicial
1. Operador autorizado configura conexión y ejecuta diagnóstico.
2. Integrations obtiene inventario con límites de tiempo y volumen.
3. Usuario define correspondencias de categorías/cursos a año, sección y materia.
4. Se genera vista previa: altas, actualizaciones, coincidencias, conflictos y rechazados.
5. Usuario confirma el lote revisado; se revalidan permisos, derechos, correspondencias y cambios desde la vista previa.
6. Un trabajo persistente aplica registros mediante contratos del módulo propietario, con resultado por registro.
7. La ejecución conserva resumen, errores recuperables, procedencia y punto de reanudación.

No mantener transacciones de base abiertas durante llamadas de red. Reutilizar Transactional Outbox para programar trabajo después del commit. Diseñar ejecución idempotente con clave por lote/registro, exclusión de ejecuciones incompatibles y reintentos limitados; entrega repetida no debe duplicar alumnos, matrículas o notas. Un resultado parcial debe ser visible y reintentable.

En el piloto, importar notas a revisión sin publicar boletas ni sobrescribir notas aprobadas. Conservar valor original, escala y curso fuente. No normalizar sin regla explícita.

## 7. Dependencias de la primera integración
Antes de aplicar importaciones debe existir carga académica explícita y validación de notas por sección. Puede adelantarse el diagnóstico y la vista previa mientras se corrige ese modelo; no guardar importaciones contra relaciones incorrectas.

Al desactivar la integración, detener nuevas ejecuciones y definir cómo se cancela o concluye la ejecución en curso. Conservar historial y datos académicos. No revocar ni borrar información remota automáticamente.

## 8. Verificación requerida al implementar
Pruebas de acceso cruzado entre dos colegios; credenciales ausentes en respuestas/logs; SSRF; derechos deshabilitados incluso mediante API; contexto RLS en trabajadores; reintentos sin duplicados; cambios posteriores a la vista previa; conflictos de identidad; caída de Moodle; notas locales aprobadas preservadas; importación sin publicación; aislamiento de datos comerciales y académicos.

Los contratos HTTP concretos se añadirán a api-contract.md junto con su implementación. Este documento no afirma que esas rutas ya existan.