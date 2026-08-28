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
- Panel de administración.
- Métricas de ocupación.

## Estado actual

- ✅ Monorepo inicial.
- ✅ Entidad `Booking`.
- ✅ Entidad `Resource`.
- ✅ Value object `TimeRange`.
- ✅ Gestión de estados de reserva.
- ✅ Detección de solapamientos.
- ✅ Validaciones del dominio.
- ✅ Tests unitarios.
- ✅ Integración continua con GitHub Actions.
- ✅ Horarios de apertura.
- ✅ Bloqueos de disponibilidad.
- ✅ Servicio de disponibilidad.
- ✅ Caso de uso de creación de reservas.
- ⏳ Persistencia con PostgreSQL.
- ⏳ API REST.
- ⏳ Cliente web conectado a la API.
- ⏳ Despliegue público.

## Arquitectura

Reservia comenzará como un **monolito modular**. Esta decisión permite mantener una arquitectura clara sin introducir la complejidad operacional de los microservicios demasiado pronto.

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

## Decisiones técnicas

- El dominio no depende de HTTP, Prisma ni NestJS.
- Las reglas críticas viven en el dominio.
- PostgreSQL será la fuente de verdad para las reservas.
- La base de datos también protegerá contra solapamientos.
- Las operaciones críticas serán idempotentes.
- Se utilizarán tests de dominio, integración y aceptación.
- Las decisiones relevantes se documentarán mediante ADRs.
- No se utilizarán microservicios sin una necesidad demostrable.
- La disponibilidad se calcula combinando horarios, bloqueos y reservas existentes.

## Patrones previstos

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

Los patrones se incorporarán únicamente cuando resuelvan una necesidad concreta del dominio.

## Stack tecnológico

### Backend

- TypeScript.
- Node.js.
- NestJS.
- PostgreSQL.
- Prisma.

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
- PostgreSQL.
- Despliegue mediante servicios con planes gratuitos.
- Datos demo para facilitar la evaluación del proyecto.

## Desarrollo local

### Requisitos

- Node.js 20 o superior.
- pnpm 10.
- Git.
- Docker Desktop, cuando se incorpore PostgreSQL.

### Instalación

```bash
git clone https://github.com/MikiBuilder/reservia.git
cd reservia
pnpm install
```

### Verificaciones

```bash
pnpm lint
pnpm test
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
- ✅ Horarios de apertura.
- ✅ Bloqueos de disponibilidad.
- ✅ Cálculo inicial de disponibilidad.
- ✅ Caso de uso de creación de reservas.

### Persistencia

- ⏳ PostgreSQL.
- ⏳ Prisma.
- ⏳ Migraciones.
- ⏳ Repositorios persistentes.
- ⏳ Restricciones contra solapamientos.

### API

- ⏳ NestJS.
- ⏳ API REST.
- ⏳ Validación de DTOs.
- ⏳ OpenAPI.
- ⏳ Autenticación y autorización.

### Cliente

- ⏳ Next.js.
- ⏳ Calendario de disponibilidad.
- ⏳ Flujo de reserva conectado.
- ⏳ Panel de usuario.
- ⏳ Panel de administración.

### Producción

- ⏳ Docker Compose.
- ⏳ CI/CD completo.
- ⏳ Observabilidad.
- ⏳ Datos demo.
- ⏳ Despliegue público.

## Proyecto de portfolio

Reservia es un proyecto ficticio creado con fines educativos y de portfolio.

No utiliza datos reales, no procesa pagos reales y no representa una empresa o servicio comercial existente.

## Licencia

Este proyecto se distribuye bajo la licencia MIT.