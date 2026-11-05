\# ADR 007: creación de reservas con cliente autenticado



\- Estado: aceptada

\- Fecha: 2026-11-05



\## Contexto



`POST /api/bookings` era accesible sin autenticación y recibía el `customerId` en el cuerpo de la petición. Cualquiera podía reservar a nombre de otro. El ADR 006 dejó pendiente proteger reservas junto a un cambio de contrato.



\## Decisión



El `customerId` de una reserva se toma del token de acceso (`sub`) y nunca del cuerpo. El DTO de creación deja de aceptar `customerId`: enviarlo se rechaza con `400`. Crear una reserva exige autenticación y el rol `CUSTOMER`, mediante `AuthGuard` y `RolesGuard`.



\## Consecuencias



\- Reservar queda limitado al usuario autenticado y a su propio nombre.

\- La idempotencia se calcula con el cliente real: dos usuarios que reutilicen la misma `Idempotency-Key` producen hashes distintos y el segundo recibe `409`.

\- Los roles `ADMIN` y `OPERATOR` no crean reservas: su papel es gestionar recursos, horarios y bloqueos.

\- Si en el futuro hace falta reservar en nombre de terceros, será un flujo propio con auditoría y permiso explícito, no un campo en el cuerpo de esta petición.

\- El dominio no cambia: `CreateBooking` sigue recibiendo `customerId` como parámetro de su comando. Solo cambia quién lo suministra en la capa de presentación.

