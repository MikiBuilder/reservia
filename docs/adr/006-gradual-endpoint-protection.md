# ADR 006: protección gradual de endpoints

- Estado: aceptada
- Fecha: 2026-10-25

## Contexto

La API ya emite y verifica tokens de acceso (#49), pero ningún endpoint los exige todavía. Hay que decidir cómo se protegen las rutas y en qué orden.

## Decisión

Una `AuthGuard` de NestJS verifica el token en cada petición protegida, lo traduce a un principal (`id`, `email`, `role`) y lo adjunta a la petición. Las rutas abiertas se marcan con `@Public()`. El primer endpoint protegido es `GET /api/auth/me`.

Las reservas no se protegen todavía en este cambio. Crear una reserva sigue recibiendo el `customerId` del cuerpo de la petición: exigir token sin tomar el cliente del propio token sería seguridad cosmética, porque cualquiera autenticado podría reservar en nombre de otro. La protección de reservas llega junto con ese cambio de contrato.

## Consecuencias

- Verificar el token sigue sin consultar la base de datos (ADR 005): la guardia solo añade la verificación criptográfica a cada petición protegida.
- Un token robado sigue siendo válido hasta que expira. La ventana la limita la vigencia corta del ADR 005.
- Cuando la guardia se registre como global, `@Public()` será la única forma de abrir una ruta: por defecto se deniega.
- Los próximos pasos son registrar la guardia de forma global, abrir con `@Public()` lo que deba ser público (salud, catálogo) y proteger reservas cuando el cliente deje de venir en el cuerpo.