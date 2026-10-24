# Alcance de producto — KNOROOMS para colegios
Fecha: 2026-10-19 · Versión: 1.0 · Alcance acordado; implementación parcial.

## 1. Objetivo y prioridad
KNOROOMS es un SaaS para administrar colegios y escuelas de República Dominicana. El equipo de KNOROOMS crea y acompaña a cada colegio, asigna su suscripción y habilita los módulos contratados. Cada centro conserva sus usuarios, datos y configuración; puede conectar su propia instancia de Moodle.

La prioridad comercial inicial son colegios que puedan participar en un piloto. La incorporación de escuelas públicas requerirá validar sus condiciones operativas y de contratación; no se presume integración estatal. Universidades y educación superior quedan fuera del alcance inicial. No se debe desarrollar funcionalidad universitaria por anticipación.

Moodle es opcional para el colegio y parte explícita del producto. Un colegio sin Moodle puede operar con captura manual; uno que lo use tendrá conexión, correspondencias y sincronización administrables. No debe quedar relegado indefinidamente ni ser una dependencia obligatoria para usar el núcleo escolar.

## 2. Estructura y vocabulario
Estructura visible: **Colegio → Año escolar → Nivel / Grado / Sección → Materias**.
Ejemplo ilustrativo: Colegio Ejemplo → 2026–2027 → Secundaria / 1.º A → Matemáticas.

- Año escolar: ciclo anual con fechas y estado; los períodos de evaluación dentro de él son conceptos separados.
- Grado y sección son entidades distintas: varias secciones pueden pertenecer al mismo grado.
- Materia: catálogo institucional reutilizable. La carga académica determina qué materias corresponden a un grado/sección en un año.
- La carga académica debe existir aunque todavía no se haya asignado docente.
- Matrícula: vincula al estudiante con año y sección; el expediente del estudiante se conserva entre años.
- Curso de Moodle: aula externa asociada mediante una correspondencia explícita; no es automáticamente un grado ni una materia del catálogo.
- Las categorías de Moodle no se interpretan exclusivamente por profundidad o nombre. Las ediciones y cursos históricos no deben duplicar materias.
- No trasladar la regla universitaria «número de cursos aprobados = programa completado» a la promoción escolar.

## 3. Usuarios y superficies
| Superficie | Usuario | Responsabilidad |
|---|---|---|
| Consola global | Operador autorizado de KNOROOMS | Colegios, administradores iniciales, planes, suscripciones, módulos y seguimiento de implementación. |
| Administración del colegio | Dirección y personal autorizado | Estructura académica, personal, estudiantes, responsables, matrículas, configuración y revisión de resultados. |
| Espacio docente | Docente | Secciones y materias asignadas, asistencia y evaluación según permisos. |
| Portal familiar | Responsable autorizado | Información de sus estudiantes según vínculo y permisos, boletas publicadas y comunicaciones. |
| Soporte | Operador con concesión temporal | Atención dentro del colegio con alcance, vencimiento y auditoría. |

La consola global no otorga acceso irrestricto a expedientes o notas. Se conserva el mecanismo de soporte autorizado. El portal docente y familiar completo es trabajo futuro; registrar responsables no equivale a tener un portal familiar.

## 4. Ficha administrativa del colegio
La próxima entrega debe convertir el alta básica en una ficha usable:
1. Datos generales: nombre, contacto, dirección, identificación del centro cuando corresponda, logo, subdominio y zona horaria.
2. Administradores: invitación, aceptación, estado y gestión de acceso; no depender de crear usuarios manualmente fuera del flujo.
3. Implementación inicial: tareas pendientes y responsable de acompañamiento; estados de invitación y preparación visibles.
4. Suscripción: plan, vigencia, estado y límites contratados.
5. Módulos: habilitación efectiva, dependencias y motivo de restricción.
6. Moodle: conexión, diagnóstico, correspondencias y ejecuciones.
7. Soporte e historial: solicitudes, concesiones y cambios auditados.

Las secciones todavía no implementadas deben indicarse como pendientes; no mostrar datos ficticios ni botones que simulen resultados. Credenciales y notas no deben exponerse en listados globales.

## 5. Suscripciones y módulos
La suscripción del colegio a KNOROOMS es distinta de los pagos de las familias al colegio. La segunda función queda para una fase posterior.

La primera versión comercial debe permitir administración manual de suscripciones y vigencias, sin depender de una pasarela de cobro. Precios, moneda comercial, períodos de gracia y límites concretos siguen pendientes de validación comercial.

