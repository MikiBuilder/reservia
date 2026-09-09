# Reservia

<p align="center">
  <img src="assets/reservia-mark.svg" alt="Logo de Reservia" width="120">
</p>

<p align="center">
  <strong>Plataforma de reservas de espacios profesionales</strong>
</p>

<p align="center">
  Sistema transaccional diseñado para gestionar disponibilidad y evitar conflictos bajo concurrencia.
</p>

<p align="center">
  <a href="https://github.com/MikiBuilder/reservia/actions/workflows/ci.yml">
    <img src="https://github.com/MikiBuilder/reservia/actions/workflows/ci.yml/badge.svg" alt="CI Status">
  </a>
</p>

---

## Estado del proyecto

🚧 **En desarrollo activo**

Reservia se construye siguiendo un enfoque de **Spec-Driven Development**. La implementación comienza por el dominio y las reglas de negocio antes de incorporar persistencia, API y frontend.

## Visión

Reservia permitirá a equipos y profesionales descubrir, reservar y administrar espacios de trabajo por horas.

El sistema está diseñado alrededor de un problema central:

> Garantizar que la disponibilidad de los recursos sea correcta incluso cuando varias personas intentan reservar simultáneamente.

## Funcionalidades previstas

- Consulta de espacios disponibles.
- Reservas por franjas horarias.
- Gestión de salas, despachos y puestos.
- Horarios de apertura.
- Bloqueos de calendario.
- Reservas recurrentes.
- Reglas de cancelación.
- Gestión de usuarios y roles.
- Auditoría de cambios.
- Prevención de reservas solapadas.
- Idempotencia en operaciones críticas.
- Procesamiento fiable de eventos mediante Outbox.
- Panel de administración.
- Métricas de ocupación.

## Estado actual

- ✅ Monorepo inicial.
- ✅ Entidad `Booking`.
- ✅ Entidad `Resource`.
- ✅ Value object `TimeRange`.
- ✅ Gestión de estados de reserva.
- ✅ Detección de solapamientos en el dominio.
- ✅ Validaciones del dominio.
- ✅ Tests unitarios.
- ✅ Integración continua con GitHub Actions.
- ✅ Horarios de apertura.
- ✅ Bloqueos de disponibilidad.
- ✅ Servicio de disponibilidad.
- ✅ Caso de uso de creación de reservas.
- ✅ Schema de base de datos con Prisma.
- ✅ PostgreSQL mediante Docker Compose.
- ✅ Migración inicial.
- ✅ Prisma Client generado.
- ✅ Repositorio persistente con Prisma.
- ✅ Tests de integración con PostgreSQL.
- ✅ Restricción de solapamientos a nivel de PostgreSQL.
- ✅ Transacciones completas de aplicación.
- ✅ Idempotencia persistente.
- ⏳ API REST.
- ⏳ Cliente web conectado a la API.
- ⏳ Autenticación y autorización.
- ⏳ Despliegue público.

## Arquitectura

Reservia comienza como un **monolito modular**. Esta decisión permite mantener una arquitectura clara sin introducir la complejidad operacional de los microservicios demasiado pronto.

La lógica está separada en capas:

- **Dominio**: entidades, value objects y reglas de negocio.
- **Aplicación**: casos de uso y puertos.
- **Infraestructura**: persistencia y servicios externos.
- **Presentación**: API HTTP y cliente web.

### Módulos previstos

- `identity`: usuarios, roles y permisos.
- `resources`: espacios y recursos reservables.
- `availability`: horarios, festivos y bloqueos.
- `bookings`: reservas, estados y conflictos.
- `notifications`: notificaciones y comunicaciones.
- `audit`: trazabilidad de cambios.
- `reporting`: métricas y estadísticas.

### Flujo previsto

```text
Petición HTTP
     ↓
Validación de entrada
     ↓
Caso de uso
     ↓
Reglas de dominio
     ↓
Transacción de persistencia
     ↓
Evento de dominio
     ↓
Auditoría y notificaciones
```

## Disponibilidad y consistencia

La disponibilidad de un recurso se calcula combinando:

