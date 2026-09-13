-- =============================================================================
-- RESET ALFA - PREMIUM, PASO 2 DE 2: SUSCRIPCION MENSUAL
--
-- Requiere haber ejecutado ANTES, y por separado, premium-1-tipo.sql.
--
-- Anade a `entitlements` lo que hace falta para una suscripcion recurrente
-- (cliente y suscripcion de Stripe, cancelacion al final del periodo), crea la
-- fila del producto y expone es_premium() para que cualquier cliente pueda
-- preguntar sin conocer el id del producto.
--
-- El id de precio de Stripe NO va aqui: es distinto en pruebas y en produccion
-- y este fichero es publico. Vive en la variable de entorno
-- STRIPE_PREMIUM_PRICE_ID del servidor web.
--
-- Idempotente.
-- =============================================================================

alter table reset_alfa.entitlements
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists cancel_at_period_end   boolean not null default false;

-- Una suscripcion de Stripe pertenece a una sola fila. Parcial: las filas de
-- compras unicas y las manuales no tienen suscripcion.
create unique index if not exists entitlements_stripe_subscription_idx
  on reset_alfa.entitlements (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists entitlements_stripe_customer_idx
  on reset_alfa.entitlements (stripe_customer_id);

comment on column reset_alfa.entitlements.expires_at is
  'Para suscripciones: fin del periodo pagado mas 48 h de gracia. El webhook '
  'lo adelanta en cada renovacion.';


-- -----------------------------------------------------------------------------
-- El producto. Id fijo para que el codigo pueda referirse a el sin consultar.
-- -----------------------------------------------------------------------------
insert into reset_alfa.products
  (id, slug, nombre, descripcion, tipo, precio_cents, moneda, url_web, orden,
   mostrar_precio, cta_texto)
values
  ('b0000000-0000-4000-8000-000000000010', 'premium-mensual',
   'Reset Alfa Premium',
   'Protocolo post-recaida completo, P.A.D, carta anti-recaida y racha sin limite. '
   'Cancela cuando quieras.',
   'suscripcion', 1000, 'USD',
   null, 0,
   true, 'Hazte Premium')
on conflict (slug) do update set
  nombre = excluded.nombre, descripcion = excluded.descripcion,
  tipo = excluded.tipo, precio_cents = excluded.precio_cents,
  moneda = excluded.moneda, orden = excluded.orden, activo = true,
  mostrar_precio = excluded.mostrar_precio, cta_texto = excluded.cta_texto;


-- -----------------------------------------------------------------------------
-- es_premium(): true si el usuario tiene la suscripcion activa y vigente.
-- Reutiliza has_entitlement, que ya aplica `activo` y `expires_at`.
-- -----------------------------------------------------------------------------
create or replace function reset_alfa.es_premium()
returns boolean language sql stable
security definer set search_path = reset_alfa, pg_catalog as $$
  select coalesce(
    reset_alfa_priv.has_entitlement(auth.uid(), 'b0000000-0000-4000-8000-000000000010'),
    false);
$$;

revoke all on function reset_alfa.es_premium() from public, anon;
grant execute on function reset_alfa.es_premium() to authenticated;


-- -----------------------------------------------------------------------------
-- COMPROBACION. Las cuatro columnas deben salir en true.
-- -----------------------------------------------------------------------------
select
  exists (
    select 1 from information_schema.columns
     where table_schema = 'reset_alfa' and table_name = 'entitlements'
       and column_name = 'stripe_subscription_id') as columnas_creadas,
  exists (
    select 1 from reset_alfa.products
     where slug = 'premium-mensual' and tipo = 'suscripcion' and activo) as producto_creado,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'reset_alfa' and p.proname = 'es_premium') = 1 as funcion_creada,
  has_function_privilege('authenticated', 'reset_alfa.es_premium()', 'execute')
    as puede_ejecutarla;
