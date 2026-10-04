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

Reservia permite a equipos y profesionales descubrir, reservar y administrar espacios de trabajo por horas.

El sistema está diseñado alrededor de un problema central:

> Garantizar que la disponibilidad de los recursos sea correcta incluso cuando varias personas intentan reservar simultáneamente.

## Funcionalidades

- Consulta de espacios disponibles.
- Consulta de recursos.
- Reservas por franjas horarias.
- Gestión de salas, despachos y puestos.
- Horarios de apertura.
- Bloqueos de disponibilidad.
- Prevención de reservas solapadas.
- Idempotencia en operaciones críticas.
- Eventos Outbox.
- Transacciones de aplicación.
- Panel de administración previsto.
- Métricas de ocupación previstas.

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
- ✅ Migraciones reproducibles.
- ✅ Prisma Client generado.
- ✅ Repositorios persistentes con Prisma.
- ✅ Tests de integración con PostgreSQL.
- ✅ Restricción de solapamientos a nivel de PostgreSQL.
- ✅ Transacciones completas de aplicación.
- ✅ Idempotencia persistente.
- ✅ Outbox Pattern.
- ✅ API REST con NestJS.
- ✅ Endpoint `GET /api/health`.
- ✅ Endpoint `GET /api/resources`.
- ✅ Endpoint `GET /api/resources/:id`.
- ✅ Endpoint `POST /api/bookings`.
- ✅ Validación de DTOs.
- ✅ Idempotencia mediante `Idempotency-Key`.
- ✅ Documentación OpenAPI.
- ✅ Swagger UI disponible en `/docs`.
- ✅ Tests E2E de la API REST.
- ⏳ Procesamiento asíncrono de eventos Outbox.
- ⏳ Limpieza de registros idempotentes expirados.
- ⏳ Autenticación y autorización.
- ⏳ Cliente web conectado a la API.
- ⏳ Despliegue público.

## Arquitectura

Reservia utiliza un **monolito modular**. Esta decisión permite mantener una arquitectura clara sin introducir la complejidad operacional de los microservicios demasiado pronto.

La lógica está separada en capas:

- **Dominio**: entidades, value objects y reglas de negocio.
- **Aplicación**: casos de uso y puertos.
- **Infraestructura**: persistencia y servicios externos.
- **Presentación**: API HTTP y cliente web.

### Módulos

- `identity`: usuarios, roles y permisos.
- `resources`: espacios y recursos reservables.
- `availability`: horarios, festivos y bloqueos.
- `bookings`: reservas, estados y conflictos.
- `notifications`: notificaciones y comunicaciones.
- `audit`: trazabilidad de cambios.
- `reporting`: métricas y estadísticas.

### Flujo de una reserva

```text
POST /api/bookings
        ↓
Validación del DTO
        ↓
Validación de Idempotency-Key
        ↓
Carga del recurso
        ↓
Carga del horario
        ↓
Carga de bloqueos
        ↓
AvailabilityService
        ↓
CreateBooking
        ↓
Transacción PostgreSQL
        ↓
Booking + Outbox + IdempotencyRecord
        ↓
Respuesta HTTP
```

## Disponibilidad y consistencia

La disponibilidad se calcula combinando:

```text
Recurso activo
+ Horario de apertura
+ Sin bloqueos
+ Sin reservas solapadas
= Recurso disponible
```

La protección contra solapamientos existe en dos niveles.

### Dominio

`BookingConflictPolicy` detecta conflictos antes de guardar una reserva.

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

Las operaciones críticas se ejecutan dentro de una transacción para garantizar la consistencia entre:

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

Si una operación falla:

```text
ROLLBACK
```

No debe quedar una reserva persistida sin su evento correspondiente.

### Idempotencia

Las peticiones de creación utilizan:

```http
Idempotency-Key: booking-request-001
```

Primera petición:

```text
1. Registra la clave como PROCESSING.
2. Comprueba la disponibilidad.
3. Crea la reserva.
4. Persiste el evento Outbox.
5. Guarda la respuesta original.
6. Marca la operación como COMPLETED.
```

Repetición de la misma petición:

```text
1. Busca la clave existente.
2. Comprueba el hash.
3. Devuelve la respuesta original.
4. No crea una segunda reserva.
```

Si se reutiliza la misma clave con datos diferentes:

```text
IDEMPOTENCY_KEY_REUSED
```

Estados posibles:

```text
PROCESSING
COMPLETED
FAILED
```

## API REST

### Health check

```http
GET /api/health
```

```bash
curl http://localhost:3000/api/health
```

### Listar recursos

```http
GET /api/resources
```

### Consultar un recurso

```http
GET /api/resources/:id
```

### Crear una reserva

```http
POST /api/bookings
```

Headers:

```http
Content-Type: application/json
Idempotency-Key: booking-request-001
```

Body:

