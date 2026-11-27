# Implementación del diseño de Figma — portal del colegio

Fuente de verdad visual del portal del colegio en escritorio. Última revisión del diseño: 24/11/2026.

- Archivo: <https://www.figma.com/design/2giF5teP0UvaVwfOuNuSEt/Knorooms> (clave `2giF5teP0UvaVwfOuNuSEt`, una sola página llamada `Knorooms`).
- El archivo se lee con el MCP de Figma, que ya está configurado en Codex con el nombre `figma` (OAuth). Si pide autenticación: `codex mcp login figma`. Si faltara: `codex mcp add figma --url https://mcp.figma.com/mcp`.
- Todo el contenido está en una sola página, de arriba abajo: cada flujo es una sección numerada y cada pantalla un frame con nombre `N.M_Nombre`.

## 1. Precedencia y decisiones pendientes del propietario

Este documento **sustituye la dirección visual** de [school-portal.md](school-portal.md) (azul, fuente del sistema). Se conservan sus reglas funcionales: páginas delgadas, hooks sin JSX, BFF, permisos, sin datos ficticios. La administración global sigue regida por [administration-global.md](administration-global.md); no tiene diseño nuevo.

Confirmar antes de implementar la fase 0:

1. Aprobar el cambio visual (gris neutro, negro, IBM Plex Sans) y registrarlo en un ADR o en `school-portal.md`.
2. Cargar IBM Plex Sans con `next/font` (se descarga en compilación y se sirve desde el propio dominio). `school-portal.md` prohibía fuentes externas; esto la reemplaza.

## 2. Tokens

Colores (variables de Figma, colección «Colores»):

| Token | Hex | Uso |
| --- | --- | --- |
| `ink` | `#000000` | Texto principal, botón primario, ítem activo |
| `text/secondary` | `#5C6068` | Texto secundario |
| `text/muted` | `#7F8790` | Marcadores, ayudas, encabezados de tabla |
| `border/neutral` | `#E5E7EB` | Bordes y divisores |
| `bg/app` | `#F4F5F7` | Fondo de la aplicación |
| `bg/subtle` | `#EDEFF2` | Fondos de controles, etiquetas neutras, esqueletos |
| `bg/surface` | `#FFFFFF` | Tarjetas, sidebar, paneles |
| `success` / `success/bg` | `#1E7B4A` / `#E3F3EA` | Estados correctos |
| `warning` / `warning/bg` | `#8A5200` / `#FFF1D6` | Avisos |
| `error` / `error/bg` | `#B3261E` / `#FDECEA` | Errores y acciones destructivas |
| `cream`, `cream-deep`, `border` | `#F9EFE5`, `#F1E3D3`, `#E4DCD2` | Solo el panel de marca del Login y la invitación |

Tipografía: IBM Plex Sans (400, 500, 600, 700). Escala: título de página 34/40 SemiBold −2 %; sección 22/28 SemiBold −1 %; tarjeta 17/22 SemiBold −0,5 %; cuerpo 15/22; pequeño 13/18; etiqueta 12/16 Medium. Solo mayúscula inicial, sin mayúsculas sostenidas.

Forma: radio 10 en controles, 16 en tarjetas, 20 en paneles grandes; escala de espaciado de 4. Lienzo de 1440 px: sidebar 264, contenido con relleno 40/36, panel lateral 480, diálogo 520. Íconos Lucide a 20 px (18 en botones), trazo 2.

## 3. Navegación y rutas

| Sidebar | Ruta | Estado |
| --- | --- | --- |
| Inicio | `/` | Implementable |
| Estudiantes ▸ Estudiantes | `/students`, `/students/new`, `/students/[id]` | Implementable |
| Estudiantes ▸ Responsables | `/guardians`, `/guardians/new` | Implementable |
| Académico ▸ Años escolares | `/academic/years` | Implementable |
| Académico ▸ Grados y secciones | `/academic/grades` | Implementable |
| Académico ▸ Materias | `/academic/subjects` | Implementable |
| Académico ▸ Carga docente | `/academic/assignments` | Implementable (la vista «Por docente» agrupa en el cliente) |
| Académico ▸ Matrículas | `/enrollments` | Implementable |
| Actividad ▸ Asistencia | `/attendance` | Implementable |
| Actividad ▸ Calificaciones | `/grading` | Implementable |
| Actividad ▸ Boletas | `/report-cards` | Implementable |
| Ajustes ▸ Colegio | `/settings` | Implementable |
| Ajustes ▸ Usuarios | `/members` | Solo lista y revocar |
| Ajustes ▸ Políticas de evaluación | `/settings/policies` | Implementable |
| Ajustes ▸ Moodle | `/moodle` | Implementable («Próximamente») |
| Ajustes ▸ Roles y permisos | sin ruta | **Requiere backend nuevo** |
| Ajustes ▸ Acceso de soporte | sin ruta | **Oculto por ADR-0006** |
| Ajustes ▸ Auditoría | sin ruta | **Requiere decisión del propietario** |

