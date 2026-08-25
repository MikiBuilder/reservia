# ADR 001: comenzar con un monolito modular

- Estado: aceptada
- Fecha: 2026-08-25

## Contexto

Reservia es un proyecto de portfolio que debe demostrar diseño y calidad sin añadir complejidad operacional innecesaria.

## Decisión

Comenzaremos con un monolito modular. Cada módulo tendrá dominio, aplicación, infraestructura y presentación separables.

## Consecuencias

La aplicación será sencilla de ejecutar y desplegar, mientras que los límites internos permitirán extraer componentes en el futuro si aparece una necesidad real.
