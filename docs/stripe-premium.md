# Stripe paso a paso — suscripción Premium

Guía para configurar el cobro de **Reset Alfa Premium (10 USD/mes)** desde cero.
Escrita suponiendo que nunca has usado Stripe.

Al final tendrás **tres datos** que hay que pegar en EasyPanel:

| Variable | Tiene esta pinta | De dónde sale |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_51Ab…` | Paso 4 |
| `STRIPE_PREMIUM_PRICE_ID` | `price_1Ab…` | Paso 3 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_1Ab…` | Paso 5 |

---

## Antes de empezar: modo prueba y modo real

Stripe tiene **dos mundos separados**, con un interruptor arriba a la derecha
del panel: **Modo de prueba** y modo real.

- En **prueba** pagas con tarjetas falsas. Nadie cobra nada. Sirve para
  comprobar que todo funciona.
- En **real** se cobra de verdad. Exige tener la cuenta activada (paso 1).

**Los tres datos de la tabla son DISTINTOS en cada modo.** Una clave de prueba
en producción hace que nadie pueda pagar; una clave real en pruebas cobra de
verdad a quien pruebe. Cuando cambies de uno a otro hay que rehacer los pasos
3, 4 y 5 con el interruptor en el otro lado.

**Recomendación:** haz todo primero en modo prueba, comprueba que funciona, y
después repite los pasos 3-5 en modo real y cambia las tres variables.

---

## Paso 1 — Crear la cuenta y activarla

1. Entra en <https://dashboard.stripe.com/register> y crea la cuenta con el
   correo del negocio.
2. Confirma el correo.
3. Para cobrar de verdad, Stripe pide **activar la cuenta**: nombre fiscal o de
   la empresa, dirección, actividad, documento de identidad y la cuenta
   bancaria donde quieres recibir el dinero. Está en **Activar pagos** o en
   *Settings → Business settings*.

   Puedes saltarte esto de momento: **en modo prueba no hace falta**.

---

## Paso 2 — Poner el país y la moneda

*Settings → Business settings → Public details* y *Bank accounts and currencies*.

El precio del Premium está en **USD**. Stripe puede cobrar en una moneda
distinta a la de tu cuenta sin problema; recibirás el dinero convertido, con la
comisión de cambio de Stripe. Si prefieres cobrar en euros, dímelo y cambio el
producto a EUR (hay que tocar un fichero SQL y el precio en Stripe).

---

## Paso 3 — Crear el producto y el precio ⟶ `STRIPE_PREMIUM_PRICE_ID`

Esto es lo que define **qué** se cobra y **cada cuánto**.

1. Menú lateral → **Catálogo de productos** (*Product catalog*) → botón
   **+ Añadir producto**.
2. Rellena:
   - **Nombre**: `Reset Alfa Premium`
   - **Descripción**: `Bitácora de NOFAP, P.A.D, carta anti-recaída y racha sin límite.`
3. En el bloque de precio:
   - **Modelo de precios**: `Estándar` (o *Standard pricing*)
   - **Precio**: `10.00`
   - **Moneda**: `USD`
   - **Periodicidad / Billing period**: **`Mensual`** ← *esto es lo más
     importante de todo el paso. Si eliges «Pago único», la suscripción no se
     renueva y el acceso caduca al mes sin volver a cobrarse.*
4. Guarda.
5. Ya en la ficha del producto, busca la sección **Precios** (*Pricing*). Verás
   una línea tipo `10,00 US$ / mes`. A su derecha hay un identificador que
   empieza por **`price_`** — cópialo (hay un icono de copiar; también sale al
   pulsar los tres puntos → *Copy price ID*).

   👉 **Ese es `STRIPE_PREMIUM_PRICE_ID`.**

   ⚠️ Cuidado: hay dos identificadores parecidos. El del producto empieza por
   `prod_` y **no sirve**. El que necesito empieza por **`price_`**.

---

## Paso 4 — Copiar la clave secreta ⟶ `STRIPE_SECRET_KEY`

1. Menú lateral → **Desarrolladores** (*Developers*) → **Claves de API**
   (*API keys*).
2. Verás dos:
   - *Publishable key* (`pk_…`) — **no la necesito**.
   - **Secret key** (`sk_…`) — pulsa **Revelar** y cópiala.

   👉 **Esa es `STRIPE_SECRET_KEY`.**

**Esta clave permite mover dinero de tu cuenta.** No la pegues en WhatsApp, ni
en un correo, ni en un chat. Solo en EasyPanel. Si se filtra, se revoca desde
esa misma pantalla y se genera otra.

---

## Paso 5 — Crear el webhook ⟶ `STRIPE_WEBHOOK_SECRET`

El webhook es la llamada que Stripe hace a la app para avisar de que alguien
pagó, renovó o canceló. **Sin esto, el usuario paga y no recibe el acceso.**

1. Menú lateral → **Desarrolladores** → **Webhooks** → **+ Añadir endpoint**.
2. **URL del endpoint**: la dirección de tu web seguida de la ruta. Si la web
   está en `modoguerrero.es`:

   ```
   https://modoguerrero.es/api/stripe/webhook
   ```

   Tiene que ser el dominio **público**, con `https`, el mismo que tienes en
   `NEXT_PUBLIC_SITE_URL`.
