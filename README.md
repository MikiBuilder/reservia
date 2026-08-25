# Reservia

> Plataforma de reservas de espacios profesionales, diseñada para gestionar disponibilidad y evitar conflictos bajo concurrencia.

<p align="center">
  <img src="assets/reservia-mark.svg" alt="Logo de Reservia" width="120">
</p>

## Demo

La primera iteración es una demo frontend estática y navegable. Incluye búsqueda visual, espacios destacados y flujo de confirmación de reserva. Está diseñada para convertirse progresivamente en una aplicación full-stack.

## Visión

Reservia permite a equipos y profesionales descubrir, reservar y administrar espacios de trabajo. El núcleo técnico será la gestión de franjas horarias, reglas de disponibilidad, bloqueos y prevención de reservas solapadas.

## Roadmap

- [x] Landing y exploración de espacios
- [x] Flujo inicial de reserva
- [x] Identidad visual y diseño responsive
- [ ] API modular con NestJS
- [ ] PostgreSQL y modelo de dominio
- [ ] Disponibilidad basada en políticas
- [ ] Prevención de solapamientos a nivel de base de datos
- [ ] Autenticación y roles
- [ ] Reservas recurrentes
- [ ] Auditoría e idempotencia
- [ ] Tests unitarios, integración y E2E
- [ ] Despliegue público con datos demo

## Decisiones de diseño

- Monolito modular antes que microservicios.
- PostgreSQL como fuente de verdad para reservas.
- Las reglas críticas viven en el dominio, no en los controladores.
- La creación de una reserva debe ser segura frente a concurrencia.
- La interfaz prioriza claridad y confianza sobre decoración.

## Desarrollo local

Esta primera versión no requiere instalación: abre `index.html` en un navegador o sirve la carpeta con cualquier servidor estático.

## Licencia

MIT
