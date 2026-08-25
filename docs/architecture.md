# Arquitectura inicial

## Decisión

Reservia comenzará como un monolito modular. El objetivo es mantener límites de dominio claros sin introducir complejidad operacional prematura.

## Módulos previstos

- `identity`: usuarios, roles y permisos.
- `resources`: espacios y características.
- `availability`: horarios, festivos y bloqueos.
- `bookings`: reservas, estados y conflictos.
- `notifications`: eventos y comunicaciones.
- `audit`: trazabilidad de cambios.

## Dependencias

El dominio no conoce HTTP, Prisma ni NestJS. Los adaptadores de infraestructura implementarán los puertos definidos por la aplicación.

## Flujo de creación de reserva

```text
HTTP request
  -> Controller / DTO validation
  -> Use case
  -> Domain policies
  -> Repository transaction
  -> Domain event
  -> Outbox / notification handler
```

## Evolución

Solo se extraerán servicios cuando exista una razón medible: escalado independiente, ownership diferenciado o aislamiento técnico.
