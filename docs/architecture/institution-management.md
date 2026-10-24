# Gestión de instituciones — configuración directa y flujo de invitaciones
Fecha: 2026-10-22. Complementa y actualiza las guías históricas de órdenes 2 y 3.

## Pantallas
- Host administrativo, `/`: listado con búsqueda por nombre/subdominio/correo, filtros por estado y administrador, paginación 10/25/50 y acciones por fila.
- `/institutions/new`: datos → módulos → confirmación. No envía una invitación durante el alta.
- `/institutions/{id}`: pestañas Resumen, Información, Módulos y Administrador.
- Invitación contextual desde la fila o la ficha, sin volver a seleccionar colegio.
- `/plans` redirige al listado y la ruta histórica de suscripción redirige a la pestaña Módulos.
- Las rutas escolares conservan su aislamiento y permisos. Se ocultó la superficie de soporte temporal.

Los filtros/página se conservan en la URL y el enlace de retorno de la ficha. Las tarjetas móviles mantienen las acciones. El modal usa dialog nativo, foco modal, cierre con Escape cuando no hay operación en curso y etiquetas accesibles.

El logo sigue siendo una URL HTTPS, como en la ficha previa; esta entrega no implementa almacenamiento/subida de imágenes ni nombre corto. La captura visual era una referencia y los pasos siguen la recomendación final de tres etapas.

## Módulos
El catálogo fijo procede del servidor. La UI agrega dependencias al activar; al desactivar una dependencia muestra qué módulos se quitarán y pide confirmación. Guardar conserva los datos históricos. El servidor rechaza dependencias inválidas, módulos inexistentes y Moodle no disponible. Se usa versión de concurrencia y el bloqueo por colegio ya existente.

InstitutionModuleSettings gobierna derechos cuando existe. La migración AddDirectInstitutionModules conserva la selección vigente y límites de suscripciones anteriores, dejando vacía la selección sin vigencia. No borra tablas antiguas ni datos académicos. Los endpoints antiguos quedan para compatibilidad, no deben usarse para configurar el nuevo flujo.

## Correo
Resend es el proveedor predeterminado. Configurar en el servidor, fuera de Git:
- `Invitations__Provider=Resend`
- `Invitations__ResendApiKey`: clave privada de Resend.
- `Invitations__FromAddress`: remitente admitido por Resend y dominio verificado.
- `Invitations__SigningKey`: Base64, 32 bytes, independiente de JWT y estable entre reinicios.
- `Invitations__BaseDomain`: dominio base con puerto en desarrollo; sin esquema ni slug.
- `Invitations__Scheme=https` en producción.
- `Database__EnableOutboxWorker=true`.

El envío HTTPS tiene límite de 15 segundos, destino fijo api.resend.com/emails y clave de idempotencia. Las respuestas de error se saneen sin incluir clave ni enlace. Sent significa aceptado por el transporte/proveedor; no acredita recepción en bandeja de entrada. No hay webhooks de entrega/rebote en esta etapa.

Para desarrollo sin correos externos, `configure-local-mail.ps1` selecciona explícitamente Provider=Smtp y configura Mailpit. Este modo es independiente del proveedor real Resend. No escribir claves en capturas, chats ni repositorios. Sin clave/remitente válidos, el envío real de Resend queda pendiente de configuración.

La invitación dura 48 horas, se revoca, consume una vez y nunca devuelve el código al operador. El enlace corresponde al colegio y la cuenta existente no pierde su contraseña. Reenviar/revocar exige confirmación; el botón se bloquea mientras se procesa y el servidor evita envíos duplicados por repetir el alta de invitación.

## Verificación
Pruebas automáticas con PostgreSQL real: alta transaccional sin planes y rollback si falla selección; paginación y filtros; módulos con históricos conservados; concurrencia de edición; control por host; RLS incluso sin filtros EF y modo de directorio sin acceso académico/escrituras; invitaciones duplicadas y reenvío. Resend se probó con transporte HTTP interceptado, sin correo externo. También se conserva la prueba SMTP local.

La prueba visual se realizó con una base temporal aislada, cuenta QA y puertos 3001/5081: acceso real, alta de colegio, dependencias y toast, ficha, edición/guardado de módulos, confirmación de desactivación, vuelta al listado, modal contextual y vista móvil de 390 px. No se utilizó ni cambió la contraseña del propietario.

Resultado de cierre: 33 pruebas unitarias backend, 17 de integración y 55 frontend/BFF aprobadas (105 total); lint, tipos, formato y build Next.js aprobados. Migración aplicada a la base local habitual. La base temporal de verificación se eliminó al terminar. No hubo despliegue ni envío real por Resend.
