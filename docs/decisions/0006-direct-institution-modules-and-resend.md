# ADR-0006: Instituciones como unidad de configuración, módulos directos y Resend
- Fecha: 2026-10-22.
- Estado: Aceptado por instrucciones del propietario y aplicado localmente.
- Sustituye la dependencia de planes del flujo visible descrito en órdenes anteriores; conserva el stack y las garantías de seguridad.

## Decisión
La consola global se centra en Instituciones. Crear una institución usa una página dedicada con tres pasos: datos generales, módulos, confirmación. El contacto institucional es independiente del administrador.

Los módulos se habilitan directamente por colegio mediante InstitutionModuleSettings. No se requiere crear ni seleccionar un plan. La ficha permite editar información, módulos y administrador por pestañas. Moodle aparece como Próximamente y se rechaza en servidor si se intenta habilitar.

Planes/suscripciones históricos se conservan como compatibilidad y datos, pero desaparecen del menú y del flujo. Las rutas web antiguas redirigen a instituciones/módulos. La configuración directa tiene precedencia al resolver capacidades y al guardar; mantener los controles de permiso y contexto. El migrador copia la selección vigente y límites anteriores sin activar módulos por defecto; los colegios sin selección previa comienzan con módulos deshabilitados. Revisar las selecciones después de migrar.

El directorio usa búsqueda, filtros y paginación en servidor. Un modo PlatformDirectory permite exclusivamente lecturas de metadatos administrativos necesarias para la tabla (roles/membresías, invitaciones y módulos); no autoriza datos académicos ni escrituras. Las operaciones de modificación mantienen sus ámbitos institucionales acotados y RLS forzada.

Invitar al administrador es una acción por fila que abre un modal contextual. Se envía un enlace con Resend; el destinatario crea su contraseña o confirma la actual si ya existe. La creación del colegio y el envío de invitaciones son operaciones independientes. Se conserva Outbox, uso único, expiración, auditoría y aceptación transaccional.

Un bloqueo por colegio evita invitaciones pendientes duplicadas para el mismo correo; reintentar el POST devuelve la invitación vigente. Reenviar revoca el enlace anterior y crea otro en una transacción. Repetir el reenvío del ID anterior devuelve conflicto. Resend recibe una clave de idempotencia derivada del enlace para reducir duplicados de transporte.

Las acciones y pantallas de soporte temporal se retiran de la superficie de usuario por ahora. No se eliminan registros ni controles backend y no se sustituye soporte por acceso global irrestricto.

Las notificaciones se realizan con react-hot-toast, con progreso, éxito y error; las validaciones de campo permanecen visibles. Se conserva información de error persistente donde ayuda a corregir o reintentar.
