# Prompt para rediseñar el portal de colegios de KNOROOMS

Actúa como diseñador senior de producto y UX/UI especializado en software de gestión escolar. Te adjunto capturas de las páginas actuales del portal de un colegio en KNOROOMS. Analízalas junto con esta descripción funcional, que corresponde al código actual del proyecto.

Necesito un rediseño completo de la experiencia del colegio: navegación, organización de la información, listados, formularios, fichas y flujos. Conserva sus capacidades y reglas. Puedes dividir las pantallas sobrecargadas en páginas y pasos específicos. Quiero una propuesta concreta que después pueda implementar mi desarrollador, como hicimos con el rediseño de la administración global.

No te limites a cambiar colores o reorganizar las mismas tarjetas. Resuelve primero qué necesita hacer el usuario, qué debe ver y dónde debe encontrarlo.

## 1. Producto, usuarios y alcance

KNOROOMS es un SaaS para colegios y escuelas de República Dominicana. Ahora nos concentramos en educación escolar, no en universidades.

Hay dos espacios distintos:

- Administración global de KNOROOMS: nuestros operadores crean colegios, habilitan sus módulos y envían la invitación del administrador inicial. Su rediseño ya está trabajado y sirve como referencia visual.
- Portal del colegio: el espacio institucional que vamos a rediseñar ahora. Cada colegio entra por su propio subdominio y solo trabaja con sus datos.

El administrador inicial recibe una invitación por correo, activa su cuenta y define su contraseña. Si ya tiene cuenta, debe autenticarse con su contraseña existente. No se pide al superadministrador que conozca la contraseña del colegio.

Dentro del colegio, cada usuario tiene permisos. Dirección, coordinación, secretaría y docentes son perfiles de uso para el diseño; no debes asumir que ya existen portales distintos y completos para todos ellos. La visibilidad y las acciones deben adaptarse a los permisos efectivos y a los módulos habilitados.

Los módulos se habilitan directamente por colegio desde la administración global. No diseñes una tienda de planes ni hagas que el colegio elija un plan para utilizar el sistema. Una capacidad puede quedar en consulta histórica sin permitir cambios; diseña ese estado con claridad.

## 2. Modelo académico que debes entender

La organización práctica es:

Año escolar → grado y sección → materias y asignaciones docentes.

Ejemplo: 2026-2027 → 1.º de Secundaria, sección A, tanda matutina → Lengua Española y Matemática, cada una con su docente.

Hay diferencias importantes:

- El grado identifica el nivel académico y pertenece al catálogo institucional.
- La sección pertenece a un año escolar y a un grado; tiene un código, una tanda y una capacidad.
- Las materias pertenecen a un catálogo. Su relación operativa con una sección y un docente se registra mediante la asignación docente.
- El expediente del estudiante permanece a través de los años. La matrícula lo vincula con una sección de un año escolar.
- Año escolar y período de evaluación son conceptos diferentes. Actualmente hay P1, P2, P3, P4 y FINAL.
- Crear un estudiante no equivale a matricularlo. Registrar un tutor no equivale a darle una cuenta de acceso.

No conviertas estos conceptos en formularios duplicados ni sugieras que una materia contiene estudiantes independientemente de sus matrículas y secciones.

## 3. Navegación que existe hoy

Actualmente el menú institucional tiene estas cinco entradas:

1. Contexto y Permisos: `/`.
2. Estructura Académica: `/academic`.
3. Estudiantes y Matrículas: `/students`.
4. Asistencia y Evaluaciones: `/evaluations`.
5. Miembros Institucionales: `/members`.

Las rutas son una descripción del estado actual, no una obligación para el rediseño. Puedes proponer rutas nuevas, subpáginas y agrupaciones. Distingue siempre entre la navegación existente y la recomendada.

El portal tiene menú lateral, identificación del colegio, usuario conectado, roles, cierre de sesión y un aviso sobre las capacidades disponibles. Evita que los avisos normales y la información repetida ocupen demasiado espacio en todas las páginas.

## 4. Funciones actuales que debes conservar

### A. Inicio: actualmente «Contexto y Permisos»

Hoy muestra nombre del colegio, subdominio, identificadores internos, estado de la institución, tipo de acceso, roles y una lista extensa de permisos técnicos. También tiene un acceso al directorio de miembros.

