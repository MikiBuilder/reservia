\# ADR 004: ejecutar trabajos de mantenimiento mediante comandos CLI



\- Estado: aceptada

\- Fecha: 2026-10-08



\## Contexto



Reservia necesita ejecutar tareas de mantenimiento y procesamiento en segundo plano:



\- Procesar eventos Outbox pendientes.

\- Limpiar registros de idempotencia expirados.



Estas tareas no forman parte directamente del ciclo de petición HTTP.



\## Opciones consideradas



\### Scheduler interno de NestJS



Permite ejecutar tareas programadas dentro del proceso HTTP de la API.



Ventajas:



\- Implementación sencilla.

\- Adecuado para una demo local.

\- No requiere infraestructura adicional.



Inconvenientes:



\- Varias instancias podrían ejecutar el mismo trabajo.

\- El scheduler se detiene si la API se reinicia.

\- Mezcla responsabilidades HTTP y background.

\- Puede competir por recursos con las peticiones de usuarios.



\### Scheduler externo



Ejecuta comandos independientes desde cron, un worker o la plataforma de despliegue.



Ventajas:



\- Separa la API del procesamiento de background.

\- Permite escalar ambos componentes de forma independiente.

\- Facilita los reintentos.

\- Se adapta mejor a entornos con varias instancias.



Inconvenientes:



\- Requiere configuración adicional en producción.

\- Necesita que los comandos sean seguros frente a reintentos.



\## Decisión



Los procesos de mantenimiento se expondrán mediante casos de uso y comandos CLI:



```text

pnpm --filter @reservia/api outbox:process

pnpm --filter @reservia/api idempotency:cleanup

