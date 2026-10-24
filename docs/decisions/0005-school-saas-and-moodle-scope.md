# ADR-0005: Alcance escolar, administración SaaS e integración Moodle
- Estado: Aceptado para orientar la implementación; ejecución pendiente por etapas.
- Fecha: 2026-10-19.
- Motivo: autorización del propietario para ejecutar el orden 1 de la revisión del proyecto.
- Complementa ADR-0001, ADR-0002 y ADR-0004. No reemplaza el stack ni la autenticación.

## Contexto
El proyecto avanzó en gestión académica, pero la administración de suscripciones, la habilitación de módulos y Moodle no estaban representados como responsabilidades explícitas. Los documentos iniciales también mencionaban universidades. Es necesario alinear la siguiente implementación con el producto destinado a colegios.

## Decisión
1. Priorizar colegios y escuelas dominicanos; educación superior queda fuera de la primera versión.
2. Mantener .NET, EF Core, PostgreSQL con RLS, Next.js BFF, Redis y los módulos existentes.
3. Adoptar Colegio → Año escolar → Nivel/Grado/Sección → Materias; la carga académica no depende de que haya docente asignado.
4. Completar administración de colegios y administradores, implementación inicial, suscripciones y módulos.
5. Incorporar Subscriptions, Entitlements e Integrations como responsabilidades modulares previstas dentro del monolito existente.
6. Moodle será opcional por colegio, con conexión propia y primera importación controlada; no sincronización bidireccional inicial.
7. Mantener KNOROOMS como autoridad de la publicación oficial. Importar no equivale a aprobar ni publicar.
8. Aplicar derechos comerciales junto con permisos y aislamiento, también en trabajadores.
9. Seguir la secuencia documentada y adelantar prerrequisitos de integridad académica antes de aplicar importaciones.

## Consecuencias
Se conserva la inversión existente. La próxima entrega se centra en configurar un colegio real. Aumentan las responsabilidades de gestión de secretos, correspondencias y reintentos, por lo que se implementarán con pruebas de aislamiento y auditoría. No se incorporan precios, proveedores de pago ni fórmulas normativas por suposición.

Los documentos Word iniciales se conservan como antecedentes. El alcance vigente está en [scope.md](../product/scope.md), los límites en [saas-administration-and-moodle.md](../architecture/saas-administration-and-moodle.md) y las etapas en [implementation-roadmap.md](../product/implementation-roadmap.md). El código describe el estado actual; su ausencia no elimina requisitos de estos documentos.