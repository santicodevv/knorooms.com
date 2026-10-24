# Secuencia de implementación de KNOROOMS
Fecha: 2026-10-19. Fuente de prioridad para las próximas entregas.
La presencia de código no acredita funcionamiento end-to-end ni cumplimiento normativo.

## Base observada
Existen 12 módulos, autenticación propia, administración básica, estructura académica, estudiantes, matrículas y código de asistencia/evaluación/boletas. Moodle, suscripciones y derechos comerciales no están implementados. La revisión inicial fue estática; las etapas funcionales requieren compilación y pruebas reales.

## Orden y criterios de salida
| Orden | Entrega | Criterio de aceptación |
|---|---|---|
| 1 | Alcance y arquitectura documentados | Alcance escolar, Moodle, negocio SaaS, responsables y etapas coherentes; enlaces desde README y AGENTS. Sin cambios funcionales. |
| 2 | Ficha del colegio e implementación inicial | Crear colegio, editar configuración, invitar/activar administrador y consultar pendientes; autorización y aislamiento probados. Secciones futuras claramente pendientes. |
| 3 | Planes, suscripciones y módulos | Asignar manualmente condiciones y vigencia, habilitar módulos y límites; acceso bloqueado en API y trabajos cuando corresponda; auditoría y preservación de datos verificadas. |
| 4 | Moodle para un piloto | Diagnóstico, correspondencias, vista previa e importación manual idempotente; resultados y errores visibles; sin cambios remotos ni publicación automática. |
| 5 | Consolidación académica | Carga por sección, notas y cierres coherentes; boletas completas/parciales diferenciadas; políticas validadas y asistencia del período correcto. |
| 6 | Prueba completa del piloto | Crear colegio → activar administrador → configurar año y materias → conectar Moodle → conciliar/matricular → revisar notas → publicar boleta. Evidencia y aceptación del colegio. |

**Dependencia obligatoria:** las correcciones de carga académica y validación de notas del orden 5 necesarias para guardar importaciones se adelantan dentro del orden 4. Diagnóstico/vista previa pueden avanzar antes; no se pospone esa integridad hasta después de importar. El resto de la consolidación se completa en el orden 5.

## Orden 2: implementado el 2026-10-20
Se implementó la ficha por colegio con:
- Datos generales y estado, conservando la identidad institucional y sus históricos.
- Invitación segura al administrador, aceptación y membresía; expiración y uso único.
- Seguimiento de implementación inicial y acceso al soporte existente.
- Ubicación clara de suscripción, módulos y Moodle como pendientes hasta que existan contratos reales.
- Validaciones, permisos, auditoría y pruebas de aislamiento entre dos colegios.

Los detalles de envío de invitaciones se resuelven antes de depender de correo real; no incluir credenciales en pantalla o logs. No crear planes, precios ni conexiones ficticias. No implementar órdenes 3–6 por implicación al terminar el 2.

## Correcciones registradas antes del piloto
| Hallazgo estático | Corrección esperada | Evidencia de aceptación |
|---|---|---|
| Grading consulta catálogo completo y no valida relación materia-sección | Carga académica explícita y validación en servidor | Rechazar nota para materia ajena a sección aun manipulando la petición. |
| ReportCards cuenta todo el catálogo institucional | Contar materias esperadas de la matrícula | Dos secciones con cargas diferentes producen totales correctos. |
| Publicación usa notas presentes sin exigir completitud/aprobación | Política de publicación parcial/completa y flujo de revisión | Una nota aprobada no produce cierre completo si faltan otras. Borradores no se publican como aprobados. |
| Promedio simple y umbral de respaldo no representan todas las reglas | Política validada por nivel/año, sin presumir norma | Casos acordados con piloto, incluidas recuperación y ausencia de notas. |
| Asistencia de boleta consulta toda la matrícula | Delimitar fechas del período | Registros fuera del período no alteran su asistencia. |

Referencias de revisión: GradingService.cs y ReportCardsService.cs bajo backend/src/Knorooms.Modules/Modules/. Estos hallazgos no están corregidos por este documento.

## Entregas posteriores
Experiencia docente, portal familiar, comunicaciones, exportaciones operativas y cobros escolares se priorizan con el piloto. No sustituyen el trabajo pendiente en administración SaaS y Moodle. Pasarela comercial y sincronización programada se incorporan cuando el flujo manual esté validado.

## Cierre de cada etapa funcional
Registrar qué se implementó y qué queda pendiente; ejecutar build y pruebas relevantes; actualizar contrato HTTP y estado documental; demostrar el recorrido con dos colegios aislados. No declarar cumplimiento oficial solo porque una prueba técnica pasa.
## Validación del orden 2
Backend: 25 pruebas unitarias y 14 de integración aprobadas; interfaz/BFF: 39 pruebas aprobadas. Lint, comprobación TypeScript y compilación Next.js aprobados. Migración aplicada únicamente a PostgreSQL local; SMTP configurable y Mailpit local preparados. La comprobación manual del panel quedó pendiente: el inicio de sesión rechazó las credenciales locales de prueba. No se modificaron contraseñas ni se desplegó a producción.

El orden 3 está implementado: planes versionados, vigencias manuales, excepciones auditadas, dependencias y límites transaccionales. Política confirmada: conservar consulta histórica y bloquear cambios sin suscripción activa. Ver [guía comercial](../architecture/subscriptions-and-entitlements.md). La próxima etapa prevista es el orden 4 (Moodle para un piloto), previa indicación del usuario. Guía: [ficha e invitaciones](../architecture/institution-setup-and-invitations.md).
