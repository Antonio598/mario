# Premium dentro de la app: App Store y Google Play, paso a paso

Reset Alfa Premium (10 USD/mes) se vende en dos sitios con la misma cuenta:

| Dónde | Cómo cobra | Comisión | Quién avisa al servidor |
|---|---|---|---|
| Web (`app.modoguerrero.es`) | Stripe | ~3 % | Webhook de Stripe → `/api/stripe/webhook` |
| App iPhone / Android | **Apple / Google**, a través de RevenueCat | **15 % el primer año**, 30 % después de 1 M USD/año | Webhook de RevenueCat → `/api/tiendas/webhook` |

Los dos escriben en la misma tabla `entitlements`. Quien compra en la app lo
ve desbloqueado en la web al instante, y al revés. Cada usuario tiene **una**
suscripción: el paywall no deja comprar en la app si ya es Premium.

**Por qué no Stripe en la app:** Apple (norma 3.1.1) rechaza cualquier app que
venda contenido digital sin su sistema de compra, incluido enlazar a una web
para pagar. Google igual. RevenueCat es la capa que habla con las dos tiendas,
valida los recibos y nos avisa; es gratis hasta 2 500 USD/mes de ingresos.

**Lo que sí sigue abriéndose en el navegador:** el libro (bien físico) y la
sesión diagnóstica (servicio presencial). Apple lo permite (3.1.3(e)).

---

## Parte 1 — RevenueCat (30 minutos)

### 1.1 Crear el proyecto

1. Entra en <https://app.revenuecat.com> y crea una cuenta con
   `israelmayalara@gmail.com`.
2. **Create new project** → nombre `Reset Alfa`.
3. En el menú lateral, **Project settings → Apps**. Verás que hay que añadir
   una app por tienda. Lo harás en 2.4 (Apple) y 3.3 (Google), cuando tengas
   los datos.

### 1.2 Entitlement y oferta

1. **Product catalog → Entitlements → + New**. Identificador: `premium`.
   Descripción: «Reset Alfa Premium». (Si eliges otro identificador, ponlo en
   `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` y `REVENUECAT_ENTITLEMENT_ID`.)
2. **Offerings → + New**. Identificador `default`, descripción «Premium
   mensual». Márcala como **current**.
3. Dentro de la oferta, **+ New package** → tipo **Monthly**. Los productos
   se le enlazan en 2.5 y 3.4.

### 1.3 Claves

**Project settings → API keys**:

- **Public app-specific API keys**: una por app. Aparecen al crear cada app
  (2.4 y 3.3). Empiezan por `appl_` y `goog_`. Van en la app (son públicas):
  ```
  EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
  ```
  Ponlas en `apps/mobile/eas.json`, en `build.production.env` y
  `build.preview.env`, junto a `EXPO_PUBLIC_SITE_URL`.
- **Secret API keys → + New**: nombre `servidor`, permisos de lectura de
  *customer information* y *delete customer*. Empieza por `sk_`. **Solo en
  EasyPanel → Environment:**
  ```
  REVENUECAT_SECRET_KEY=sk_...
  ```

### 1.4 Webhook

**Project settings → Integrations → Webhooks → + New**:

- URL: `https://app.modoguerrero.es/api/tiendas/webhook`
- **Authorization header value**: una cadena larga que inventes (en tu
  terminal: `openssl rand -hex 32`). La misma va en EasyPanel:
  ```
  REVENUECAT_WEBHOOK_SECRET=<esa cadena>
  ```
- Eventos: deja **todos**. El servidor no interpreta el evento; con cualquiera
  vuelve a copiar el estado real del suscriptor.
- Environment: **Production and Sandbox** (así funciona también con las
  compras de prueba).

### 1.5 SQL

Pega `supabase/tiendas-origen.sql` en el SQL Editor, **solo, en su propia
ejecución** (fichero 11 de `supabase/LEEME.md`). Añade los orígenes `apple` y
`google`. Sin esto, el webhook falla al escribir.

---

## Parte 2 — App Store Connect (Apple)

Necesitas la cuenta de desarrollador de Apple y la app creada en App Store
Connect (guía `app-store-paso-a-paso.md`, pasos 1.2 y 3.2).

### 2.1 Acuerdo de pago

**App Store Connect → Acuerdos, impuestos y banca**. Firma el **Paid Apps
Agreement**, y rellena **datos bancarios y fiscales**. Sin esto, los productos
de suscripción se quedan en «Missing Metadata» y no aparecen en la app. Suele
tardar 1-2 días en activarse.

### 2.2 El producto de suscripción

**Tu app → Suscripciones (menú lateral) → + Grupo de suscripción**:

- Nombre del grupo: `Reset Alfa Premium`.
- Dentro, **+ Crear suscripción**:
  - **Nombre de referencia**: `Premium mensual`
  - **ID del producto**: `es.modoguerrero.resetalfa.premium.mensual`
    (cópialo tal cual; se usa en RevenueCat)
  - **Duración**: 1 mes
  - **Precio**: elige el nivel de **9,99 USD**. Apple lo convierte a cada país;
    revísalo si quieres redondear el de España.
  - **Localización** (español): nombre visible `Premium`, descripción
    «Bitácora de NOFAP, P.A.D, carta anti-recaída y racha sin límite».
  - **Captura de revisión**: una captura del paywall de la app (la pantalla
    «Gratis o Premium»). Vale la de TestFlight.
