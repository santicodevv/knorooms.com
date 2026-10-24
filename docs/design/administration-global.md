# Administración global: referencia y aplicación

Fecha: 23/10/2026. El HTML adjunto del propietario guía estructura, proporciones, colores y comportamiento visual. Se conserva la tipografía del sistema de KNOROOMS. No cargar fuentes de Google, Tailwind CDN ni el JavaScript de demostración en producción.

## Organización
- `/`: dashboard de administración global con datos reales.
- `/institutions`: directorio con búsqueda, filtros, paginación y acciones por colegio.
- `/institutions/new`: asistente de datos, módulos y confirmación.
- `/institutions/[id]`: ficha con Resumen, Información, Módulos y Administrador.

La UI usa componentes propios React/HTML y Tailwind v4. No utiliza shadcn ni Radix. Los componentes de dashboard, barra, filas, filtros, paginación, asistente, ficha e invitaciones están separados. Las peticiones y el estado se mantienen en api/, schemas/ y hooks/. Los componentes shared/ y shell/ sirven a varias páginas.

## Datos y seguridad
GET `/api/platform/institution-management/dashboard` requiere PlatformInstitutionsRead y contexto Platform. El directorio administrativo conserva sus políticas de lectura; no hay cambios de RLS ni acceso académico. Estadísticas del catálogo, conteos por módulos, doce meses acumulados (UTC), cinco colegios recientes y cinco acciones administrativas permitidas. La actividad devuelve solo acción, fecha e institución; excluye metadatos, credenciales y acciones académicas. El filtro `administrator=NotActive` incluye cualquier colegio sin administrador activo.

La búsqueda superior consulta el BFF con demora breve. Los avisos muestran invitaciones pendientes, vencidas y fallidas. No hay conteos, actividad, tendencias ni usuarios ficticios en las pantallas. Moodle sigue Próximamente. Las invitaciones, concurrencia y conservación de históricos mantienen las reglas del flujo existente.

El HTML conservado en esta carpeta es únicamente una referencia visual con datos de muestra y no forma parte de las rutas ni del bundle de la aplicación.

## Cierre de verificación
58 pruebas frontend/BFF, 33 unitarias de backend y 17 de integración aprobadas (108 total). Formato, lint, tipos y build Next.js aprobados. La integración comprueba agregaciones y restricciones del dashboard con PostgreSQL real. La revisión visual cubrió dashboard, búsqueda global, menú de fila, modal contextual, alta en tres pasos, dependencias de Boletas, ficha, retorno con revalidación y navegación móvil de 390 px sin desbordamiento horizontal. Los menús de fila utilizan Popover API nativa para evitar recortes por el contenedor de tabla.

Se utilizaron una base temporal y una cuenta QA. La base y los procesos temporales se retiraron al finalizar. La API y la web habituales siguen en 5080/3000. Sin despliegue ni envío de correo externo.