```json
{
  "id": "booking-api-001",
  "resourceId": "demo-resource-1",
  "customerId": "customer-001",
  "startsAt": "2026-08-31T10:00:00.000Z",
  "endsAt": "2026-08-31T11:00:00.000Z"
}
```

Ejemplo desde Windows CMD:

```bat
curl -X POST http://localhost:3000/api/bookings -H "Content-Type: application/json" -H "Idempotency-Key: booking-request-001" -d "{\"id\":\"booking-api-001\",\"resourceId\":\"demo-resource-1\",\"customerId\":\"customer-001\",\"startsAt\":\"2026-08-31T10:00:00.000Z\",\"endsAt\":\"2026-08-31T11:00:00.000Z\"}"
```

Respuestas principales:

```text
201 Created
400 Bad Request
404 Not Found
409 Conflict
```

## OpenAPI

Con la API iniciada, Swagger UI está disponible en:

```text
http://localhost:3000/docs
```

La documentación incluye:

- Health check.
- Recursos.
- Detalle de recursos.
- Creación de reservas.
- Validación del header `Idempotency-Key`.
- Ejemplos de DTOs.
- Respuestas HTTP documentadas.

## Tests E2E

Los tests E2E levantan la aplicación NestJS y validan los endpoints mediante peticiones HTTP reales.

Incluyen:

- `GET /api/health`.
- `GET /api/resources`.
- `GET /api/resources/:id`.
- Error `404` para recursos inexistentes.
- Creación de reservas.
- Reintentos idempotentes.
- Conflictos por solapamiento.
- Validación de `Idempotency-Key`.

Para ejecutarlos en Windows CMD:

```bat
set RUN_INTEGRATION_TESTS=true
pnpm test
```

## Decisiones técnicas

- El dominio no depende de HTTP, Prisma ni NestJS.
- Las reglas críticas viven en el dominio.
- PostgreSQL es la fuente de verdad para las reservas.
- Prisma actúa como adaptador de persistencia.
- Las fechas se almacenan normalizadas en UTC.
- La base de datos protege la integridad temporal.
- Las operaciones críticas utilizan transacciones.
- Los eventos Outbox se guardan junto con la reserva.
- Las operaciones de creación utilizan idempotencia persistente.
- Los repositorios se abstraen mediante interfaces.
- No se utilizan microservicios sin una necesidad demostrable.
- Las decisiones relevantes se documentan mediante ADRs.

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

Los patrones se incorporan únicamente cuando resuelven una necesidad concreta.

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
- Supertest.
- Playwright.
- GitHub Actions.
- TypeScript strict mode.

### Infraestructura

- Docker.
- Docker Compose.
- PostgreSQL.
- Migraciones reproducibles.
- Despliegue mediante servicios con planes gratuitos.
- Datos demo.

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

No subas `.env` al repositorio.

### Generar Prisma Client

```bash
pnpm --filter @reservia/api exec prisma generate
```

### Ejecutar migraciones

```bash
pnpm --filter @reservia/api exec prisma migrate deploy
```

Durante el desarrollo:

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

### Tests de integración y E2E

En Windows CMD:

```bat
set RUN_INTEGRATION_TESTS=true
pnpm test
```

### Calidad y compilación

```bash
pnpm lint
pnpm build
```

### Arrancar la API

```bash
pnpm --filter @reservia/api start
```

La API estará disponible en:

```text
http://localhost:3000
```

### Swagger UI

```text
http://localhost:3000/docs
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
│       │   ├── database/
│       │   ├── modules/
│       │   ├── shared/
│       │   ├── app.module.ts
│       │   ├── main.ts
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
- ✅ Migraciones.
- ✅ Repositorios persistentes.
- ✅ Tests de integración.
- ✅ Restricción de solapamientos.
- ✅ Transacciones completas.
- ✅ Idempotencia persistente.
- ✅ Outbox Pattern.
- ⏳ Procesamiento asíncrono de eventos Outbox.
- ⏳ Limpieza de registros idempotentes expirados.

### API

- ✅ NestJS.
- ✅ API REST base.
- ✅ `GET /api/health`.
- ✅ `GET /api/resources`.
- ✅ `GET /api/resources/:id`.
- ✅ `POST /api/bookings`.
- ✅ Validación de DTOs.
- ✅ Idempotencia mediante `Idempotency-Key`.
- ✅ Documentación OpenAPI.
- ✅ Swagger UI en `/docs`.
- ✅ Tests E2E.
- ⏳ Autenticación.
- ⏳ Autorización.
- ⏳ Gestión avanzada de errores HTTP.

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
- ⏳ Datos demo automatizados.
- ⏳ Backups.
- ⏳ Despliegue público.

## Proyecto de portfolio

Reservia es un proyecto ficticio creado con fines educativos y de portfolio.

No utiliza datos reales, no procesa pagos reales y no representa una empresa o servicio comercial existente.

## Licencia

Este proyecto se distribuye bajo la licencia MIT.