- Guarda. Estado: «Listo para enviar». Se aprueba junto con la primera versión
  de la app.

### 2.3 Clave de compras integradas

**Usuarios y acceso → Integraciones → Compras integradas (In-App Purchase) →
+ Generar clave**. Nombre `RevenueCat`. Descarga el fichero `.p8` (solo se
puede descargar una vez) y anota el **Key ID** y el **Issuer ID**.

### 2.4 Conectar Apple con RevenueCat

RevenueCat → **Project settings → Apps → + New → App Store**:

- **App name**: `Reset Alfa`
- **App Bundle ID**: `es.modoguerrero.resetalfa`
- **In-App Purchase Key**: sube el `.p8` de 2.3, con su Key ID e Issuer ID.
- **App-Specific Shared Secret**: App Store Connect → tu app → **Información
  de la app → Secreto compartido específico de la app → Gestionar → Generar**.
  Pégalo aquí.
- Guarda. Copia la **Public API key** (`appl_...`) → `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.

**App Store Server Notifications** (para que Apple avise a RevenueCat de
renovaciones y cancelaciones): App Store Connect → tu app → **Información de
la app → Notificaciones del servidor de App Store** → URL de producción y de
sandbox: la que muestra RevenueCat en la ficha de la app (
`https://api.revenuecat.com/v1/subscribers/apple/...`). Versión 2.

### 2.5 Producto en RevenueCat

**Product catalog → Products → + New → App Store**: identificador
`es.modoguerrero.resetalfa.premium.mensual`. Después:

- **Entitlements → premium → Attach** → ese producto.
- **Offerings → default → paquete Monthly → Attach** → ese producto.

### 2.6 Probar sin pagar (sandbox)

1. App Store Connect → **Usuarios y acceso → Sandbox → Testers → +**: crea un
   Apple ID de prueba (un correo que no exista en Apple, p. ej.
   `prueba1@modoguerrero.es`).
2. En el iPhone: **Ajustes → App Store → Cuenta Sandbox** → inicia sesión con
   ese usuario (solo aparece en iOS 12+ y tras instalar un build de
   TestFlight o de desarrollo).
3. Abre la app de TestFlight, ve a Perfil → **Ver Premium** → Suscribirme.
   La hoja de pago de Apple dice «[Entorno: Sandbox]». No se cobra.
4. Al volver, la app dice «Ya está» y en la web (misma cuenta) Premium sale
   activo. En RevenueCat → **Customers** aparece el usuario con el
   entitlement.
5. En sandbox una suscripción mensual se renueva **cada 5 minutos** y caduca
   tras 6 renovaciones: así ves en media hora todo el ciclo (renovación,
   caducidad) sin esperar meses.

### 2.7 En la ficha de la app

Al enviar a revisión (guía principal, 3.5):

- **Compras integradas**: en la sección «Compras integradas y suscripciones»
  de la versión, **añade** la suscripción `Premium mensual`. Sin esto, Apple
  la revisa por separado y la app puede aprobarse sin poder vender.
- **Notas para el revisor**: sustituye la frase sobre «la app no contiene
  compras integradas» por:

  > Reset Alfa es una herramienta de seguimiento de hábitos y disciplina. La
  > suscripción Premium se compra con compras integradas de Apple (Perfil →
  > Ver Premium). La cuenta de demostración tiene Premium activado para que
  > puedan revisar todas las funciones. Los enlaces externos son a un libro
  > físico y a una sesión de consultoría presencial. La cuenta se puede
  > eliminar desde Perfil → Eliminar mi cuenta.

---

## Parte 3 — Google Play Console (Android)

Necesitas la cuenta de desarrollador de Google Play (25 USD, una vez) y la app
creada, con al menos un build subido a la pista de **pruebas internas**: Google
no deja crear productos hasta que hay un APK/AAB con el permiso de facturación,
y el de esta app lo lleva.

### 3.1 Perfil de pagos

**Play Console → Configuración → Perfil de pagos**: crea o enlaza un perfil de
Google Payments (datos bancarios y fiscales). Sin él no se puede crear una
suscripción.

### 3.2 El producto de suscripción

**Tu app → Monetizar → Productos → Suscripciones → Crear suscripción**:

- **ID del producto**: `premium_mensual`
- **Nombre**: `Reset Alfa Premium`
- Guarda y **añade un plan básico**:
  - ID del plan: `mensual`
  - Tipo: renovación automática, **1 mes**, periodo de gracia 7 días.
  - **Precio**: 9,99 USD; Google lo convierte a cada país (revisa el de
    España).
  - **Activar** el plan.
