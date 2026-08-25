# Especificación: crear una reserva

## Objetivo

Permitir que una persona reserve un recurso durante una franja horaria válida sin producir solapamientos.

## Reglas de negocio

1. El recurso debe estar activo y ser reservable.
2. La fecha debe estar dentro de la ventana de reserva permitida.
3. La franja debe respetar el horario del recurso.
4. La duración debe cumplir los límites configurados.
5. No puede existir otra reserva activa solapada.
6. La petición debe ser idempotente.
7. La operación debe dejar un registro de auditoría.

## Criterios de aceptación

```gherkin
Scenario: crear una reserva válida
  Given que el recurso está disponible entre las 09:00 y las 13:00
  When la persona solicita reservar de 10:00 a 11:00
  Then la reserva se crea en estado CONFIRMED
  And se registra el evento BookingCreated

Scenario: impedir un solapamiento
  Given que existe una reserva confirmada de 10:00 a 11:00
  When otra persona solicita reservar de 10:30 a 11:30
  Then la operación se rechaza con BOOKING_CONFLICT
  And no se crea una segunda reserva

Scenario: repetir una petición
  Given que ya se procesó una petición con la misma clave de idempotencia
  When se repite la petición
  Then se devuelve el resultado original
  And no se crea otra reserva
```
