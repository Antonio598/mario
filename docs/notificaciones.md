# Notificaciones push — plan para la 1.1

**Decidido el 30/09/2026:** NO van en la 1.0. Primero se publica y se aprueba la
app; las notificaciones entran en la 1.1, que es otro build y otra revisión de
24 h. Motivo: cada pieza nueva sin probar es un rechazo potencial, y un rechazo
cuesta días.

**Lo único que ya está hecho** es la capacidad *Push Notifications* en el App ID
de Apple, marcada a propósito antes del primer build: activarla después obliga a
regenerar los perfiles de firma y recompilar.

Lo que hay hoy en la base, y que **no** es esto: la tabla `notifications` son
avisos *dentro* de la app (tiene `leida`). No hay token de push ni nada que
envíe al teléfono.

## Las cuatro que quiere el propietario

| Nº | Notificación | Cuándo | Nota |
|---|---|---|---|
| 1 | Recordatorio del check-in | A la hora que elija el usuario, en **su** zona horaria, solo si ese día no ha registrado nada | La que sostiene la racha. La imprescindible |
| 2 | Hito alcanzado | Al llegar a 7, 30, 90, 180 o 365 días | Engancha con los vídeos de `hitos` que ya existen |
| 3 | Artículo o frase del día | Una vez al día | La que más desinstalaciones provoca si se abusa. Debe poder apagarse sola, sin apagar las demás |
| 4 | Seguimiento tras recaída | Al día siguiente de registrar una recaída | **El texto no puede revelar nada**: se lee en la pantalla de bloqueo, posiblemente delante de otra persona. Nada de «recaída», «porno» ni similar. Algo como «Hoy toca retomar el protocolo» |

## Piezas que hay que construir

**En la app** (`apps/mobile`)

- `expo-notifications` y su plugin en `app.config.ts`. El icono ya existe:
  `assets/notification-icon.png`.
- Pedir permiso **en el momento correcto**: después del primer check-in, nunca
  al arrancar. Pedirlo en el arranque hunde la tasa de aceptación y a Apple no
  le gusta.
- Enviar el token de Expo al servidor y renovarlo cuando cambie.

**En la base**

- Tabla `push_tokens` (user_id, token, plataforma, updated_at) con RLS, y RPC
  `guardar_push_token` tipo security definer, como el resto de escrituras.
- En `profiles`: la hora del recordatorio (`recordatorio_hora`) y un
  interruptor por tipo de notificación. El tipo 3 se apaga sola.
- La `timezone` del perfil ya existe: es la que decide a qué hora real se envía.

**El que las manda**

- Un endpoint del servidor web que llame a la API de Expo Push, protegido por
  secreto, y un programador que lo invoque cada hora (pg_cron de Supabase, o
  n8n, que ya estaba previsto en la fase 3).
- Cada hora se busca a quién le toca: su hora local coincide y no ha hecho el
  check-in. Sin esto, un usuario de México recibiría el aviso a las 4 de la
  mañana.

**Credenciales de las tiendas**

- iOS: clave APNs. La genera y la guarda EAS solo (`eas credentials`).
- Android: FCM V1, que pide un `google-services.json` del proyecto de Firebase.

## Lo que hay que declarar en las tiendas

- El permiso de notificaciones no cambia la declaración de privacidad: el token
  de push es un identificador de dispositivo, y ya se declara «Identificadores».
- En Android hay que añadir el permiso `POST_NOTIFICATIONS` (API 33+).
- La app debe seguir siendo usable si el usuario dice no. Nunca bloquear una
  función detrás del permiso.