3. **Seleccionar eventos**: pulsa *Seleccionar eventos* y marca **exactamente
   estos cinco**:

   ```
   checkout.session.completed
   invoice.paid
   invoice.payment_failed
   customer.subscription.updated
   customer.subscription.deleted
   ```

   No marques «todos los eventos»: la app recibiría cientos de avisos que no
   usa.
4. Guarda.
5. En la ficha del endpoint recién creado busca **Clave secreta de firma**
   (*Signing secret*) y pulsa **Revelar**. Empieza por **`whsec_`**.

   👉 **Esa es `STRIPE_WEBHOOK_SECRET`.**

Sirve para comprobar que quien llama a la app es Stripe de verdad. Sin ella,
cualquiera que descubra la URL podría regalarse Premium.

---

## Paso 6 — Activar el portal de cliente

Es donde el usuario cancela, cambia la tarjeta y descarga facturas. El botón
«Gestionar suscripción» de Perfil lleva ahí. **Si no lo activas, ese botón da
error.**

1. *Settings* → **Billing** → **Customer portal**.
2. Activa el portal y marca:
   - **Cancelar suscripciones** ✅
   - **Actualizar métodos de pago** ✅
   - **Ver historial de facturas** ✅
3. En *Business information* pon el enlace a tus términos y a la política de
   privacidad (`https://app.modoguerrero.es/privacidad`).
4. Guarda.

**Hay que activarlo en los dos modos**, prueba y real: son dos configuraciones
distintas.

---

## Paso 7 — Pegar las tres variables en EasyPanel

En el servicio de la web: pestaña **Environment** (NO «Build Arguments» —
son secretos y ahí quedarían dentro de la imagen).

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Guarda y **redespliega**.

---

## Paso 8 — Probar que funciona

Con el interruptor de Stripe en **modo prueba** y las claves de prueba puestas:

1. Entra en la app con una cuenta y ve a **Perfil → Hazte Premium**, o a
   `/app/premium`.
2. Pulsa **Empezar con Premium**. Debe abrirse la pantalla de pago de Stripe.
3. Paga con la tarjeta de prueba:

   | Campo | Valor |
   |---|---|
   | Número | `4242 4242 4242 4242` |
   | Caducidad | cualquier fecha futura, p. ej. `12/30` |
   | CVC | `123` |
   | Código postal | cualquiera, p. ej. `28001` |

4. Al terminar vuelves a la app y debe decir **«Ya está · Premium activo»**.
5. Comprueba que el candado desapareció: entra en Calendario y despliega una
   recaída, o abre la Bitácora de NOFAP.
6. En Perfil, pulsa **Gestionar suscripción**: debe abrirse el portal de
   Stripe. Cancela desde ahí y vuelve: debe decir «Cancelado. Conservas el
   acceso hasta el …».

### Si algo falla

| Lo que ves | Qué significa |
|---|---|
| «El pago aún no está configurado» | Falta `STRIPE_PREMIUM_PRICE_ID` o `STRIPE_SECRET_KEY`, o no redesplegaste |
| «No hemos podido abrir el pago (…)» | El mensaje entre paréntesis viene de Stripe. Cópiamelo |
| Pagas pero sigue sin Premium | El webhook. En *Developers → Webhooks* → tu endpoint verás los intentos y el error de cada uno |
| «No encontramos una suscripción en tu cuenta» al abrir el portal | Es correcto si nunca pagaste; si pagaste, el webhook no llegó |

En *Developers → Webhooks → tu endpoint* hay una lista de todas las llamadas
con su resultado. Un `200` es correcto; cualquier otra cosa, mándame el detalle.

---

## Opcional — IVA automático (Stripe Tax)

Para vender productos digitales en la UE hay que repercutir el IVA del país del
comprador. Stripe lo calcula solo, pero **hay que configurarlo antes**:

1. *Settings* → **Tax** → activar **Stripe Tax** y declarar dónde estás
   registrado.
2. Solo **después**, añadir en EasyPanel:

   ```
   STRIPE_AUTOMATIC_TAX=true
   ```

Están separados a propósito: si se pide el cálculo de impuestos sin haberlo
configurado, **Stripe rechaza el pago entero** y el usuario ve un error sin
explicación. Con la variable vacía (por defecto) el cobro funciona sin IVA
automático.

Consúltalo con tu asesor: esto es una decisión fiscal, no técnica.

---

## La sesión diagnóstica (60 USD) no necesita nada de esto

Ese cobro usa un **enlace de pago** que ya creaste
(`buy.stripe.com/fZu5kC5aygr49xB9wc5os2o`) y está puesto en el código. Es un
pago único que cobras y gestionas desde el panel de Stripe a mano: no hay
webhook ni acceso automático que conceder.

Si alguna vez cambias ese enlace, está en
[`apps/web/src/lib/app/hitos.ts`](../apps/web/src/lib/app/hitos.ts).
