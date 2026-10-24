# Portal de colegios — interfaz aprobada y adaptación funcional

Referencia del propietario: `school-portal-reference.html`, copia de `KNOROOMS-Portal-Colegios.html`. Implementación local revisada el 23/10/2026.

## Diseño y navegación

Se conserva la dirección visual del HTML: barra lateral agrupada, azul como color principal, tarjetas blancas, fondos suaves, estados con contraste y fuente del sistema. Tailwind CSS y componentes propios; no se añade shadcn ni una biblioteca visual nueva.

Las pantallas dejan de concentrar formularios y consultas distintas en una sola vista:

| Ruta pública del colegio | Función |
| --- | --- |
| `/` | Resumen con cifras reales, matrículas mensuales, ocupación de secciones y accesos según permisos. |
| `/students` | Directorio con búsqueda, estado y paginación. Tarjetas en móvil y tabla en escritorio. |
| `/students/new` | Alta del expediente permanente. |
| `/students/[id]` | Ficha con resumen, responsables y matrículas; acciones contextuales de vinculación, matrícula, traslado y retiro. |
| `/guardians`, `/guardians/new` | Directorio y alta de responsables. |
| `/enrollments` | Consulta de matrículas y capacidad de secciones. |
| `/academic/years`, `/academic/grades`, `/academic/subjects`, `/academic/assignments` | Años, grados/secciones, materias y carga docente en vistas separadas. |
| `/academic/{years,grades,sections,subjects,assignments}/new` | Formularios independientes para cada registro. |
| `/attendance` | Registro de asistencia por año, sección y fecha. |
| `/grading` | Libro de notas por materia y período, captura, corrección y aprobación con los contratos existentes. |
| `/report-cards` | Consulta, publicación, rectificación y versiones históricas. |
| `/settings/policies`, `/settings/policies/new` | Consulta y creación de políticas de evaluación versionadas. |
| `/members` | Equipo institucional y gestión de membresías existente. |
| `/settings` | Información institucional, módulos, roles y acceso a las reglas académicas. |
| `/moodle` | Explicación de la integración pendiente, sin simulación de conexión. |

Las rutas antiguas `/academic` y `/evaluations` siguen disponibles como entradas a sus vistas correspondientes. El proxy mantiene la protección de `/school` como ruta interna.

## Separación de responsabilidades

- Páginas delgadas en `app/school`; carga inicial en `features/school/server`.
- Navegación centralizada en `features/school/navigation`.
- Componentes visuales en cada área: `students`, `academic`, `evaluations` y los bloques comunes de `features/school/components`.
- Formularios, filtros, mutaciones y feedback en hooks; los servicios API y esquemas existentes siguen siendo la frontera con el backend.
- Las páginas con datos de sesión incluyen límites explícitos de Suspense. Las claves de las vistas incorporan la versión de los datos iniciales para evitar conservar un estado obsoleto al volver a una ruta visitada.
- Toasts para resultados de operaciones; errores y vacíos siguen teniendo representación visible en la página.

## Adaptación del prototipo al producto real

El HTML es referencia visual, no una especificación para incorporar datos ficticios o sustituir las reglas del servidor. No se trasladan su almacenamiento simulado, selector de usuarios de demostración, notificaciones inventadas ni una actividad reciente sin fuente real.

Los indicadores del inicio se calculan a partir de expedientes, matrículas y estructura académica reales. El gráfico cuenta registros por mes, incluidos traslados; no representa personas únicas. Los datos no disponibles se distinguen de cero.

La aprobación de notas conserva la separación de actores del backend. Publicar una boleta continúa sujeto a sus validaciones; el contador de notas registradas no certifica que todas estén aprobadas. No se añade una exportación PDF ni se afirma validez oficial de las boletas.

Las acciones de escritura requieren permisos y capacidad de escritura del módulo. El BFF, CSRF, sesiones del servidor y aislamiento institucional se conservan. La administración global sigue usando su propia presentación. No hay migraciones ni cambios de reglas académicas para este rediseño.

## Verificación realizada

- Formato, ESLint y TypeScript sin errores.
- Suite del frontend: 58 pruebas en 14 archivos, todas aprobadas.
- Compilación de producción de Next.js completada.
- Prueba visual con una base local aislada: creación de estudiante, matrícula, asistencia y nota; consulta de políticas y regreso a páginas previamente visitadas.
- Navegación por organización académica, formulario de año, boletas y configuración.
- Revisión móvil a 390 px: menú, tarjetas de estudiantes y ausencia de desbordamiento horizontal de la página.

Los registros de prueba no se insertaron en la base habitual del propietario. No se desplegó a producción. Moodle y la validación normativa del modelo de evaluación continúan siendo trabajo funcional pendiente, independiente de este diseño.
