# ADR-0008: Almacenamiento privado de archivos por colegio

Fecha: 06/11/2026. Estado: propuesto.

## Decisión

Los archivos de las instituciones se almacenan en un servicio de objetos compatible con S3. Los metadatos se guardan en PostgreSQL dentro de la tabla `stored_files`, asociados al identificador del colegio (`TenantId`).

Cada archivo utiliza una clave de almacenamiento opaca y exclusiva de su institución. El acceso a los archivos se realiza a través de la API, que verifica los permisos y el contexto del colegio antes de entregar su contenido.

La eliminación es lógica en PostgreSQL y también elimina el objeto del almacenamiento. Los archivos no se exponen mediante URLs firmadas ni enlaces públicos.

## Seguridad y aislamiento

El aislamiento entre colegios se aplica mediante el contexto del tenant, las consultas de PostgreSQL y las políticas RLS.

Un usuario de un colegio no puede descargar archivos pertenecientes a otro colegio, aunque conozca su identificador.

Los registros de auditoría contienen únicamente información necesaria para identificar la operación. No almacenan contenido de archivos, credenciales ni URLs firmadas.

## Límites

El almacenamiento se utiliza exclusivamente para archivos privados de las instituciones. PostgreSQL conserva los metadatos; el servicio S3 compatible conserva el contenido.

La API controla las operaciones de carga, descarga y eliminación. No se permite acceso público directo a los objetos.

## Verificación

Las pruebas de integración utilizan PostgreSQL y un servicio de almacenamiento compatible con S3 mediante Testcontainers.

Se verifica la carga, descarga, eliminación, aislamiento entre colegios y ausencia de contenido sensible en los registros de auditoría.

Ejecutar las pruebas de integración con:

`dotnet test .\tests\Knorooms.IntegrationTests\Knorooms.IntegrationTests.csproj`