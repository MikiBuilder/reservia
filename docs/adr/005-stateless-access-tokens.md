\# ADR 005: tokens de acceso sin estado



\- Estado: aceptada

\- Fecha: 2026-10-17



\## Contexto



El registro ya crea cuentas (#48). Ahora la API debe comprobar quién hace cada petición. Las dos opciones habituales son sesiones con estado en el servidor (una fila por sesión en base de datos) y tokens firmados sin estado (JWT).



\## Decisión



Tras el login emitiremos un token de acceso JWT sin estado, firmado con HS256 y con vigencia configurable en segundos (`JWT\_ACCESS\_TOKEN\_TTL\_SECONDS`, 900 en local). Los claims serán mínimos: `sub`, `email`, `role`, `iat` y `exp`.



Un JWT está firmado, no cifrado: cualquiera puede leer su contenido. Por eso no viaja nada sensible dentro (ni hash de contraseña, ni datos personales que no hagan falta para autorizar).



\## Consecuencias



\- Verificar un token no consulta la base de datos. La API puede escalar horizontalmente sin infraestructura de sesiones compartida.

\- No hay revocación inmediata: un token robado sigue siendo válido hasta que expira. La vigencia corta de 15 minutos acota la ventana. Si el producto necesita revocar antes, se añade una lista negra corta o se reduce la vigencia junto con tokens de refresco. Es una decisión futura, no un problema pendiente.

\- El secreto `JWT\_SECRET` debe tener al menos 32 caracteres y vive fuera del repositorio. La aplicación no arranca sin él: preferimos un fallo ruidoso en el arranque a firmar tokens con un secreto débil.

\- Cuando exista autorización por roles, el claim `role` ya viaja en el token. Entonces se decidirá si se confía en él o se vuelve a leer de la base de datos.

