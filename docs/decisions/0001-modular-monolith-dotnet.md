# ADR-0001: Monolito Modular en .NET 10 y Next.js BFF

- **Estado:** Aceptado
- **Fecha:** 2026-10-19

## Contexto

Los documentos iniciales exploraban alternativas en NestJS/React. El mandato arquitectónico definitivo de KNOROOMS exige construir la plataforma sobre **ASP.NET Core Web API (.NET LTS)**, **EF Core + PostgreSQL** y **Next.js (App Router)** sin caer en microservicios prematuros ni proliferación de proyectos `.csproj`.

## Decisión

1. Implementar un **monolito modular** en `backend/Knorooms.slnx` con tres proyectos de producción (`Knorooms.SharedKernel`, `Knorooms.Modules`, `Knorooms.Api`).
2. Organizar `Knorooms.Modules` en 12 módulos (`Identity`, `Tenants`, `Platform`, `Students`, `Academic`, `Enrollments`, `Attendance`, `Grading`, `ReportCards`, `Authorization`, `SupportAccess`, `Audit`).
3. Mantener `internal` todas las implementaciones de `Application` e `Infrastructure` de los módulos y validar el desacoplamiento con `NetArchTest`.
4. Utilizar un único `ApplicationDbContext` con configuraciones `IEntityTypeConfiguration<T>` en cada módulo y Transactional Outbox para eventos de dominio.

## Consecuencias

- Despliegue y operación simplificados para el equipo inicial.
- Fronteras lógicas estrictas que permiten evolucionar o extraer un módulo en el futuro si la carga lo exige.
