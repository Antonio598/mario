-- =============================================================================
-- RESET ALFA - P.A.D (PROTOCOLO ANTI-DESEO)
--
-- El P.A.D es la accion concreta que el usuario ejecuta cuando aparece el
-- deseo. Se guarda una sola por usuario, en su perfil: es una decision, no un
-- historial. Cambiarla sustituye a la anterior.
--
-- La escritura va por RPC y no por UPDATE directo sobre profiles. El GRANT de
-- columnas de profiles es cerrado a proposito (nombre, avatar_url, timezone,
-- onboarding_completado) y abrirlo columna a columna desde el cliente es el
-- camino por el que acaban abriendose las que no deben. El RPC ademas asegura
-- el perfil, que en este proyecto compartido se crea de forma perezosa.
--
-- Idempotente. Se puede ejecutar tantas veces como haga falta.
--
-- ORDEN: despues de instalacion-esquema-aislado.sql.
-- =============================================================================

alter table reset_alfa.profiles
  add column if not exists pad text
  check (pad is null or char_length(pad) between 1 and 200);

comment on column reset_alfa.profiles.pad is
  'Protocolo Anti-Deseo: la accion concreta que el usuario ejecuta cuando '
  'aparece el deseo. Null hasta que la crea.';


create or replace function reset_alfa.guardar_pad(p_texto text)
returns jsonb language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
declare
  v_user  uuid := auth.uid();
  v_texto text := nullif(trim(p_texto), '');
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  if v_texto is null then
    raise exception 'El P.A.D no puede estar vacio' using errcode = '22023';
  end if;

  if char_length(v_texto) > 200 then
    raise exception 'El P.A.D no puede superar los 200 caracteres' using errcode = '22023';
  end if;

  perform reset_alfa_priv.asegurar_perfil(v_user);

  update reset_alfa.profiles set pad = v_texto where user_id = v_user;

  return jsonb_build_object('pad', v_texto, 'guardado', true);
end $$;

revoke all on function reset_alfa.guardar_pad(text) from public, anon;
grant execute on function reset_alfa.guardar_pad(text) to authenticated;


-- -----------------------------------------------------------------------------
-- COMPROBACION. Las tres columnas deben salir en true.
-- -----------------------------------------------------------------------------
select
  exists (
    select 1 from information_schema.columns
     where table_schema = 'reset_alfa' and table_name = 'profiles' and column_name = 'pad')
    as columna_creada,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'reset_alfa' and p.proname = 'guardar_pad') = 1
    as funcion_creada,
  has_function_privilege('authenticated', 'reset_alfa.guardar_pad(text)', 'execute')
    as puede_ejecutarla;
