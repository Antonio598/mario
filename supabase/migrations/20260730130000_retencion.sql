-- =============================================================================
-- 0013 · RETENCION  (Fase 5)
--
-- Patrones de disparadores, insignias por hitos y cola de notificaciones push.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Tokens de push
--
-- Un usuario puede tener varios dispositivos. La clave unica es el token, no el
-- usuario: si alguien reinstala la app o cambia de movil, el token viejo deja
-- de existir y hay que poder desactivarlo sin tocar el resto.
-- -----------------------------------------------------------------------------

create table public.push_tokens (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  token      text        not null unique,
  plataforma text        not null check (plataforma in ('ios', 'android')),
  activo     boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_idx on public.push_tokens (user_id) where activo;

create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row execute function app.set_updated_at();

alter table public.push_tokens enable row level security;

create policy "push_tokens_select_own" on public.push_tokens
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "push_tokens_insert_own" on public.push_tokens
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "push_tokens_update_own" on public.push_tokens
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "push_tokens_delete_own" on public.push_tokens
  for delete to authenticated using ((select auth.uid()) = user_id);


-- -----------------------------------------------------------------------------
-- Encolar el push del articulo diario
--
-- Crea una notificacion por usuario con push consentido. El envio real lo hace
-- n8n leyendo las pendientes; separar encolado de envio permite reintentar sin
-- duplicar y respetar la zona horaria de cada usuario.
--
-- CONSENTIMIENTO: solo se encola para quien lo dio. `has_consent` devuelve
-- false si no hay registro, asi que el silencio nunca cuenta como un si.
-- -----------------------------------------------------------------------------

create or replace function public.encolar_push_articulo(p_article_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_articulo public.articles%rowtype;
  v_creadas  integer;
begin
  select * into v_articulo from public.articles where id = p_article_id;

  if not found or v_articulo.estado <> 'publicado' then
    raise exception 'El articulo no existe o no esta publicado' using errcode = '22023';
  end if;

  insert into public.notifications (user_id, tipo, titulo, cuerpo, deeplink)
  select
    p.user_id,
    'articulo_diario',
    v_articulo.titulo,
    coalesce(v_articulo.meta_description, 'Nuevo articulo disponible'),
    '/articulos/' || v_articulo.slug
  from public.profiles p
  where app.has_consent(p.user_id, 'push')
    -- Idempotencia: si el workflow reintenta, no se envia dos veces lo mismo.
    and not exists (
      select 1 from public.notifications n
      where n.user_id = p.user_id
        and n.tipo = 'articulo_diario'
        and n.deeplink = '/articulos/' || v_articulo.slug
    );

  get diagnostics v_creadas = row_count;
  return v_creadas;
end;
$$;

revoke all on function public.encolar_push_articulo(uuid) from public, anon, authenticated;
-- Solo service_role (n8n). Ningun usuario puede provocar un envio masivo.


-- -----------------------------------------------------------------------------
-- Patrones de disparadores
--
-- Es la funcion de valor de la Fase 5: devolver al usuario lo que sus propios
-- registros dicen de el. Agrupa por disparador, lugar, franja horaria y dia de
-- la semana.
--
-- MINIMO DE 3 REGISTROS. Con uno o dos, cualquier coincidencia es ruido, y
-- presentar ruido como "tu patron" es peor que no decir nada: el usuario toma
-- decisiones sobre una casualidad.
--
-- SECURITY INVOKER a proposito, no DEFINER: opera sobre datos del art. 9 y
-- debe pasar por la RLS, de modo que sea imposible por construccion consultar
-- los patrones de otra persona.
-- -----------------------------------------------------------------------------

create or replace function public.patrones_recaidas()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_total integer;
begin
  select count(*) into v_total from public.relapses;

  if v_total < 3 then
    return jsonb_build_object(
      'suficientes_datos', false,
      'registros', v_total,
      'mensaje', 'Necesitas al menos 3 registros para que los patrones signifiquen algo.'
    );
  end if;

  return jsonb_build_object(
    'suficientes_datos', true,
    'registros', v_total,

    'disparadores', coalesce((
      select jsonb_agg(x) from (
        select lower(trim(trigger)) as valor, count(*) as veces
        from public.relapses
        where trigger is not null and trim(trigger) <> ''
        group by 1 order by 2 desc limit 5
      ) x
    ), '[]'::jsonb),

    'lugares', coalesce((
      select jsonb_agg(x) from (
        select lower(trim(lugar)) as valor, count(*) as veces
        from public.relapses
        where lugar is not null and trim(lugar) <> ''
        group by 1 order by 2 desc limit 5
      ) x
    ), '[]'::jsonb),

    -- Franjas anchas en vez de la hora exacta: "por la noche" es accionable,
    -- "a las 23:41" no lo es.
    'franjas', coalesce((
      select jsonb_agg(x) from (
        select
          case
            when extract(hour from hora) between 5  and 11 then 'manana'
            when extract(hour from hora) between 12 and 17 then 'tarde'
            when extract(hour from hora) between 18 and 22 then 'noche'
            else 'madrugada'
          end as valor,
          count(*) as veces
        from public.relapses
        where hora is not null
        group by 1 order by 2 desc
      ) x
    ), '[]'::jsonb),

    'dias_semana', coalesce((
      select jsonb_agg(x) from (
        select
          to_char(c.fecha, 'TMDay') as valor,
          count(*) as veces
        from public.relapses r
        join public.checkins c on c.id = r.checkin_id
        group by 1 order by 2 desc limit 3
      ) x
    ), '[]'::jsonb),

    -- Dato duro y util: cuantas veces el P.A.D no llego a ejecutarse. Si el
    -- problema es que no se aplica, cambiar su contenido no arregla nada.
    'pad_no_ejecutado', (
      select count(*) from public.relapses where ejecuto_pad = false
    )
  );
end;
$$;

revoke all on function public.patrones_recaidas() from public, anon;
grant execute on function public.patrones_recaidas() to authenticated;

comment on function public.patrones_recaidas() is
  'Patrones sobre los propios registros. SECURITY INVOKER: pasa por la RLS, de '
  'modo que es imposible consultar los patrones de otro usuario.';
