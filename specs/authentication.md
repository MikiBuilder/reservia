\# Especificación: autenticación y acceso



\## Objetivo



Permitir que una persona cree una cuenta en Reservia y acceda con su propia identidad, de forma que las reservas se asocien a un usuario real y las operaciones sensibles queden limitadas por rol.



\## Alcance



\- Registro con email y contraseña.

\- Inicio de sesión con credenciales propias.

\- Sesión identificada mediante token JWT.

\- Roles y autorización por rol.



\## Fuera de alcance



\- Proveedores externos (OAuth, SAML).

\- Verificación de email.

\- Recuperación de contraseña.

\- Autenticación multifactor.

\- Revocación de sesiones en servidor.



\## Reglas de negocio



1\. El email identifica a la persona: es único en el sistema.

2\. El email se normaliza (sin espacios laterales y en minúsculas) antes de compararlo o guardarlo.

3\. La contraseña se guarda como hash Argon2id con sal aleatoria por usuario.

4\. La contraseña en claro nunca se persiste ni se escribe en logs.

5\. El hash de la contraseña nunca forma parte de una respuesta HTTP ni de un DTO de salida.

6\. La contraseña debe tener entre 12 y 128 caracteres y no puede ser igual al email.

7\. Una cuenta nueva se crea en estado ACTIVE y con rol CUSTOMER.

8\. La unicidad del email la garantiza la base de datos: dos registros simultáneos con el mismo email no pueden tener ambos éxito.

9\. Una cuenta LOCKED o INACTIVE no puede iniciar sesión.

10\. El registro responde 409 cuando el email ya existe, sin revelar datos internos.

11\. Los endpoints protegidos exigen un token válido y, cuando corresponda, un rol autorizado.



\## Criterios de aceptación



```gherkin

Scenario: registrar una cuenta nueva

&#x20; Given que el email "marta@example.com" no está registrado

&#x20; When la persona se registra con una contraseña que cumple la política

&#x20; Then se crea la cuenta en estado ACTIVE con rol CUSTOMER

&#x20; And la respuesta no incluye el hash de la contraseña



Scenario: registrar un email ya existente

&#x20; Given que el email "marta@example.com" ya está registrado

&#x20; When otra persona intenta registrarse con ese email

&#x20; Then la operación se rechaza con EMAIL\_ALREADY\_REGISTERED

&#x20; And no se crea una segunda cuenta



Scenario: registrar dos veces el mismo email a la vez

&#x20; Given que dos peticiones de registro con el mismo email llegan simultáneamente

&#x20; Then una petición se resuelve con la cuenta creada

&#x20; And la otra se rechaza con EMAIL\_ALREADY\_REGISTERED

&#x20; And existe exactamente una cuenta con ese email



Scenario: registrar una contraseña débil

&#x20; Given que la contraseña tiene menos de 12 caracteres

&#x20; When la persona intenta registrarse

&#x20; Then la operación se rechaza con PASSWORD\_LENGTH\_INVALID

&#x20; And no se crea ninguna cuenta



Scenario: iniciar sesión con credenciales válidas

&#x20; Given una cuenta ACTIVA con contraseña conocida

&#x20; When la persona envía su email y su contraseña

&#x20; Then se devuelve un token de acceso válido



Scenario: iniciar sesión con credenciales incorrectas

&#x20; Given una cuenta registrada

&#x20; When la persona envía una contraseña incorrecta

&#x20; Then la operación se rechaza sin revelar si el email existe



Scenario: acceder a un endpoint protegido sin token

&#x20; Given una persona sin token válido

&#x20; When solicita un endpoint protegido

&#x20; Then la respuesta es 401



Scenario: acceder con un rol sin permiso

&#x20; Given una persona autenticada con rol CUSTOMER

&#x20; When solicita una operación reservada a ADMIN

&#x20; Then la respuesta es 403

```

