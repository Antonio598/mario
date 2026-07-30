-- =============================================================================
-- 0009 · NOTIFICACIONES
--
-- Bandeja en la app. Las escribe el servidor (push del articulo diario,
-- recordatorio de check-in, hitos de racha); el usuario solo las lee y las
-- marca como leidas.
-- =============================================================================

create table public.notifications (
  id         uuid                       primary key default gen_random_uuid(),
  user_id    uuid                       not null
                                        references auth.users (id) on delete cascade,

  tipo       public.notification_tipo   not null,
  titulo     text                       not null,
  cuerpo     text                       not null,

  -- Destino al tocar la notificacion, p.ej. /articulos/mi-slug
  deeplink   text,

  leida      boolean                    not null default false,
  created_at timestamptz                not null default now()
);

comment on table public.notifications is
  'Bandeja en la app. Insercion reservada a service_role; el usuario solo '
  'puede marcar leida.';

-- Indice parcial: la consulta caliente es "cuantas no leidas tengo", no el
-- historico completo.
create index notifications_user_no_leidas_idx
  on public.notifications (user_id, created_at desc)
  where not leida;

create index notifications_user_idx
  on public.notifications (user_id, created_at desc);


-- -----------------------------------------------------------------------------
-- Solo se puede cambiar `leida`
--
-- La politica de UPDATE no puede limitar QUE columnas se tocan, asi que el
-- control de columna se hace con GRANT. Sin esto, un usuario podria reescribir
-- el titulo y el cuerpo de sus propias notificaciones.
-- -----------------------------------------------------------------------------

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "notifications_marcar_leida"
  on public.notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke update on public.notifications from authenticated;
grant update (leida) on public.notifications to authenticated;
