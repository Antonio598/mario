# Conectar `app.modoguerrero.es` a la app de EasyPanel

Guía paso a paso. El dominio `modoguerrero.es` está en **ProfesionalHosting** y la
app corre en **EasyPanel**, en tu VPS.

Son cinco sitios que tocar, en este orden. Saltarse uno deja la app a medias
(carga pero no se puede entrar, o se entra pero no se puede pagar).

| # | Dónde | Qué |
|---|---|---|
| 1 | ProfesionalHosting | **Cambiar** el registro DNS `app` para que apunte al VPS |
| 2 | EasyPanel | Añadir el dominio al servicio y activar HTTPS |
| 3 | EasyPanel | `NEXT_PUBLIC_SITE_URL` en **Build Arguments** + rebuild |
| 4 | Supabase | Autorizar el dominio para el inicio de sesión |
| 5 | Stripe | Cambiar la URL del webhook |

---

## Situación actual (consultada el 17/09/2026)

| | |
|---|---|
| `modoguerrero.es` | `45.154.57.25` — ProfesionalHosting (tu WordPress) |
| `app.modoguerrero.es` | `45.154.57.25` — **ProfesionalHosting también** ❌ |
| Tu VPS con EasyPanel | `82.25.93.42` |
| Servidores DNS del dominio | `dns5725.phdns22.es` / `dns5726.phdns22.es` (ProfesionalHosting) |

**El subdominio ya existe, pero apunta al sitio equivocado.** Ahora mismo
`app.modoguerrero.es` lleva al hosting compartido, no a tu VPS. No hay que
crearlo: hay que **cambiar a dónde apunta**.

Comprobado que no es un comodín (`*`): un subdominio inventado como
`xyz123.modoguerrero.es` no resuelve, así que `app` está puesto a mano.

---

## ⚠️ Lo importante: «Subdominios» NO es lo mismo que «Zona DNS»

En el panel de ProfesionalHosting (cPanel) hay dos herramientas que parecen la
misma y no lo son. Casi seguro que el subdominio se creó con la primera, y por
eso apunta al hosting:

| Herramienta | Qué hace | ¿Sirve aquí? |
|---|---|---|
| **Subdominios** (*Subdomains*) | Crea una carpeta en el hosting y apunta el subdominio **a ese mismo servidor** | ❌ **No** |
| **Zona DNS** (*Editor de Zona DNS*) | Dice a qué IP apunta cada nombre, esté donde esté | ✅ **Sí** |

Tu app **no vive en ProfesionalHosting**, vive en tu VPS. Por eso el subdominio
no puede ser una carpeta del hosting: tiene que ser un registro DNS que apunte
fuera, a `82.25.93.42`.

---

## Paso 1 — Cambiar el registro en ProfesionalHosting

1. Entra en tu **Área de Cliente de ProfesionalHosting** → **cPanel** del
   dominio.
2. Busca **Editor de Zona DNS** (*Zone Editor* / *Zona DNS*). **No entres en
   «Subdominios».**
3. Pulsa **Administrar** en `modoguerrero.es`. Verás la lista de registros.
4. Busca la línea de **`app.modoguerrero.es`**, tipo `A`, con valor
   `45.154.57.25`.

   **Si la encuentras** → pulsa **Editar** y cambia solo el valor:

   ```
   45.154.57.25   →   82.25.93.42
   ```

   **Si no la encuentras** → pulsa **Añadir registro**:

   | Campo | Valor |
   |---|---|
   | Tipo | `A` |
   | Nombre | `app` (si el panel completa solo el dominio) o `app.modoguerrero.es.` |
   | TTL | `3600` |
   | Registro / Dirección | `82.25.93.42` |

5. Guarda.

6. **Si además aparece en la sección «Subdominios»**, elimínalo de ahí *después*
   de arreglar la zona DNS. Si no lo quitas, cPanel puede volver a escribir el
   registro apuntando al hosting y el cambio se deshace solo.

   > Al borrar un subdominio, cPanel a veces borra también su registro DNS.
   > Comprueba la zona otra vez después de hacerlo.

**No toques `modoguerrero.es` ni `www`.** Esos apuntan a tu WordPress y tienen
que seguir exactamente igual: la web pública y la app son dos cosas distintas en
dos servidores distintos.

### Confirma antes de seguir

El DNS tarda entre 15 minutos y 2 horas. Comprueba con:

```sh
nslookup app.modoguerrero.es 8.8.8.8
```

Tiene que devolver **`82.25.93.42`**. Mientras siga diciendo `45.154.57.25`, el
cambio no ha llegado.

También sirve <https://dnschecker.org> escribiendo `app.modoguerrero.es`.

**No pases al paso 2 hasta que responda con la IP nueva.** Si pides el
certificado HTTPS antes, Let's Encrypt intenta validar contra el hosting
antiguo, falla, y luego hay que esperar para reintentar.

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
