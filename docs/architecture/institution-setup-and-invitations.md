# Ficha del colegio e invitaciones — orden 2
Fecha: 2026-10-20.

## Funcionalidad
Desde la consola global, abrir el nombre del colegio para editar su ficha. Incluye contacto, dirección, código del centro, URL HTTPS del logo, zona horaria, responsable de acompañamiento, reunión inicial y notas. El subdominio y el identificador se conservan. El control de versión rechaza ediciones obsoletas.

El porcentaje representa cuatro tareas administrativas: datos de contacto/dirección, responsable de acompañamiento, administrador activo y reunión inicial. No acredita preparación académica ni integración Moodle. Suscripciones, módulos y Moodle aparecen como pendientes de sus próximas etapas.

La invitación se envía por SMTP después de confirmar la transacción, mediante el Outbox. Expira en 48 horas, es revocable y solo puede consumirse una vez. El administrador nuevo crea contraseña; un usuario existente confirma la actual. El correo queda fijado por la invitación. La aceptación y asignación de membresía se confirman juntas en una transacción.

Se conserva el acceso de soporte temporal ya existente. El formulario previo de asignación de usuarios existentes sigue disponible.

## Buzón local
Requiere PowerShell 7 y Docker:
```powershell
docker compose -f infrastructure/docker/docker-compose.mail.yml up -d
pwsh -File infrastructure/scripts/configure-local-mail.ps1
```
El script genera una clave aleatoria en appsettings.Local.json (ignorado por Git), conserva la clave si ya existe y configura SMTP en 127.0.0.1:1025. La API carga ese archivo solo en Development. Reiniciar la API tras configurar. El buzón está en http://localhost:8025 y no entrega correos a Internet. El compose expone sus puertos solo en loopback. [Referencia oficial de Mailpit](https://mailpit.axllent.org/docs/install/docker/).

Aplicar primero la migración AddInstitutionSetupAndInvitations con el rol migrador del entorno; la aplicación continúa con knorooms_app sin bypass RLS. No ejecutar migraciones con las credenciales runtime ni aplicar cambios a producción por ejecutar esta guía.

## Producción
Configurar mediante secretos/variables:
- Invitations__SigningKey: clave Base64 de 32 bytes, independiente de JWT y estable entre réplicas.
- Invitations__BaseDomain: dominio base y puerto, si corresponde; sin esquema, rutas ni subdominio del colegio.
- Invitations__Scheme: https.
- Invitations__SmtpHost, Invitations__SmtpPort, Invitations__SmtpEnableSsl.
- Invitations__SmtpUsername, Invitations__SmtpPassword, Invitations__FromAddress.
- Database__EnableOutboxWorker: true.

Nunca versionar claves ni contraseñas. La clave permite derivar el código de invitación; el Outbox contiene solo identificadores, sin contraseñas ni códigos de aceptación. Cambiarla invalida la entrega pendiente de invitaciones previas; revocar y emitir nuevas si se rota.

## Operación y límites
- En cola no significa enviado. El panel diferencia Queued, Sent y Failed.
- El Outbox reintenta hasta cinco veces. Tras corregir un error, revocar la invitación pendiente y emitir una nueva.
- La entrega SMTP es al menos una vez: ante un corte después de entregar puede repetirse el mismo correo; la aceptación sigue siendo única.
- El código viaja en el fragmento del enlace, no en la ruta/query; la página lo retira de la barra. Si se recarga, reabrir el correo.
- Las invitaciones se resuelven en el host del colegio y tienen RLS forzada. El endpoint público exige el código y limita intentos; el BFF comprueba Origin y host institucional.
- La lista muestra las últimas 50 invitaciones. El logo se configura como URL; no hay carga de archivos en esta etapa.
- No se han implementado suscripciones, módulos comerciales ni conexión Moodle en el orden 2.

## Verificación
Las pruebas cubren edición con versión, progreso, dos colegios aislados, invitación sin token en respuesta, aceptación única/concurrente, revocación, vencimiento, cuenta existente y RLS real con el rol de aplicación. El transporte SMTP se comprueba contra un servidor de prueba local; las pruebas del BFF rechazan orígenes y hosts inválidos.
