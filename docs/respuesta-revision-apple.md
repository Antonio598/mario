# Respuesta al rechazo 2.1 (Information Needed)

**Qué es esto.** Apple no ha encontrado ningún fallo. Es el cuestionario que
manda a las cuentas de desarrollador sin historial: quieren entender la app
antes de aprobarla. Se contesta, se reenvía, y suele resolverse en el mismo
ciclo de revisión.

**Dónde va.** Las respuestas se pegan en **dos sitios**, como pide el mensaje:

1. En **Resolution Center** (responder al mensaje del rechazo).
2. En **App Review Information → Notes** de la versión, para los envíos futuros.

El texto está en inglés a propósito: es el idioma de trabajo de App Review.
Abajo tienes, en español, qué dice cada parte.

---

## Parte 1 — El vídeo (esto lo grabas tú)

Apple pide **una grabación de pantalla en un iPhone físico**, empezando por el
arranque de la app. En el iPhone: Ajustes → Centro de control → añade
**Grabación de pantalla**; luego deslizas desde arriba a la derecha y pulsas el
botón de grabar.

**Grábalo con la app de TestFlight instalada**, que es la versión que han
revisado.

### Guion, en este orden

| # | Qué mostrar | Por qué lo piden |
|---|---|---|
| 1 | Pulsar el icono y que arranque la app | Lo exigen: la grabación empieza en el lanzamiento |
| 2 | **Crear una cuenta nueva** desde cero (correo y contraseña) | Flujo de registro |
| 3 | El test de entrada y llegar a Inicio | Flujo típico de usuario |
| 4 | El check-in del día | Funcionalidad principal |
| 5 | Crear el **P.A.D** y escribir la **carta** | Contenido generado por el usuario |
| 6 | Calendario, registrar una recaída, y la bitácora | Contenido generado por el usuario |
| 7 | **Perfil → Ver Premium**: que se vean **título, duración, precio** y los enlaces a **Condiciones de uso** y **Política de privacidad**; pulsar Suscribirme y completar la compra | Es lo que más miran: el flujo de suscripción |
| 8 | **Perfil → Eliminar mi cuenta**, con sus dos confirmaciones, hasta que la cuenta desaparece | La eliminación de cuenta es obligatoria y quieren verla |
| 9 | Cerrar sesión y volver a entrar | Flujo de inicio de sesión |

### Dos avisos que pueden costarte otro rechazo

- **NO borres la cuenta del revisor** (`israelmayalara+revisor@gmail.com`) al
  grabar el paso 8. Crea una cuenta desechable para eso. Si borras la del
  revisor, el siguiente intento falla porque no podrán entrar.
- **El paso 7 tiene que verse completo**, con el precio y los dos enlaces
  legales en pantalla. Es el punto que más rechazos genera. Ve despacio y deja
  la pantalla quieta un par de segundos.

**Cómo entregarlo.** Si el vídeo es pequeño, se adjunta en Resolution Center.
Si no, súbelo a YouTube **como "no listado"** o a Drive con enlace público y
pega el enlace en la respuesta. No lo pongas en privado: si no pueden abrirlo,
cuenta como no entregado.

---

## Parte 2 — El texto, listo para pegar