```text
Recurso activo
+ Horario de apertura
+ Sin bloqueos
+ Sin reservas solapadas
= Recurso disponible
```

La protección contra solapamientos existe en dos niveles.

### Dominio

`BookingConflictPolicy` detecta conflictos antes de intentar guardar una reserva.

### Base de datos

PostgreSQL utiliza una restricción de exclusión GiST para impedir que dos reservas activas del mismo recurso ocupen intervalos solapados.

Las reservas consecutivas están permitidas:

```text
10:00 - 11:00
11:00 - 12:00
```

Las reservas activas solapadas se rechazan:

```text
10:00 - 11:00
10:30 - 11:30
```

Las reservas canceladas no bloquean nuevas reservas.

## Transacciones e idempotencia

Las operaciones críticas de Reservia se ejecutan dentro de una transacción para garantizar la consistencia entre:

- La reserva.
- El evento Outbox.
- El registro de idempotencia.

El flujo transaccional es:

```text
BEGIN
  Crear Booking
  Crear OutboxMessage
  Actualizar IdempotencyRecord
COMMIT
```

Si alguna operación falla:

```text
ROLLBACK
```

De esta forma no puede quedar una reserva persistida sin su evento correspondiente.

### Idempotencia

Las peticiones de creación de reservas utilizan una clave de idempotencia:

```http
Idempotency-Key: 7e4c8f...
```

La primera petición:

```text
1. Registra la clave como PROCESSING.
2. Comprueba la disponibilidad.
3. Crea la reserva.
4. Persiste el evento Outbox.
5. Guarda la respuesta original.
6. Marca la operación como COMPLETED.
```

Si la misma petición se repite:

```text
1. Se busca la clave existente.
2. Se valida el hash de la petición.
3. Se devuelve la respuesta original.
4. No se crea una segunda reserva.
```

Si se reutiliza la misma clave con datos diferentes, la operación se rechaza:

```text
IDEMPOTENCY_KEY_REUSED
```

Los estados posibles de una operación idempotente son:

```text
PROCESSING
COMPLETED
FAILED
```

La idempotencia evita duplicados causados por:

- Doble clic del usuario.
- Reintentos automáticos.
- Timeouts de red.
- Reenvío de peticiones por un cliente HTTP.

## Decisiones técnicas

- El dominio no depende de HTTP, Prisma ni NestJS.
- Las reglas críticas viven en el dominio.
- PostgreSQL es la fuente de verdad para las reservas.
- Prisma actúa como adaptador de persistencia.
- Las fechas se almacenan normalizadas en UTC.
- La base de datos también protege la integridad temporal.
- Las operaciones críticas se ejecutan dentro de transacciones.
- Los eventos Outbox se guardan junto con la reserva.
- Las operaciones de creación utilizan idempotencia persistente.
- Las respuestas de operaciones completadas pueden reutilizarse en reintentos.
- Se utilizan tests de dominio, integración y aceptación.
- Las decisiones relevantes se documentan mediante ADRs.
- No se utilizan microservicios sin una necesidad demostrable.
- Los repositorios se abstraen mediante interfaces.

## Patrones utilizados y previstos

- Value Objects.
- Aggregate.
- Repository Pattern.
- Specification Pattern.
- Strategy Pattern.
- Domain Events.
- Outbox Pattern.
- Idempotency Key.
- Optimistic Locking.
- Adapter Pattern.

Los patrones se incorporan únicamente cuando resuelven una necesidad concreta del dominio.

## Stack tecnológico

### Backend

- TypeScript.
- Node.js.
- NestJS.
- PostgreSQL 16.
- Prisma 6.

### Frontend

- Next.js.
- TypeScript.
- Tailwind CSS.
- Componentes accesibles.

### Calidad

- Vitest.
- Playwright.
- GitHub Actions.
- TypeScript strict mode.

### Infraestructura

- Docker.
- Docker Compose.
- PostgreSQL.
- Migraciones reproducibles.
- Despliegue mediante servicios con planes gratuitos.
- Datos demo para facilitar la evaluación del proyecto.

## Desarrollo local

### Requisitos

- Node.js 20 o superior.
- pnpm 10.
- Git.
- Docker Desktop.

