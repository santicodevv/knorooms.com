# Portal de colegios — interfaz aprobada y adaptación funcional

Referencia del propietario: `school-portal-reference.html`, copia de `KNOROOMS-Portal-Colegios.html`. Implementación local revisada el 23/10/2026.

## Diseño y navegación

El propietario aprobó el 24/11/2026 sustituir la dirección visual del HTML por el diseño de Figma documentado en [figma-implementation.md](figma-implementation.md). La fase 0 se implementa bajo KNO-72: grises neutros, negro e IBM Plex Sans con pesos 400, 500, 600 y 700, cargada mediante `next/font`, descargada durante la compilación y servida desde el dominio propio. Esta aprobación reemplaza la preferencia anterior por azul y fuente del sistema únicamente en el portal del colegio; la administración global conserva su presentación y fuente del sistema.

La implementación continúa por fases con aprobación del propietario entre entregas. La aprobación de la fase 0 no autoriza iniciar la fase 1. Se mantienen Tailwind CSS v4, componentes propios y todas las reglas funcionales de este documento; no se añade shadcn ni una biblioteca visual nueva.

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

## Verificación anterior (23/10/2026)

- Formato, ESLint y TypeScript sin errores.
- Suite del frontend: 58 pruebas en 14 archivos, todas aprobadas.
- Compilación de producción de Next.js completada.
- Prueba visual con una base local aislada: creación de estudiante, matrícula, asistencia y nota; consulta de políticas y regreso a páginas previamente visitadas.
- Navegación por organización académica, formulario de año, boletas y configuración.
- Revisión móvil a 390 px: menú, tarjetas de estudiantes y ausencia de desbordamiento horizontal de la página.

Los registros de prueba no se insertaron en la base habitual del propietario. No se desplegó a producción. Moodle y la validación normativa del modelo de evaluación continúan siendo trabajo funcional pendiente, independiente de este diseño.

## Fundamentos visuales — fase 0 (KNO-72)

Los tokens escolares se definen en `apps/web/src/app/globals.css` mediante `@theme static`, para conservar también los valores que utilizarán fases posteriores. El layout escolar aplica `.school-theme` y la variable de IBM Plex Sans; la fuente del documento raíz sigue siendo la del sistema. Las primitivas compartidas utilizan la variante `school:*`, manteniendo su apariencia previa fuera del portal. Las extensiones escolares de tamaño o color en `className` deben usar la misma variante.

Se añaden `MenuItem`, `Checkbox`, `Switch`, `SegmentedControl`, `Skeleton`, `Dialog` y `SidePanel`. Los controles conservan semántica HTML nativa y reciben sus etiquetas del consumidor. `SegmentedControl` recibe la selección y el callback por propiedades; el estado de cada funcionalidad pertenece a su hook. Los diálogos se abren con `showModal()` mediante una referencia, lo que conserva modalidad, Escape y restauración del foco; su título se vincula mediante `aria-labelledby`.

La revisión de diseño verificó una galería temporal a 1440 px: tipografía, colores, foco, controles, diálogo de 520 px y panel lateral de 480 px. La galería se retiró del árbol de rutas antes de la verificación final. El token `muted` conserva el valor de Figma (`#7F8790`), con contraste de 3,64:1 sobre blanco; no acredita conformidad AA para texto pequeño. Los textos funcionales deben priorizar `secondary` o `ink` cuando necesiten ese contraste.

Verificación inicial de esta entrega (24/11/2026): `pnpm format:check`, `pnpm lint`, `pnpm typecheck` y `pnpm test` terminaron correctamente; 77 pruebas en 18 archivos, incluidas 13 nuevas de semántica de primitivas y regresión de `cn`. `pnpm build` compiló 24 páginas y terminó con código 0 en el reintento normal. El primer intento se detuvo con `SecurityFatalError` por la versión instalada de Next.js 16.4.3; el reintento conservó el aviso de actualización. No se suprimieron controles.

El propietario autorizó corregir las dependencias mediante KNO-73. Se actualizaron Next.js y su configuración de ESLint a 16.4.5, Vitest y cobertura V8 a 4.1.12, junto con las resoluciones transitivas afectadas; ver [verificación de dependencias](../testing/frontend-dependencies.md). La instalación del conjunto se reprodujo con `pnpm install --frozen-lockfile` y `pnpm audit` terminó con código 0, sin vulnerabilidades conocidas, frente a los 16 avisos iniciales. No se añadieron excepciones ni se suprimieron comprobaciones. La fase 1 continúa pendiente de aprobación.

Verificación final conjunta de KNO-72 y KNO-73: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` terminaron con código 0. El build de Next.js 16.4.5 completó 24 páginas sin el aviso de vulnerabilidad. `pnpm test:coverage` y el resumen de CI también terminaron con código 0: 77 pruebas correctas en 18 archivos, sin fallos ni omisiones. No se cambiaron umbrales ni se excluyeron pruebas para completar la migración. La fase 0 queda terminada localmente, sin despliegue a producción.
