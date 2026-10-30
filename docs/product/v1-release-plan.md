# Plan de la versión v1.0 de KNOROOMS
Fecha: 2026-10-30. Backlog en Jira con la etiqueta `v1` (filtro: `project = KNO AND labels = v1 ORDER BY priority DESC`).

## Objetivo
Publicar una primera versión que un colegio pueda usar de punta a punta sin ayuda del equipo: el administrador da acceso a su personal con roles y permisos, la secretaría lleva el expediente y los documentos de cada estudiante, los docentes pasan lista y registran notas solo en sus clases, y la dirección aprueba y entrega boletas. Moodle se ofrece como integración opcional para el piloto.

Este plan complementa la [secuencia de implementación](implementation-roadmap.md) y el [alcance](scope.md). Añade un bloque que el roadmap no tenía: **personal, roles y permisos del colegio**. Sin él, un colegio no puede operar, porque el administrador no tiene forma de dar acceso a sus docentes.

## Diagnóstico (30/10/2026)
- Los colegios del seed quedan en solo lectura (sin `InstitutionModuleSettings`): por eso no aparecen "crear estudiante" ni otras escrituras.
- Authorization solo permite listar miembros y roles y revocar membresías. No hay invitación de personal, asignación de roles ni roles personalizados, aunque los permisos `members.manage` y `roles.manage` existen.
- El docente no está limitado a sus secciones (Grading y Attendance no consultan `TeacherAssignment`) y la plantilla `Guardian` lee todos los expedientes.
- El expediente del estudiante es mínimo (nombre, código, fecha de nacimiento) y no se puede editar. No hay almacenamiento de archivos ni documentos.
- Faltan recuperación de contraseña, MFA real, períodos con fechas, rectificaciones, PDF de boleta, reportes y la infraestructura de producción.

## Fases y orden
Las prioridades de Jira siguen este orden; dentro de una fase, primero lo marcado *Highest*.

| Fase | Contenido | Tickets | Puntos aprox. |
|---|---|---|---|
| 0 · Base | Seed usable y almacenamiento privado de archivos | KNO-32, KNO-33 | 7 |
| 1 · Personal y roles | Catálogo de permisos, invitar personal, asignar roles, roles personalizados, docente limitado a sus clases, responsable sin acceso amplio, contraseñas, MFA, Resend real, pruebas de componentes | KNO-34 a KNO-41, KNO-28, KNO-25 | 52 |
| 2 · Expediente y documentos | Ficha ampliada, edición, tipos de documento, documentos del estudiante, faltantes, importación masiva | KNO-42 a KNO-47, KNO-24 | 38 |
| 3 · Operación académica | Carga académica, boletas correctas, períodos, edición académica, rectificaciones, PDF, "Mis clases", reportes | KNO-20 a KNO-23, KNO-16, KNO-48 a KNO-53 | 56 |
| 4 · Moodle y consola | Refinamiento, conexión, correspondencias, importación, historial, logo, auditoría visible | KNO-29, KNO-54 a KNO-59 | 36 |
| 5 · Lanzamiento | Despliegue, staging y TLS comodín, respaldos, observabilidad, endurecimiento, legal, guía de usuario, E2E, deuda técnica, piloto y aceptación | KNO-27, KNO-60 a KNO-67, KNO-13, KNO-14, KNO-15, KNO-17 a KNO-19, KNO-26 | 66 |

Total aproximado: 255 puntos. Con la capacidad de referencia (25-30 puntos por sprint de dos semanas) son unos 9-10 sprints.

## Propuesta de sprints
| Sprint | Foco | Tickets sugeridos |
|---|---|---|
| 1 | Desbloquear y empezar personal | KNO-32, KNO-33, KNO-34, KNO-35, KNO-39, KNO-28 |
| 2 | Cerrar personal y roles | KNO-36, KNO-37, KNO-38, KNO-40 |
| 3 | Expediente + arranque de despliegue | KNO-42, KNO-43, KNO-44, KNO-27 |
| 4 | Documentos e importación | KNO-45, KNO-46, KNO-47, KNO-25 |
| 5 | Integridad académica | KNO-16, KNO-20, KNO-21, KNO-49 |
| 6 | Cierre académico | KNO-22, KNO-23, KNO-48, KNO-50 |
| 7 | Salidas para el colegio | KNO-51, KNO-52, KNO-53, KNO-60, KNO-41 |
| 8 | Moodle piloto | KNO-29, KNO-54, KNO-55, KNO-56 |
| 9 | Preparación de producción | KNO-57, KNO-58, KNO-59, KNO-61, KNO-62, KNO-63 |
| 10 | Lanzamiento | KNO-64, KNO-65, KNO-26, KNO-66 y deuda restante |

El despliegue (KNO-27) arranca en el sprint 3 para tener staging de demostración desde temprano. Los textos legales (KNO-64) dependen de un abogado y conviene iniciarlos en paralelo cuanto antes.

## Dependencias clave
- KNO-33 (archivos) → KNO-42 (foto), KNO-45 (documentos), KNO-47 (importación), KNO-58 (logo).
- KNO-34 (catálogo de permisos) → KNO-37 (roles personalizados) y los permisos nuevos de las fases 2-3.
- KNO-28 (Resend real) → KNO-35 (invitar personal) y KNO-40 (recuperar contraseña) en un entorno real.
- KNO-38 (docente limitado) → KNO-52 ("Mis clases").
- KNO-20 (carga académica) → KNO-21, KNO-22, KNO-55, KNO-56.
- KNO-49 (períodos) → KNO-23 y el cierre de períodos.

## Fuera de la v1
Portal familiar, comunicaciones, aplicación móvil, cobros a familias, sincronización Moodle automática o bidireccional, SIGERD y universidades, según el [alcance](scope.md). El rol Responsable no se asigna hasta que exista el portal familiar.

## Decisiones abiertas para el PO
- Campos obligatorios de la ficha del estudiante y lista inicial de tipos de documento (validar con el colegio piloto).
- Granularidad final del catálogo de permisos (KNO-34).
- Plataforma de despliegue y proveedor de almacenamiento S3 compatible (KNO-27, KNO-33).
- Si Moodle entra en la v1 o pasa a v1.1 según la disponibilidad del colegio piloto.
- Reglas de evaluación por nivel y formato de boleta.