### Instalación

```bash
git clone https://github.com/MikiBuilder/reservia.git
cd reservia
pnpm install
```

### Iniciar PostgreSQL

```bash
docker compose up -d
```

Comprobar el contenedor:

```bash
docker compose ps
```

### Variables de entorno

Crea un archivo `.env` en la raíz:

```env
NODE_ENV=development
DATABASE_URL=postgresql://reservia:reservia@localhost:5432/reservia
PORT=3000
```

No subas el archivo `.env` al repositorio.

### Generar Prisma Client

```bash
pnpm --filter @reservia/api exec prisma generate
```

### Ejecutar migraciones

```bash
pnpm --filter @reservia/api exec prisma migrate deploy
```

Durante el desarrollo también puedes utilizar:

```bash
pnpm --filter @reservia/api exec prisma migrate dev
```

### Abrir Prisma Studio

```bash
pnpm --filter @reservia/api exec prisma studio
```

### Tests normales

```bash
pnpm test
```

### Tests de integración

En Windows CMD:

```bat
set RUN_INTEGRATION_TESTS=true
pnpm test
```

### Comprobaciones de calidad

```bash
pnpm lint
pnpm build
```

### Ejecutar la demo visual

```bash
python3 -m http.server 4173
```

Después abre:

```text
http://localhost:4173
```

## Estructura del proyecto

```text
reservia/
├── apps/
│   └── api/
│       ├── prisma/
│       │   ├── migrations/
│       │   └── schema.prisma
│       ├── src/
│       │   ├── modules/
│       │   └── index.ts
│       └── tests/
├── assets/
├── docs/
│   ├── adr/
│   ├── architecture.md
│   └── roadmap.md
├── specs/
├── docker-compose.yml
├── index.html
├── styles.css
├── app.js
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Especificaciones

Las funcionalidades se definen antes de implementarse.

La primera especificación está disponible en:

```text
specs/create-booking.md
```

Las especificaciones incluyen:

- Objetivo.
- Reglas de negocio.
- Criterios de aceptación.
- Casos de uso.
- Escenarios Gherkin.
- Requisitos no funcionales.

## Documentación técnica

- [Arquitectura](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [Especificación de creación de reservas](specs/create-booking.md)
- [Decisiones arquitectónicas](docs/adr/)

## Roadmap

### Dominio

- ✅ Recursos reservables.
- ✅ Reservas.
- ✅ Estados de reserva.
- ✅ Horarios de apertura.
- ✅ Bloqueos de disponibilidad.
- ✅ Servicio de disponibilidad.
- ✅ Detección de conflictos.
- ✅ Caso de uso de creación de reservas.

### Persistencia

- ✅ PostgreSQL local.
- ✅ Prisma.
- ✅ Schema inicial.
- ✅ Migración inicial.
- ✅ Repositorio persistente.
- ✅ Tests de integración.
- ✅ Restricción de solapamientos.
- ✅ Transacciones completas.
- ✅ Idempotencia persistente.
- ✅ Outbox Pattern.
- ⏳ Procesamiento asíncrono de eventos Outbox.
- ⏳ Limpieza de registros idempotentes expirados.

### API

- ⏳ NestJS.
- ⏳ API REST.
- ⏳ Validación de DTOs.
- ⏳ OpenAPI.
- ⏳ Autenticación.
- ⏳ Autorización.
- ⏳ Gestión de errores HTTP.

### Cliente

- ⏳ Next.js.
- ⏳ Calendario de disponibilidad.
- ⏳ Flujo de reserva conectado.
- ⏳ Panel de usuario.
- ⏳ Panel de administración.
- ⏳ Gestión de horarios y bloqueos.

### Producción

- ⏳ CI/CD completo.
- ⏳ Observabilidad.
- ⏳ Datos demo.
- ⏳ Backups.
- ⏳ Despliegue público.

## Proyecto de portfolio

Reservia es un proyecto ficticio creado con fines educativos y de portfolio.

No utiliza datos reales, no procesa pagos reales y no representa una empresa o servicio comercial existente.

## Licencia

Este proyecto se distribuye bajo la licencia MIT.