Esta pantalla funciona más como diagnóstico técnico que como inicio de un producto escolar. Propón un inicio útil y sencillo para el trabajo cotidiano. Reubica la información técnica en un lugar secundario o de configuración. Los usuarios no necesitan ver endpoints, UUID, nombres internos de permisos o explicaciones de la base de datos.

Si propones indicadores, especifica qué dato existente los sustenta. Si un indicador necesita información nueva, márcalo como propuesta futura. No inventes estadísticas, actividad o notificaciones como si ya existieran.

### B. Estructura académica

Hoy agrupa cuatro vistas dentro de la misma página:

**Grados y secciones**
- Registrar un grado con nivel educativo, número oficial, código y nombre.
- Los niveles disponibles en el sistema son Inicial, Primario y Secundario.
- Registrar una sección seleccionando año escolar y grado, código, tanda y capacidad.
- Tandas: matutina, vespertina y jornada extendida.
- Consultar grados y sus secciones, con filtros por año y grado.

**Años escolares**
- Crear un año con código, nombre y fechas de inicio y cierre.
- Consultar sus fechas y estado.
- Cerrar y reabrir el año con las validaciones correspondientes.

**Catálogo de materias**
- Registrar materias con código y nombre.
- Buscar y consultar el catálogo.

**Carga docente**
- Asignar un docente que ya sea miembro del colegio a una materia y sección.
- Registrar horas semanales y consultar las asignaciones.
- Relacionar la asignación con el año mediante la sección.

Problema actual: listados, formularios de alta y configuración conviven en vistas densas. Propón separar consulta, creación y detalle donde mejore la operación. No incluyas como existentes un editor de horarios, gestión de aulas físicas o edición completa de todas las entidades si no forman parte de este inventario.

### C. Estudiantes, responsables y matrículas

Hoy agrupa tres vistas:

**Expedientes 360°**
- Directorio con búsqueda por nombre, código de estudiante o identificador externo SIGERD.
- Filtros: todos, activos y pendientes de matrícula.
- Crear estudiante: código de expediente, nombres, apellidos, nacimiento e identificador externo SIGERD opcional.
- Consultar ficha, edad calculada, estado, matrícula y responsables vinculados.
- Activar o desactivar el estudiante.
- Matricular al estudiante en una sección.
- Vincular responsables familiares existentes.

**Matrículas y cupos por aula**
- Consultar capacidad, matrícula activa, cupos disponibles y porcentaje de ocupación por sección.
- Consultar matrículas y filtrar por sección.
- Trasladar una matrícula a otra sección y retirar una matrícula, respetando las validaciones.
- Distinguir los estados que devuelve el sistema: activo, retirado, trasladado y promovido. Mostrar un estado no significa que exista una acción manual para producirlo.

**Tutores y núcleo familiar**
- Registrar responsable: nombre completo, correo y teléfono opcional.
- Consultar responsables y estudiantes asociados.
- Vincularlo a un estudiante con parentesco.
- Registrar por separado acceso académico, responsabilidad financiera y autorización de recogida.

Estas marcas del vínculo familiar no significan que ya existan un portal de padres, facturación o control de recogida completos.

Problema actual: el directorio y la ficha comparten una pantalla muy cargada, con varios formularios dentro del detalle. Evalúa una lista de estudiantes y una ficha dedicada con pestañas, por ejemplo: Resumen, Responsables y Matrículas. Son propuestas de organización; no añadas pestañas de funciones inexistentes para llenar espacio.

### D. Asistencia

Actualmente está dentro de «Asistencia y Evaluaciones».

- Seleccionar año escolar, sección y fecha.
- Mostrar los estudiantes con matrícula activa de esa sección.
- Marcar Presente, Ausente, Tardanza o Excusado.
- Marcar todos presentes y ajustar excepciones.
- Mostrar los cambios pendientes y guardar el pase de lista en lote.
- Consultar totales y porcentaje diario de asistencia.

Necesito un flujo rápido para uso diario. Diseña claramente la diferencia entre sin registro y ausente: que un estudiante no tenga registro no debe representarse como una ausencia confirmada.

