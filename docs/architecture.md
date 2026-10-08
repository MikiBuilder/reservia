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


## Procesos de background

Los trabajos que no forman parte del ciclo HTTP se ejecutan mediante comandos CLI independientes:

```text
API REST
  └── Peticiones HTTP

Outbox processor
  └── Procesamiento de eventos pendientes

Idempotency cleanup
  └── Eliminación de registros expirados
```

Comandos disponibles:

```bash
pnpm --filter @reservia/api outbox:process
pnpm --filter @reservia/api idempotency:cleanup
```

En producción, estos comandos serán ejecutados mediante un scheduler externo o un worker independiente.

La API HTTP no ejecuta directamente estos procesos para evitar mezclar responsabilidades y prevenir ejecuciones duplicadas cuando existan varias instancias.