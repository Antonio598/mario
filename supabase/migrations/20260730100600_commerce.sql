-- =============================================================================
-- 0007 · PRODUCTOS Y PERMISOS
--
-- REGLA DE PLATAFORMA QUE CONDICIONA ESTE DISENO:
-- Apple y Google exigen su sistema de compra in-app (comision 15-30 %) para
-- contenido digital vendido DENTRO de la app. Por eso la app movil nunca
-- muestra `precio_cents` ni abre un checkout: solo lee `entitlements` para
-- saber que puede desbloquear, y cuando el usuario quiere comprar abre
-- `products.url_web` en el NAVEGADOR EXTERNO.
--
-- De ahi que `precio_cents` y `url_web` convivan en la misma tabla: la web los
-- usa los dos, la app solo el segundo.
-- =============================================================================

create table public.products (
  id               uuid                 primary key default gen_random_uuid(),
  slug             text                 not null unique
                                        check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),

  nombre           text                 not null,
  descripcion      text,
  tipo             public.product_tipo  not null,

  precio_cents     integer              not null check (precio_cents >= 0),
  moneda           char(3)              not null default 'EUR',

  -- Se rellena en la Fase 4. UNIQUE para que dos productos no puedan apuntar
  -- al mismo precio de Stripe y desbloquear cosas cruzadas.
  stripe_price_id  text                 unique,

  -- Ficha del producto en la web. La app abre esta URL en navegador externo.
  url_web          text,

  imagen_url       text,
  activo           boolean              not null default true,
  orden            integer              not null default 0,

  created_at       timestamptz          not null default now(),
  updated_at       timestamptz          not null default now()
);

comment on table public.products is
  'Catalogo. Lectura publica. La app movil NUNCA muestra precio_cents: usa '
  'url_web para abrir la ficha en navegador externo.';
comment on column public.products.url_web is
  'Ficha en la web publica. Unica via de compra permitida por las politicas de '
  'Apple y Google sin pasar por su comision.';

create trigger products_set_updated_at
  before update on public.products
  for each row execute function app.set_updated_at();


-- -----------------------------------------------------------------------------
-- Permisos adquiridos
-- -----------------------------------------------------------------------------

create table public.entitlements (
  id                          uuid                       primary key default gen_random_uuid(),
  user_id                     uuid                       not null
                                                         references auth.users (id) on delete cascade,

  -- RESTRICT y no CASCADE: borrar un producto que alguien compro dejaria al
  -- cliente sin acceso a algo que pago. Debe fallar y obligar a decidir.
  product_id                  uuid                       not null
                                                         references public.products (id) on delete restrict,

  origen                      public.entitlement_origen  not null default 'stripe',
  activo                      boolean                    not null default true,

  -- NULL = acceso perpetuo. Con valor = suscripcion o acceso temporal.
  expires_at                  timestamptz,

  -- Idempotencia de webhooks (Fase 4). Stripe reintenta las entregas; sin esta
  -- clave unica, un reintento crearia permisos duplicados.
  stripe_checkout_session_id  text                       unique,

  created_at                  timestamptz                not null default now(),
  updated_at                  timestamptz                not null default now(),

  constraint entitlements_user_product_unique unique (user_id, product_id)
);

comment on table public.entitlements is
  'Permisos del usuario. Los escribe unicamente el webhook de Stripe via '
  'service_role. El cliente solo lee.';

create index entitlements_user_activos_idx
  on public.entitlements (user_id, product_id)
  where activo;

create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function app.set_updated_at();


-- -----------------------------------------------------------------------------
-- Resolucion de acceso
--
-- Una sola definicion de "tiene acceso", usada por las politicas RLS, por la
-- web y por la app. Si esta logica se duplicara en el cliente, tarde o
-- temprano las tres respuestas divergirian.
-- -----------------------------------------------------------------------------

create or replace function app.has_entitlement(p_user_id uuid, p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.entitlements e
    where e.user_id = p_user_id
      and e.product_id = p_product_id
      and e.activo
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

comment on function app.has_entitlement(uuid, uuid) is
  'Definicion unica de acceso a un producto. La usan las politicas RLS de '
  'lessons, la web y la app.';


-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.products     enable row level security;
alter table public.entitlements enable row level security;

-- El catalogo es publico: la web lo necesita para las fichas de producto y la
-- app para el listado informativo de Tienda.
create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (activo);

create policy "entitlements_select_own"
  on public.entitlements for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Sin politicas de escritura para el cliente. Si un usuario pudiera insertar en
-- `entitlements`, se regalaria el programa completo desde la consola del
-- navegador. Solo el webhook de Stripe (service_role) escribe aqui.