El sidebar muestra el grupo activo desplegado y los demás plegados. Verificar cada ruta contra `apps/web/src/app/school` y `features/school/navigation` antes de crear una nueva.

## 4. Secciones del Figma y su alcance

| Sección de Figma | Contenido | Alcance |
| --- | --- | --- |
| 1 Login, 1 Login · Estados | Login escritorio y móvil, foco, validación, credenciales, carga | Implementar |
| 2 Inicio | Vacío, con aviso de suscripción, con datos | Implementar |
| 3 Estudiantes | Lista, crear (panel), ficha con 3 pestañas, vincular responsable, trasladar, retirar, desactivar | Implementar |
| 4 Responsables | Vacío, lista, nuevo (panel) | Implementar |
| 5 a 9 Académico | Años (incluye cerrar), grados y secciones, materias, carga docente, matrículas | Implementar |
| 10 a 12 Actividad | Asistencia, libro de notas, boletas con detalle e historial | Implementar |
| 13 Ajustes · Colegio, políticas y soporte | Colegio, políticas, Moodle | Implementar lo que no sea soporte |
| 13 (frames de Acceso de soporte) | Solicitudes y concesiones | **No implementar** |
| 14 Ajustes · Usuarios | Lista y revocar | Implementar. «Nuevo usuario» y «Roles de un usuario»: **requieren backend** |
| 15 Ajustes · Roles y permisos | Lista y editor de roles | **Requiere backend** |
| 16 Ajustes · Auditoría | Bitácora | Pendiente de decisión |
| 17 Estados del sistema | Sin permiso, error al cargar, carga | Implementar como patrón global |
| 18 Invitación, acceso y soporte | Aceptar invitación, errores de acceso, modo soporte | Invitación y errores: implementar. Modo soporte: **oculto** |
| 19 a 21 | Arquitectura, fundamentos, componentes | Referencia |

## 5. Reglas de implementación

1. Los datos de las pantallas son **ejemplos**. No copiarlos al código: ver `apps/web/AGENTS.md` (sin datos simulados). Todo sale del BFF, con estados vacío, carga, error y sin permiso.
2. Estructura FSD obligatoria (`schemas` → `api` → `hooks` sin JSX → `components`) y páginas delgadas.
3. Reutilizar y extender `src/components/ui` y `src/components/shared`; sin shadcn/ui ni Radix.
4. Crear primero las primitivas a partir de la sección «Componentes» del Figma: Botón, Etiqueta, Campo, Ítem de menú, y las repetidas (tarjeta, tabla, panel lateral, diálogo, aviso, estado vacío, casilla, interruptor, segmentado, esqueleto).
5. Los textos de las confirmaciones (retirar matrícula, desactivar expediente, cerrar año) y los nombres en Auditoría son **propuestas**: validarlos con las reglas reales.
6. Movimiento: solo `transform` y `opacity`, `scale(0.97)` al presionar, paneles y diálogos con ease-out por debajo de 300 ms, sin animar acciones de teclado, `prefers-reduced-motion` respetado.
7. Accesibilidad: foco visible, etiquetas visibles, no comunicar estados solo con color.
8. Escritorio según Figma. **El móvil no está diseñado**: adaptar la tarea (listas en tarjetas, barra inferior) y documentar la decisión.

## 6. Orden de implementación

| Fase | Entrega |
| --- | --- |
| 0 | Tokens en Tailwind, IBM Plex Sans, primitivas de `ui` |
| 1 | Login con estados, shell del portal (sidebar con grupos, usuario, layout) e Inicio |
| 2 | Estudiantes (lista, crear, ficha, acciones) y Responsables |
| 3 | Académico: años, grados y secciones, materias, carga docente, matrículas |
| 4 | Actividad: asistencia, calificaciones, boletas |
| 5 | Ajustes: colegio, usuarios (lectura y revocar), políticas, Moodle |
| 6 | Invitación, errores de acceso y estados del sistema |
| 7 | Móvil (requiere diseño previo) |

No avanzar a las funciones «requiere backend» ni a las «ocultas» sin autorización explícita.

## 7. Subagentes de Codex

Definidos en `.codex/agents/`: `figma-to-code` (implementa pantallas), `design-reviewer` (compara con Figma, solo lectura), `frontend-feature`, `api-layer`, `backend-domain`, `database`, `multi-tenancy-guardian`, `security-auditor`, `testing`, `documentation`. Flujo por pantalla: `figma-to-code` → `testing` → `design-reviewer` → `security-auditor` si hay mutaciones.

## 8. Criterio de terminado por pantalla

- Coincide con su frame de Figma a 1440 px (revisado por `design-reviewer`).
- Estados vacío, carga, error y sin permiso resueltos.
- En `apps/web` pasan `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build`.
- Sin datos ficticios, sin tokens ni `TenantId` en el navegador, sin funciones fuera de alcance.
