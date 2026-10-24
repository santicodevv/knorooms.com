# Correo de KNOROOMS: prueba local con Resend

Estado al 23 de octubre de 2026: conexión validada mediante entrega simulada a `delivered@resend.dev`, confirmada como `delivered` en Resend. Esto no prueba la recepción en una bandeja personal ni la aceptación completa de una invitación.

## Configuración activa

- Backend en Development, puerto 5080.
- Archivo privado: `backend/src/Knorooms.Api/appsettings.Local.json`, excluido de Git.
- Sección `Invitations`: proveedor Resend, remitente `onboarding@resend.dev`, clave con permiso de envío.
- Enlaces locales: `http://<colegio>.localhost:3000/accept-invitation`.
- Sin dominio verificado, el destinatario personal debe ser el correo asociado a la cuenta de Resend.
- Las claves no se incluyen en este documento ni deben copiarse al frontend.

## Primera prueba completa

1. Entrar en http://admin.localhost:3000/ y abrir Instituciones.
2. Crear un colegio de prueba con módulos o utilizar un colegio de prueba existente sin administrador.
3. Abrir la acción contextual Invitar administrador de su fila.
4. Escribir el correo asociado a la cuenta de Resend y enviar la invitación.
5. Comprobar que el estado pasa de pendiente de envío a enviado. Si el envío falla, revisar la ficha antes de reintentar.
6. Abrir el correo «Active su acceso a KNOROOMS», revisar spam si hace falta y abrir el enlace en este mismo equipo.
7. Completar la activación y definir la contraseña. Si la cuenta ya existe, confirmar la contraseña actual.
8. Entrar al portal del colegio y comprobar los módulos habilitados y el administrador activo.
9. Volver al listado global y comprobar su estado. El enlace consumido no debe poder usarse otra vez.

Los enlaces localhost requieren que API, web y servicios locales estén encendidos; no funcionan desde otro equipo o teléfono.

## Dominio futuro

`knorooms.com` está añadido en Resend, pero NO está comprado/verificado por este procedimiento. La clave restringida a ese dominio quedó guardada en la sección privada `ResendDomainSetup`; esta sección es una reserva y no la consume el envío activo.

Cuando el propietario disponga del dominio y acceso DNS, agregar estos registros y verificarlo en Resend:

```text
DNS Records to configure:

DKIM (TXT):
  Name: resend._domainkey
  Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCcUU0GUK+1tViuPRdB+oCFMgIzGdSuzt2aJSPnXhXN8j9HH4KnZG4KRohSJD2RrQe6F+2gebn0A9vlbgf0u7+dZSm/cfdjnh0ll/h83tNm7C/DtyrBeUdNy11PKTZ04XEu83rc0UYNBWHhcG0GxvscG2AZda3NmqvZaR8v23/4wIDAQAB
  TTL: Auto
  Status: not_started

SPF (MX):
  Name: send
  Value: feedback-smtp.us-east-1.amazonses.com
  TTL: Auto
  Status: not_started
  Priority: 10

SPF (TXT):
  Name: send
  Value: v=spf1 include:amazonses.com ~all
  TTL: Auto
  Status: not_started

SPF (CNAME):
  Name: rsend
  Value: send.forge.rmta.net
  TTL: Auto
  Status: not_started
```

No sustituir registros existentes de otros servicios sin revisar su uso. Una vez verificado, cambiar el remitente y la clave de `Invitations` a los guardados en `ResendDomainSetup`. Configurar dominio/esquema reales de la aplicación antes de usar invitaciones públicas.

Referencias:
- https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
- https://resend.com/docs/dashboard/emails/send-test-emails

## Corrección del envío automático (23 de octubre de 2026)

El adaptador Resend poseía un HttpClient registrado como singleton y era devuelto por un servicio scoped. Al finalizar la petición de invitación, el contenedor cerraba el adaptador; el procesador Outbox reutilizaba un HttpClient ya cerrado y agotaba los reintentos antes de contactar con Resend.

El adaptador ahora tiene duración scoped, acorde con su propiedad del cliente HTTP. La regresión `Resend_RemainsUsableAfterAnEarlierRequestScopeIsDisposed` reproduce la secuencia petición finalizada → envío desde otro ámbito, sin conexión externa. Fallaba con ObjectDisposedException antes de corregir el registro.

Se añadieron registros por etapa de entrega, sin correos, credenciales ni enlaces de activación. La invitación afectada se entregó y fue aceptada; se concilió su estado de entrega con la confirmación de Resend.