- Descripción: «Bitácora de NOFAP, P.A.D, carta anti-recaída y racha sin
  límite». **Activar** la suscripción.

### 3.3 Conectar Google con RevenueCat

1. **Google Cloud Console** (<https://console.cloud.google.com>) → crea un
   proyecto `Reset Alfa` → **APIs y servicios → Biblioteca** → activa
   **Google Play Android Developer API** y **Google Play Developer Reporting
   API**.
2. **IAM → Cuentas de servicio → Crear**: nombre `revenuecat`. Sin roles.
   Entra en la cuenta → **Claves → Añadir clave → JSON**. Descarga el fichero.
3. **Play Console → Usuarios y permisos → Invitar usuario**: el correo de la
   cuenta de servicio (`revenuecat@...iam.gserviceaccount.com`). Permisos de
   la app: **Ver datos financieros**, **Gestionar pedidos y suscripciones**.
   Tarda hasta 24-36 h en hacerse efectivo.
4. RevenueCat → **Project settings → Apps → + New → Play Store**: nombre
   `Reset Alfa`, package `es.modoguerrero.resetalfa`, sube el JSON. Copia la
   **Public API key** (`goog_...`) → `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
5. **Notificaciones en tiempo real**: en la ficha de la app en RevenueCat sale
   un **topic de Pub/Sub** con un botón «Connect to Google». Púlsalo; después
   en Play Console → **Monetizar → Configuración de monetización →
   Notificaciones para desarrolladores en tiempo real** pega ese topic.

### 3.4 Producto en RevenueCat

**Product catalog → Products → + New → Play Store**: identificador
`premium_mensual`, plan básico `mensual`. **Attach** al entitlement `premium`
y al paquete Monthly de la oferta `default` (el paquete admite un producto por
tienda).

### 3.5 Probar sin pagar

**Play Console → Configuración → Pruebas de licencias**: añade tu Gmail. Con
esa cuenta en el móvil e instalando desde la pista de pruebas internas, la
compra dice «Tarjeta de prueba» y no cobra. Las suscripciones de prueba se
renuevan cada 5 minutos.

---

## Parte 4 — Compilar y desplegar

1. EasyPanel → Environment: `REVENUECAT_SECRET_KEY`, `REVENUECAT_WEBHOOK_SECRET`
   (de 1.3 y 1.4). **Rebuild**.
2. `apps/mobile/eas.json` → `EXPO_PUBLIC_REVENUECAT_IOS_KEY` y
   `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` en `preview` y `production`.
3. `eas build --platform ios --profile preview` (y `android`). RevenueCat es un
   módulo nativo: **no funciona en Expo Go**, solo en un build de EAS.

Sin las claves de RevenueCat en el build, la app se comporta como hasta ahora:
Premium se describe como «gestionado desde tu cuenta en la web» y no hay botón
de compra. Así un build sin configurar no puede enseñar un paywall roto.

---

## Cómo funciona por dentro (para saber qué mirar si algo falla)

```
App (react-native-purchases)          RevenueCat              Servidor web
─────────────────────────────         ──────────              ────────────
Purchases.logIn(user.id)  ─────────►  suscriptor = id Supabase
"Suscribirme" ► hoja de Apple/Google
   ◄── recibo ──────────────────────► valida con la tienda
POST /api/tiendas/sincronizar ──────────────────────────────► GET subscriber
                                      webhook ──────────────► POST /api/tiendas/webhook
                                                              ► GET subscriber
                                                              ► upsert entitlements
                                                                (origen apple/google)
```

- **El acceso lo decide siempre `entitlements`**, no el móvil. El servidor
  pide a RevenueCat el estado actual y lo copia (`lib/tiendas/revenuecat.ts`).
- **Convivencia con Stripe:** una fila activa de Stripe nunca la desactiva la
  tienda, y una de la tienda nunca la desactiva Stripe.
- **Cancelar:** el usuario lo hace en los ajustes de la tienda (botón
  «Gestionar suscripción» en Perfil, que abre la página correcta). Conserva
  el acceso hasta el fin del periodo, igual que en Stripe.
- **Eliminar la cuenta** borra los datos, la identidad, la ficha en RevenueCat
  y cancela la suscripción de Stripe. La de la tienda **no se puede cancelar
  desde el servidor**: la app avisa antes de borrar para que la cancele el
  usuario.
- Si el webhook falla, RevenueCat lo reintenta. Lo ves en **Project settings
  → Integrations → Webhooks → Event log**.

## Variables, todas juntas

| Dónde | Variable | Valor |
|---|---|---|
| EasyPanel → Environment | `REVENUECAT_SECRET_KEY` | `sk_...` (1.3) |
| EasyPanel → Environment | `REVENUECAT_WEBHOOK_SECRET` | la cadena de 1.4 |
| EasyPanel → Environment | `REVENUECAT_ENTITLEMENT_ID` | `premium` (opcional) |
| `eas.json` → env | `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | `appl_...` (2.4) |
| `eas.json` → env | `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | `goog_...` (3.3) |
| `eas.json` → env | `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` | `premium` (opcional) |
