# Conectar `app.modoguerrero.es` a la app de EasyPanel

Guía paso a paso. El dominio `modoguerrero.es` está en **ProfesionalHosting** y la
app corre en **EasyPanel**, en tu VPS.

Son cinco sitios que tocar, en este orden. Saltarse uno deja la app a medias
(carga pero no se puede entrar, o se entra pero no se puede pagar).

| # | Dónde | Qué |
|---|---|---|
| 1 | ProfesionalHosting | Registro DNS `app` → IP del VPS |
| 2 | EasyPanel | Añadir el dominio al servicio y activar HTTPS |
| 3 | EasyPanel | `NEXT_PUBLIC_SITE_URL` en **Build Arguments** + rebuild |
| 4 | Supabase | Autorizar el dominio para el inicio de sesión |
| 5 | Stripe | Cambiar la URL del webhook |

---

## Paso 0 — Averigua la IP de tu VPS

La necesitas para el paso 1.

**Opción A.** En EasyPanel, arriba a la izquierda o en *Settings → Server*, aparece
la dirección IP del servidor.

**Opción B.** En el panel de tu proveedor de VPS (Hetzner, DigitalOcean, Contabo…),
en la ficha de la máquina.

Es un número tipo `203.0.113.45`. Anótalo — lo llamaré **IP-DEL-VPS**.

> Si tienes IPv6 además de IPv4, apunta las dos. La IPv4 empieza por números
> separados por puntos; la IPv6 lleva dos puntos y letras (`2a01:4f8:…`).

---

## Paso 1 — DNS en ProfesionalHosting

Aquí le dices a internet que `app.modoguerrero.es` vive en tu VPS.

1. Entra en tu **Área de Cliente de ProfesionalHosting**.
2. Busca **Dominios** → `modoguerrero.es` → **Administrar** → **Zona DNS**
   (puede llamarse *Editor de Zona DNS* o *DNS Management*).
3. Pulsa **Añadir registro** y rellena:

   | Campo | Valor |
   |---|---|
   | **Tipo** | `A` |
   | **Nombre / Host** | `app` |
   | **Valor / Apunta a** | **IP-DEL-VPS** |
   | **TTL** | `3600` (o el que venga por defecto) |

4. Guarda.

**Sobre el campo «Nombre»:** algunos paneles quieren solo `app` y otros el dominio
entero `app.modoguerrero.es`. Si al guardar ves que ha quedado
`app.modoguerrero.es.modoguerrero.es`, es que había que poner solo `app` —
edítalo.

**Si tienes IPv6:** añade además otro registro igual pero de tipo `AAAA` con la
dirección IPv6.

**No toques el registro de `modoguerrero.es` a secas ni el de `www`.** Esos
apuntan a tu WordPress actual y tienen que seguir como están: la web pública y la
app son dos cosas distintas.

### Comprobar que el DNS ya funciona

Espera entre 5 minutos y 2 horas (normalmente unos 15 min). Para comprobarlo:

- Entra en <https://dnschecker.org>, escribe `app.modoguerrero.es`, tipo `A`, y
  mira si sale tu IP en la mayoría de los países.
- O desde tu ordenador, en la terminal:

  ```sh
  nslookup app.modoguerrero.es
  ```

  Tiene que devolver **IP-DEL-VPS**.

**No sigas al paso 2 hasta que esto responda con tu IP.** Si intentas emitir el
certificado HTTPS antes de que el DNS propague, Let's Encrypt falla y hay que
esperar un rato antes de reintentar.

---

## Paso 2 — Añadir el dominio en EasyPanel

1. Entra en EasyPanel → tu proyecto → servicio **web** (el de la app).
2. Pestaña **Domains**.
3. Pulsa **Add Domain** y rellena:

   | Campo | Valor |
   |---|---|
   | **Host** | `app.modoguerrero.es` |
   | **HTTPS** | activado ✅ |
   | **Port** | `3000` |
   | **Path** | `/` |

   El puerto es `3000` porque es el que expone el contenedor de Next.js. Si
   EasyPanel ya trae otro número puesto y la app funcionaba, deja el que estaba.

4. Guarda. EasyPanel pide el certificado a Let's Encrypt automáticamente; tarda
   entre unos segundos y un par de minutos.
5. Abre `https://app.modoguerrero.es` en el navegador. Debería cargar la app **con
   el candado** de seguro.

### Si falla el certificado

- Mensaje tipo *«challenge failed»*: el DNS todavía no ha propagado. Espera y
  vuelve a darle a guardar.
- Sale la app pero **sin candado** o con aviso de «no seguro»: el certificado no
  se emitió. Quita el dominio, espera unos minutos y añádelo otra vez.
