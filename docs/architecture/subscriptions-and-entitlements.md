# Planes, suscripciones y módulos — orden 3
Fecha: 2026-10-20.

## Operación
En la consola global, **Planes** permite crear versiones con código, nombre, descripción, periodicidad, precio/moneda opcionales, módulos incluidos y límites. No hay precios ni planes precargados. Una versión es inmutable; crear otra no cambia contratos existentes. El precio es informativo: no se generan cargos ni facturas.

Desde la ficha del colegio → **Administrar plan, vigencia, límites y módulos**, asignar una versión, inicio, fin, estado y motivo. Las fechas se introducen en hora local y se guardan en UTC. El inicio es inclusivo y el fin exclusivo. No hay gracia automática ni renovación automática.

Estados manuales: Activa, Suspendida, Cancelada. La vigencia deriva además Programada o Vencida; sin asignación aparece Sin suscripción. Renovar consiste en actualizar explícitamente vigencia/versión y motivo. Las ediciones obsoletas reciben 409; actualizar la ficha antes de reintentar.

## Política aprobada
Al vencer, suspender o cancelar la suscripción, se conservan datos y consulta histórica, sujetos a permisos y RLS. Se bloquean altas, modificaciones, publicaciones y futuras importaciones. Autenticación, administración de acceso y soporte siguen disponibles. El estado operativo de la institución es independiente: una institución suspendida conserva su bloqueo previo.

Deshabilitar un módulo no borra sus registros. Las excepciones por colegio pueden habilitar o deshabilitar módulos sin editar el plan; el motivo queda auditado. Si una dependencia se deshabilita, los módulos dependientes quedan bloqueados aunque estén seleccionados.

Dependencias: matrículas requiere estudiantes y organización académica; asistencia y evaluación requieren matrículas; boletas requiere evaluación. Moodle requiere matrículas y evaluación, pero permanece no disponible hasta la etapa 4. No existe todavía sincronización Moodle ni pasarela de cobro.

## Límites
- Estudiantes activos: contar expedientes con IsActive; las reactivaciones también consumen cupo. Desactivar libera cupo.
- Secciones: total de secciones guardadas de todos los años; el formulario lo explicita. No significa alumnos por sección ni cupo de matrícula.
- Un límite vacío significa sin límite. No se admiten cero, negativos ni fracciones.
- Al reducir un límite no se eliminan datos existentes. Se impiden incrementos que superen el cupo; se permiten operaciones que no lo aumentan si el módulo está activo.

## Seguridad y concurrencia
Los contratos HTTP requieren permisos existentes de administración global. Las tablas de suscripción y excepciones tienen ENABLE y FORCE RLS: el colegio consulta solo sus filas; las escrituras requieren el modo PlatformCommercial limitado al colegio objetivo. Este modo no permite leer datos académicos. Planes globales permiten creación desde plataforma y no tienen políticas de actualización/borrado.

El cambio comercial y la persistencia académica comparten un bloqueo transaccional por colegio. SaveChangesAsync vuelve a resolver la vigencia, módulos y límites antes de guardar; incluye la sobrecarga booleana y el delta de estudiantes/secciones. SaveChanges síncrono rechaza escrituras académicas. No hay caché de derechos ni dependencia de la sesión previa para aplicar restricciones.

Los trabajos futuros deben establecer contexto institucional y comprobar IEntitlementService antes de efectos externos; las escrituras EF están además protegidas por la invariante común. No usar SQL masivo/ExecuteUpdate/ExecuteDelete para eludirla. Las rutas académicas actuales usan SaveChangesAsync. El correo de invitación no es un módulo académico y sigue disponible para incorporación/regularización.

Se audita creación de plan y cada cambio de suscripción con condiciones previas/nuevas y motivo, dentro de la transacción. No se añaden secretos.

## Aplicación
Migración incremental: AddSubscriptionsAndEntitlements. Aplicar con rol migrador; el runtime sigue con knorooms_app sin BYPASSRLS. No asigna planes automáticamente a colegios existentes: quedan en consulta hasta configurar sus condiciones reales. No modifica históricos académicos ni contraseñas.

## Validación
Pruebas con PostgreSQL real y rol de aplicación: dos colegios, denegación sin contrato, acceso global/institucional, aislamiento incluso sin filtros EF, rechazo de escritura comercial por el colegio, versiones inmutables, edición obsoleta, cupo concurrente, límite de secciones, dependencia deshabilitada, suspensión/vencimiento con históricos preservados y bloqueo de trabajo sin HTTP. Pruebas de formulario: límites, precio/moneda y fechas.

Resultado local: 33 pruebas unitarias y 15 de integración backend aprobadas; 43 pruebas frontend/BFF aprobadas. Lint, TypeScript, Prettier y compilación Next.js aprobados. Migración aplicada solo a PostgreSQL local. No se desplegó a producción.