### E. Calificaciones y políticas de evaluación

Hoy conviven dentro de «Libro de Calificaciones y Políticas».

- Seleccionar año escolar, sección, materia y período.
- Consultar la lista de estudiantes y sus notas.
- Capturar calificaciones numéricas y guardarlas en lote.
- Ver avance de captura, promedio y estados del flujo de notas.
- Distinguir borradores, notas aprobadas y publicadas, según el estado real.
- Aprobar una nota requiere el permiso correspondiente y un usuario diferente del que la registró.
- Crear una política de evaluación versionada: año, código, versión, nombre, nota mínima aprobatoria, observaciones y marca de validación con el colegio piloto.
- Consultar la política aplicable.

La nota mínima depende de la política. No presentes 70 como una regla legal universal ni conviertas los ejemplos actuales en una certificación de cumplimiento del MINERD.

Problema actual: configurar políticas y registrar notas son tareas diferentes. Recomienda un lugar específico para la configuración, dejando el libro de notas enfocado en trabajar con estudiantes, materia y período.

### F. Boletas

Hoy aparece como «Boletines Oficiales Inmutables» dentro de la página de evaluaciones.

- Seleccionar año escolar, sección y período.
- Consultar si el estudiante reúne las condiciones para emitir la boleta y qué requisitos faltan.
- Publicar la boleta con la política correspondiente y los permisos necesarios.
- Consultar versiones y el detalle de una boleta emitida.
- Mostrar datos del colegio y estudiante, grado, sección, materias, notas, promedio, condición académica y resumen de asistencia.
- Una boleta publicada conserva su contenido histórico.
- Rectificar crea una nueva versión y requiere un motivo auditable de al menos 10 caracteres; no sobrescribe silenciosamente la anterior.

Propón nombres claros, como «Boletas», «Publicar boleta» e «Historial de versiones». No sugieras que son documentos avalados oficialmente solo porque la pantalla actual use la palabra «oficiales». Tampoco presentes descarga PDF, Excel o impresión como funciones existentes si las propones agregar.

### G. Miembros institucionales

- Listar nombre, correo, roles, estado y fecha de alta de los usuarios vinculados al colegio.
- Actualizar el listado.
- Revocar una membresía activa si el usuario tiene permiso.

No confundas miembros con estudiantes ni con responsables familiares. La invitación del administrador inicial se gestiona desde administración global. Una pantalla completa para invitar docentes, cambiar roles o dar acceso a padres sería una ampliación y debe identificarse como tal.

## 5. Límites que el diseño debe respetar

- Integración Moodle: prevista, todavía no operativa en este portal. Puede aparecer como «Próximamente» en el lugar adecuado, sin inventar sincronizaciones ni controles activos.
- SIGERD: existe un campo para guardar un identificador externo; eso no demuestra integración ni sincronización con MINERD.
- Un botón actual llamado «Sincronizar» puede limitarse a recargar datos internos. Usa «Actualizar» cuando esa sea su función; no sugieras una conexión externa.
- No añadir gestión financiera, pagos, transporte, comedor, bibliotecas, mensajería masiva o portales familiares como si estuvieran implementados.
- No reintroducir el flujo de solicitud de acceso temporal de soporte: está retirado de la navegación por decisión del propietario.
- No perder funciones actuales al simplificar. Cada función debe tener una ubicación y un recorrido identificables.
- No ofrecer acciones que el usuario no pueda ejecutar por permisos, módulos o modo de consulta histórica. Explica los bloqueos relevantes en lenguaje comprensible.

## 6. Organización que debes evaluar

Evalúa una navegación con Inicio, Estudiantes, Matrículas, Responsables, Organización académica, Asistencia, Calificaciones, Boletas, Equipo y Configuración. Puedes agrupar algunas entradas para mantener el menú corto. No adoptes todas automáticamente: justifica tu estructura por frecuencia de uso y relaciones entre tareas.

Diferencia tareas frecuentes, como pasar lista, de configuración ocasional, como crear una política. Cada vista debe tener un propósito claro y una acción principal reconocible.

