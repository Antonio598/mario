-- =============================================================================
-- 0010 · DERECHOS DEL INTERESADO  ·  arts. 15, 17 y 20 RGPD
--
-- Se construyen en la Fase 1 aunque la interfaz de Perfil llegue mas tarde.
-- Un "exportar mis datos" anadido al final del proyecto siempre olvida alguna
-- tabla; escrito junto al esquema, se actualiza a la vez que el.
--
-- Ambas funciones viven en `public` y no en `app` porque PostgREST solo expone
-- el esquema `public`: son las unicas que el cliente debe poder invocar.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Registro de supresiones
--
-- Conserva unicamente el identificador y la fecha. Cuando la cuenta se borra,
-- ese UUID ya no apunta a ningun dato: es un seudonimo sin capacidad de
-- reidentificacion, y permite acreditar ante una inspeccion que la supresion
-- se ejecuto y cuando.
-- -----------------------------------------------------------------------------

create table public.deletion_log (
  user_id    uuid        primary key,
  deleted_at timestamptz not null default now()
);

comment on table public.deletion_log is
  'Prueba de ejecucion del derecho de supresion. Solo UUID y fecha: sin datos '
  'personales asociados tras el borrado.';

alter table public.deletion_log enable row level security;
-- Sin politicas: inalcanzable salvo por service_role.


-- -----------------------------------------------------------------------------
-- Art. 15 (acceso) y art. 20 (portabilidad)
--
-- Devuelve todo lo que el sistema guarda del usuario en un formato estructurado
-- y legible por maquina, que es exactamente lo que exige el art. 20.1.
--
-- Al anadir una tabla nueva al esquema, hay que anadirla tambien aqui.
-- -----------------------------------------------------------------------------

create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user_id uuid := auth.uid();
  v_result  jsonb;
begin
  if v_user_id is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'exportado_en', now(),
    'formato',      'reset-alfa/v1',
    'usuario', (
      select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at)
      from auth.users u where u.id = v_user_id
    ),
    'perfil',         (select to_jsonb(p) from public.profiles p where p.user_id = v_user_id),
    'consentimientos',(select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]'::jsonb)
                       from public.consents c where c.user_id = v_user_id),
    'rachas',         (select coalesce(jsonb_agg(to_jsonb(s) order by s.fecha_inicio), '[]'::jsonb)
                       from public.streaks s where s.user_id = v_user_id),
    'checkins',       (select coalesce(jsonb_agg(to_jsonb(ch) order by ch.fecha), '[]'::jsonb)
                       from public.checkins ch where ch.user_id = v_user_id),
    'recaidas',       (select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at), '[]'::jsonb)
                       from public.relapses r where r.user_id = v_user_id),
    'progreso',       (select coalesce(jsonb_agg(to_jsonb(pr)), '[]'::jsonb)
                       from public.progress pr where pr.user_id = v_user_id),
    'permisos',       (select coalesce(jsonb_agg(to_jsonb(e)), '[]'::jsonb)
                       from public.entitlements e where e.user_id = v_user_id),
    'notificaciones', (select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at), '[]'::jsonb)
                       from public.notifications n where n.user_id = v_user_id)
  ) into v_result;

  return v_result;
end;
$$;

comment on function public.export_my_data() is
  'Arts. 15 y 20 RGPD. Exporta todos los datos del usuario autenticado en JSON. '
  'ACTUALIZAR al anadir tablas con datos personales.';

revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;


-- -----------------------------------------------------------------------------
-- Art. 17 (supresion)
--
-- Borrado real, no marcado como inactivo. Al eliminar la fila de `auth.users`
-- todas las tablas caen por ON DELETE CASCADE, que es la razon por la que cada
-- tabla con datos personales referencia auth.users con esa clausula.
--
-- La funcion se ejecuta con los privilegios de su propietario para poder tocar
-- el esquema `auth`. Si en el proyecto alojado faltasen privilegios, la via
-- alternativa es el endpoint admin (auth.admin.deleteUser) desde el servidor
-- con la service_role key; ver docs/gdpr-registro-tratamiento.md.
-- -----------------------------------------------------------------------------

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  insert into public.deletion_log (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  -- Dispara el borrado en cascada de todo el esquema public.
  delete from auth.users where id = v_user_id;
end;
$$;

comment on function public.delete_my_account() is
  'Art. 17 RGPD. Borrado real e irreversible de la cuenta y de todos sus datos '
  'via ON DELETE CASCADE.';

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
