# SQL de Reset Alfa

## Orden de ejecución

Pega cada fichero en el SQL Editor de Supabase, **en este orden**:

| # | Fichero | Qué hace |
|---|---|---|
| 1 | `instalacion-esquema-aislado.sql` | Crea las 18 tablas bajo `reset_alfa`, sin tocar `public` |
| 2 | `contenido-real.sql` | Masterclasses, protocolos, libros, programa y artículos |
| 3 | `admin-editores.sql` | *(opcional)* Panel de administración. **Cambia el correo del final por el tuyo** |
| 4 | `arreglo-consentimiento.sql` | RPC `dar_consentimiento`. Sin él, «Acepto, empezar el protocolo» puede fallar |
| 5 | `pad.sql` | Columna `profiles.pad` y RPC `guardar_pad`. Sin él, el P.A.D no se puede crear |
| 6 | `carta.sql` | Columna `profiles.carta` y RPC `guardar_carta`. Sin él, la carta anti-recaída no se puede crear |
| 7 | `plan.sql` | Columna `profiles.plan` y RPC `guardar_plan`. Sin él, el test de entrada no se puede guardar y la app manda al test en bucle |
| 8 | `premium-1-tipo.sql` | **Pégalo SOLO, en su propia ejecución.** Añade el tipo `suscripcion` al enum. PostgreSQL no deja usar un valor de enum en la misma transacción en que se crea |
| 9 | `premium-2-suscripcion.sql` | Columnas de suscripción en `entitlements`, producto `premium-mensual` y RPC `es_premium` |
| 10 | `hitos.sql` | Columna `profiles.hitos_vistos` y RPC `marcar_hito`. Sin él, el vídeo de los 7 días saldría en cada visita |
| 11 | `tiendas-origen.sql` | **Pégalo SOLO, en su propia ejecución.** Orígenes `apple` y `google` para la suscripción comprada dentro de la app. Sin él, el webhook de RevenueCat falla |

Los once son idempotentes: puedes reejecutarlos sin duplicar nada.

**El SQL Editor envuelve cada ejecución en una transacción.** Si un fichero da
un error en cualquier punto, deshace todo lo anterior y no queda nada. Por eso
un fallo en la línea 900 deja la base exactamente como estaba.

## Comprobar el estado

```sql
select
  to_regnamespace('reset_alfa') is not null            as existe_esquema,
  (select count(*) from information_schema.tables
     where table_schema = 'reset_alfa')                as tablas,
  (select count(*) from information_schema.tables
     where table_schema = 'public')                    as tablas_de_tu_crm,
  current_database()                                    as base_de_datos;
```

Esperado: `true`, **18**, y el número de tu CRM sin cambios.

## Deshacer

Elimina Reset Alfa sin tocar nada más:

```sql
drop schema if exists reset_alfa cascade;
drop schema if exists reset_alfa_priv cascade;
```

## Después del SQL, dos pasos en el servidor

**1. Exponer el esquema.** En Supabase self-hosted no hay panel para esto: va en
el `docker-compose.yml`, servicio `rest`.

```yaml
PGRST_DB_SCHEMAS: "public,storage,graphql_public,reset_alfa"
```

Añade `reset_alfa` a la lista existente **sin sustituirla** —quitar `storage`
rompe los ficheros— y reinicia con `docker compose up -d rest`.

**2. En EasyPanel**, Build Arguments:

```
NEXT_PUBLIC_SUPABASE_SCHEMA=reset_alfa
```

**3. Stripe (suscripción Premium)**, en Environment de EasyPanel — nunca en
Build Arguments, son secretos:

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
```

**Paso a paso detallado de Stripe:** [`docs/stripe-premium.md`](../docs/stripe-premium.md).

**4. Compra de Premium dentro de la app** (App Store / Google Play via
RevenueCat), también en Environment:

```
REVENUECAT_SECRET_KEY=sk_...
REVENUECAT_WEBHOOK_SECRET=<cadena larga inventada>
```

Requiere el fichero 11 (`tiendas-origen.sql`). **Paso a paso:**
[`docs/compras-en-la-app.md`](../docs/compras-en-la-app.md).

En resumen: producto «Reset Alfa Premium» con precio **recurrente
mensual de 10 USD** (su id es el `price_...`); webhook a
`https://<dominio>/api/stripe/webhook` con los eventos
`checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`,
`customer.subscription.updated` y `customer.subscription.deleted`; y el
**Customer Portal** activado (Settings → Billing → Customer portal), que es
donde el usuario cancela.

Para dar Premium a mano a alguien (un alumno, una prueba), sin pasar por
Stripe:

```sql
insert into reset_alfa.entitlements (user_id, product_id, origen, activo, expires_at)
select id, 'b0000000-0000-4000-8000-000000000010', 'manual', true, null
  from auth.users where email = 'correo@del.usuario'
on conflict (user_id, product_id) do update set activo = true, expires_at = null;
```

---

## Migraciones

`migrations/` contiene la instalación para un proyecto Supabase **dedicado**,
donde todo vive en `public`. Se aplican con la CLI (`supabase db push`) y son
alternativas a `instalacion-esquema-aislado.sql`, no complementarias.

`tests/` son las pruebas de aislamiento RLS. Es la verificación más importante
del repositorio: detrás de esas políticas hay datos de categoría especial del
art. 9 RGPD.