- Catálogo de módulos y planes versionados; registrar las condiciones asignadas al cliente.
- Derechos efectivos por colegio: plan, vigencia y excepciones explícitas auditadas.
- Validación en backend para operaciones y trabajos en segundo plano; la interfaz refleja el mismo resultado.
- Permisos del usuario y contratación son controles distintos: se requieren ambos.
- Deshabilitar un módulo no elimina datos. Debe definirse qué consulta/exportación histórica se conserva al vencer una suscripción.
- Estado de institución, estado de suscripción y estado de conexión Moodle son independientes.
- Mantener disponibles los flujos necesarios para soporte, regularización y salida de datos según la política acordada.
- Dependencias explícitas: por ejemplo, boletines requieren matrícula, carga académica y evaluación.

## 6. Moodle como integración por colegio
Primera entrega: conexión y diagnóstico, correspondencias, vista previa e importación manual controlada para un colegio piloto. La programación automática se habilita después de validar esta operación. La sincronización bidireccional y la creación o reorganización remota de categorías quedan fuera de esta primera entrega.

| Dato | Autoridad propuesta para el piloto |
|---|---|
| Estructura escolar y carga académica | KNOROOMS; propuestas importadas requieren revisión antes de adoptarse. |
| Personas y matrículas | KNOROOMS tras conciliación de la importación inicial; no sobrescribir cambios locales automáticamente. |
| Actividades y calificaciones de actividades | Moodle; conservar procedencia y escala. |
| Calificación oficial y boleta | KNOROOMS, bajo política de evaluación y revisión autorizada. |
| Identificadores externos | Integración; separados del identificador interno y del colegio. |

La matriz anterior es el valor inicial propuesto y se confirma con el colegio piloto antes de importar datos.

Requisitos: secretos cifrados o referencias a un gestor de secretos; diagnóstico de capacidades del servicio; correspondencias explícitas; ejecución idempotente; errores por registro; reintentos limitados; historial y resumen sin secretos. No asociar personas solo por nombre. Los casos ambiguos requieren conciliación.

Una sincronización no publica boletas, no elimina registros locales por ausencia remota y no altera Moodle en silencio. Las notas importadas no equivalen automáticamente a una aprobación oficial.

## 7. Núcleo académico y calidad
Conservar y completar los módulos escolares existentes. Antes del piloto:
- Definir carga académica por año/grado/sección y validar contra ella el registro de notas.
- Calcular pendientes con las materias esperadas del estudiante, no con todo el catálogo del colegio.
- Separar boleta parcial de cierre completo; nunca inferir aprobación completa solo a partir de las notas presentes.
- Exigir revisión/aprobación de notas y coherencia de la política al publicar.
- Configurar evaluación según nivel y año; distinguir ausencia de nota de una nota de cero.
- Delimitar asistencia por el período correspondiente; no presentar acumulados del año como asistencia de un período.
- Conservar versiones históricas y motivos de rectificación.
- Verificar los formatos y reglas aplicables con el colegio piloto y las fuentes oficiales vigentes antes de declarar cumplimiento.

No se promete integración automática con SIGERD, certificación MINERD, promoción normativa completa ni equivalencia automática de escalas por tener campos o políticas genéricas.

## 8. Fuera de la primera entrega
Universidades, contabilidad completa, nómina, transporte, biblioteca, aplicación móvil nativa, pasarela automática de suscripciones, cobros familiares, sincronización Moodle bidireccional e integración oficial SIGERD. Docentes y familias tendrán experiencias específicas después de consolidar la operación administrativa inicial.

## 9. Decisiones todavía abiertas
Precios y límites; proveedor de cobro; retención a largo plazo (consulta histórica tras cancelación implementada); colegio piloto y versión/capacidades Moodle; reglas de evaluación por nivel; formatos oficiales; proveedor SMTP de producción (invitaciones y buzón local implementados). No son motivos para omitir el diseño de módulos. Deben resolverse antes de implementar el comportamiento afectado, sin inventar compromisos comerciales o normativos.

## 10. Documentos de trabajo
- [Arquitectura actual y objetivo](../architecture/overview-and-modules.md)
- [Administración SaaS e integración Moodle](../architecture/saas-administration-and-moodle.md)
- [Secuencia de implementación](implementation-roadmap.md)
- [ADR-0005](../decisions/0005-school-saas-and-moodle-scope.md)