```
Thank you for your review. Below is the information requested.

2. PURPOSE OF THE APP AND TARGET AUDIENCE

Reset Alfa is a habit-tracking and self-discipline app for adult men who want
to stop watching pornography and build daily consistency.

The problem it solves: people who try to quit rely on willpower alone and have
no structure, no record of what happened, and no plan for the moment the urge
appears. The app provides four things: a streak counter, a 30-second daily
check-in, a written plan decided in advance for high-risk moments (we call it
P.A.D), and a structured 9-question log the user fills in after a relapse so
that patterns -time of day, trigger, emotional state- become visible data
instead of a vague feeling.

The app is a tracking and discipline tool. It is not a medical or therapeutic
product, it does not diagnose or treat any condition, and it states this
explicitly inside the app and in its App Store description.

3. HOW TO SET UP AND ACCESS THE MAIN FEATURES

Demo account (already created, with an active Premium subscription granted
manually so that every feature can be reviewed without purchasing):

   User name: israelmayalara+revisor@gmail.com
   Password:  RevisorApple2026!

There is only one account type. No sample files or additional setup are needed.

After signing in, the app opens on the Home tab:

 - Home: streak counter, the daily check-in, the P.A.D and the anti-relapse
   letter.
 - Formacion (second tab): video masterclasses and PDF protocols.
 - Tienda (third tab): books and a coaching program. These open in the external
   browser because they are physical goods and an in-person service.
 - Calendario (fourth tab): monthly history, achievements, and the relapse log.
 - Perfil (fifth tab): subscription status, consent settings, data export,
   sign out, and account deletion.

To reach the subscription: Perfil -> "Ver Premium". Any locked feature also
opens the same screen when tapped.

To delete the account: Perfil -> "Eliminar mi cuenta", with two confirmations.
This permanently deletes the user's data and the account itself.

USER-GENERATED CONTENT

The app stores text written by the user: the P.A.D, the anti-relapse letter and
the answers of the relapse log. This content is strictly private to the account
that created it. It is never shown to other users. The app has no social feed,
no comments, no messaging, no public profiles and no way for one user to see
another user's content. For that reason there is no content to report or block,
and no moderation mechanism is applicable.

The relapse log may contain sensitive personal information. It is only stored
if the user gives explicit, separate, opt-in consent, which can be withdrawn at
any time from Perfil. Without that consent the app records only the date.

4. EXTERNAL SERVICES USED

 - Apple In-App Purchase (StoreKit 2): the only payment method inside the app.
 - RevenueCat: subscription state management and receipt validation on top of
   StoreKit. It does not process payments.
 - Supabase (self-hosted on our own server): user authentication and database.
 - Resend: transactional email. Used only to forward the user's own relapse log
   to our support team, and only when the user has given the explicit consent
   described above.

The app does not use any AI service, advertising network, analytics SDK or
third-party data provider.

For completeness: our website offers the same subscription through Stripe. The
iOS app does not use Stripe, does not contain any link to it, and never directs
users outside the app to purchase digital content. All digital purchases in the
app go through Apple In-App Purchase.

5. REGIONAL DIFFERENCES

There are none. The app offers the same features and the same content in every
region, is available in Spanish only, and the subscription is the same product
worldwide.

6. REGULATED INDUSTRY OR THIRD-PARTY MATERIAL

The app does not operate in a regulated industry. It is not a medical device,
does not provide medical or treatment information, and does not make health
claims.

All educational content in the app -video masterclasses, PDF protocols and
books- is original material owned by the developer. No third-party protected
material is used.

7. WHAT CAN BE PURCHASED, AND HOW TO REACH IT

There is one in-app purchase: an auto-renewable subscription called
"Reset Alfa Premium", 9.99 USD per month, renewing monthly until cancelled.

It unlocks: the complete relapse log (9 questions per entry), the P.A.D, the
anti-relapse letter, the 90/180/365-day medals, and the streak counter beyond
30 days. The free version keeps the streak counter up to 30 days, the daily
check-in, basic relapse recording and all the masterclasses.

How to navigate to the purchase flow:

   Perfil (fifth tab) -> "Ver Premium" -> "Suscribirme por 9,99 US$ al mes"

Tapping any locked feature on the Home or Calendario tabs opens the same
screen. That screen shows the subscription title, its monthly duration, the
price returned by the App Store, the auto-renewal terms, a "Restaurar compras"
button and links to the Terms of Use (Apple standard EULA) and to our Privacy
Policy.
```

---

## Qué dice cada parte, en español

| Punto | Resumen de lo que responde |
|---|---|
| 2 | Qué es la app, para quién, qué problema resuelve, y que **no es un producto médico** |
| 3 | Las credenciales del revisor, las cinco pestañas, cómo llegar a la suscripción y cómo borrar la cuenta |
| UGC | Que lo que escribe el usuario es **privado**: no hay feed, ni mensajes, ni perfiles públicos, así que **no aplica** el sistema de denuncias y bloqueo que exigen cuando hay contenido compartido |
| 4 | Los servicios: Apple IAP, RevenueCat, Supabase y Resend. Sin IA, sin publicidad, sin analítica. Y que Stripe es solo de la web y la app no enlaza a él |
| 5 | Sin diferencias por región |
| 6 | No es sector regulado ni producto sanitario, y el contenido es propio |
| 7 | Qué se compra, cuánto cuesta y la ruta exacta hasta el botón |

## Por qué el punto del contenido generado por el usuario importa

Es el que más riesgo tiene de provocar un **segundo** rechazo. Si Apple cree
que los usuarios ven contenido de otros, exige por la norma 1.2 un sistema de
denuncias, bloqueo y moderación en 24 horas, que esta app no tiene porque no lo
necesita. Por eso la respuesta lo deja dicho de forma explícita y sin rodeos:
cada usuario solo ve lo suyo.