- Usa páginas para directorios, fichas y operaciones con mucho contexto.
- Usa modales para acciones breves y contextuales, no para formularios interminables.
- Usa confirmaciones claras para retirar matrícula, revocar acceso, cerrar un año o publicar una rectificación.
- Conserva búsqueda, filtros, año seleccionado y posición del listado al volver desde una ficha.
- Evita cadenas de pestañas dentro de pestañas y barras de indicadores repetidas.
- El año escolar debe ser visible donde afecte los datos. Materia, fecha y período deben aparecer solo cuando la tarea los requiera.
- No confíes solo en el color para comunicar estados.

## 7. Dirección visual

Debe sentirse parte del mismo producto que la administración global, conservando su identidad azul y neutros, con una experiencia escolar más enfocada en la operación.

- Estilo SaaS profesional, sobrio, claro y coherente.
- Fondo general diferenciado de las superficies y bordes de campos visibles.
- Texto principal oscuro, secundarios legibles y tamaños cómodos. Evita texto gris muy claro o demasiado pequeño.
- Buen contraste en estados normales, seleccionados, deshabilitados, de error y foco.
- No quiero una pantalla enteramente blanca sin jerarquía ni una colección de tarjetas decorativas.
- Tablas legibles para datos comparables; tarjetas donde aporten comprensión.
- Paleta consistente, iconos coherentes, espaciado moderado y acciones fáciles de encontrar.
- Fuentes del sistema: ui-sans-serif, system-ui, Segoe UI, Arial. No copiar tipografías decorativas ni importar fuentes externas.
- Diseño responsive: escritorio, tableta y móvil. En móvil adapta la tarea, no reduzcas toda la tabla hasta hacerla ilegible.
- Navegación por teclado, etiquetas visibles y foco claro.

Incluye estados de carga, vacío, sin resultados, error, éxito, guardado en curso, cambios pendientes, falta de permisos y módulo no habilitado. Los toasts confirman acciones breves; los errores que necesitan corrección deben permanecer visibles junto al contexto o campo. La implementación utilizará react-hot-toast.

## 8. Recorridos que debes demostrar

1. Configurar año, grado, sección, materia y asignación docente.
2. Registrar estudiante y responsable, vincularlos y matricular al estudiante.
3. Consultar una ficha, revisar responsables y trasladar o retirar una matrícula.
4. Seleccionar sección y fecha, pasar lista y guardar.
5. Seleccionar materia y período, registrar notas y mostrar la revisión por otro usuario autorizado.
6. Ver por qué una boleta no está lista, publicarla cuando corresponda y consultar o rectificar una versión anterior.
7. Consultar el equipo y revocar un acceso con confirmación.

## 9. Entregables

Entrega una propuesta implementable, no solo consejos generales:

1. Diagnóstico de las capturas: sobrecarga, información repetida, términos técnicos y acciones difíciles de localizar.
2. Mapa de navegación propuesto y relación entre las páginas.
3. Tabla que asigne cada función actual a su pantalla nueva, mostrando qué se conserva, se divide o se reubica.
4. Diseño de todas las áreas descritas, con listados, fichas, formularios y estados clave. Incluye ejemplos de escritorio y móvil.
5. Recorridos de las siete tareas anteriores.
6. Especificación visual compartida: colores, tipografía, jerarquía, botones, campos, estados, tablas y espaciado.
7. Un prototipo HTML navegable con CSS/Tailwind y JavaScript ligero, preferiblemente autocontenido para poder abrirlo y revisar los flujos. Sin shadcn/ui. Si empleas datos de ejemplo, indícalos como demostración; no simules conexión real al backend ni envíos reales.
8. Inventario de componentes reutilizables para trasladarlo después a Next.js/React con Tailwind CSS. El código final separará componentes visuales, hooks, validaciones y acceso a la API.
9. Lista separada de propuestas futuras que necesiten backend nuevo. No mezclar esas propuestas con el alcance actual.

Antes de desarrollar los detalles, plantea una recomendación principal de arquitectura de información. Después desarrolla la propuesta completa alrededor de ella, evitando presentarme múltiples alternativas inconexas. Usa español claro y nombres de tareas que entienda una persona que administra un colegio.

El resultado debe permitir que un desarrollador implemente el nuevo diseño sin tener que adivinar dónde quedaron las funciones actuales ni cómo se relacionan las páginas.