- No carga nada: comprueba que el puerto es el correcto y que el servicio está en
  verde (*Running*).

---

## Paso 3 — Decirle a la app cuál es su dirección ⚠️ el paso que más se olvida

La app usa su propia dirección para tres cosas: volver del inicio de sesión con
Google, volver de Stripe después de pagar, y las direcciones canónicas de los
artículos. Si sigue creyendo que vive en otro sitio, **se entra pero se sale
rebotado**, y **se paga pero no se vuelve**.

1. EasyPanel → servicio **web** → pestaña **Build** (o *Source → Build Arguments*).
2. Busca `NEXT_PUBLIC_SITE_URL` y ponlo así (sin barra al final):

   ```
   NEXT_PUBLIC_SITE_URL=https://app.modoguerrero.es
   ```

   Si no existe, créalo.

3. **Guarda y pulsa «Deploy» / «Rebuild».**

**Tiene que ir en Build Arguments, no en Environment.** Las variables que empiezan
por `NEXT_PUBLIC_` se incrustan dentro del código cuando se compila, no se leen al
arrancar: ponerla en Environment no tiene ningún efecto, y cambiarla **obliga a
recompilar**. Un simple reinicio no basta.

Las de Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_PREMIUM_PRICE_ID`) al revés: van en **Environment**, porque son secretos y
no deben quedar dentro de la imagen.

---

## Paso 4 — Autorizar el dominio en Supabase

Sin esto, quien intente entrar con Google o confirmar su correo acaba en una
página de error: Supabase solo redirige a direcciones que tenga en su lista
blanca.

Tu Supabase está **autoalojado en EasyPanel**, así que se configura con variables
de entorno del servicio, no desde un panel web.

1. EasyPanel → el servicio de **Supabase** → **Environment**.
2. Ajusta o añade:

   ```
   GOTRUE_SITE_URL=https://app.modoguerrero.es
   GOTRUE_URI_ALLOW_LIST=https://app.modoguerrero.es,https://app.modoguerrero.es/**
   ```

   `GOTRUE_SITE_URL` es a dónde se vuelve por defecto (y la base de los enlaces de
   confirmación por correo). `GOTRUE_URI_ALLOW_LIST` es la lista de destinos
   permitidos; el `/**` del final autoriza cualquier ruta dentro del dominio, que
   es lo que necesita `/auth/callback`.

3. Reinicia el servicio.

> Si en algún momento usas también `staging.modoguerrero.es`, añádelo a la lista
> separado por comas.

---

## Paso 5 — Actualizar el webhook de Stripe

La dirección que le diste a Stripe tiene que ser la definitiva, o los pagos
dejarán de conceder el acceso.

1. Stripe → **Desarrolladores → Webhooks** → tu endpoint.
2. **Editar** la URL y dejarla en:

   ```
   https://app.modoguerrero.es/api/stripe/webhook
   ```

3. Guarda.

Si aún no habías creado el webhook, créalo directamente con esa URL siguiendo
[`stripe-premium.md`](./stripe-premium.md).

**Ojo: hay un webhook en modo prueba y otro en modo real.** Cambia el de los dos
modos que estés usando.

---

## Comprobación final

Con todo hecho, abre `https://app.modoguerrero.es` en el móvil y repasa:

- [ ] Carga con **candado** de seguro (HTTPS).
- [ ] `https://app.modoguerrero.es/empezar` muestra el test.
- [ ] **Entrar con Google** te devuelve a la app, no a una pantalla de error.
- [ ] Registrarte con correo: el enlace de confirmación apunta a
      `app.modoguerrero.es`.
- [ ] En Perfil → **Hazte Premium** → pagar con la tarjeta de prueba
      `4242 4242 4242 4242` te devuelve a `app.modoguerrero.es/app/premium` y dice
      «Premium activo».
- [ ] `https://modoguerrero.es` (sin `app.`) sigue mostrando tu web de siempre.

---

## Dos cosas que conviene decidir

**1. La app también sirve el blog.** En `app.modoguerrero.es` funcionarán además
`/articulos`, `/`, etc. No molesta, pero si el blog vive en el WordPress de
`modoguerrero.es` tendrías el mismo contenido en dos direcciones, y a Google eso
no le gusta. Dos salidas: dejar el blog solo en WordPress y usar la app
únicamente para `/app` y `/empezar`, o mover el blog aquí del todo. Dime cuál
prefieres y lo dejo cerrado en el código.

**2. Instalar como app en el móvil.** Al abrir `app.modoguerrero.es` en el
teléfono, el navegador ofrece «Añadir a pantalla de inicio». Se instala con el
icono de Reset Alfa y se abre sin barra de navegador, como una app nativa. Vale
la pena decírselo a los usuarios en algún sitio visible.
