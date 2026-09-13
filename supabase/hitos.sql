-- =============================================================================
-- RESET ALFA - HITOS VISTOS
--
-- La app muestra una pantalla especial -video y llamada a la accion- al
-- llegar a 7 y a 30 dias de racha. Cada una se ensena UNA vez. Aqui se
-- recuerda cuales ha visto ya el usuario, en el servidor y no en el
-- navegador: cambiar de telefono no puede volver a mostrar la celebracion de
-- los 7 dias a quien va por 40.
--
-- Escritura por RPC, security definer, perfil asegurado. Idempotente.
--
-- ORDEN: despues de premium-2-suscripcion.sql.
-- =============================================================================

alter table reset_alfa.profiles
  add column if not exists hitos_vistos text[] not null default '{}';

comment on column reset_alfa.profiles.hitos_vistos is
  'Claves de las pantallas de hito ya mostradas (7-dias, 30-dias...).';


create or replace function reset_alfa.marcar_hito(p_hito text)
returns jsonb language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
declare
  v_user uuid := auth.uid();
  v_hito text := nullif(trim(p_hito), '');
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  -- Solo claves conocidas: el cliente no puede rellenar la lista con basura.
  if v_hito is null or v_hito not in ('7-dias', '30-dias') then
    raise exception 'Hito desconocido' using errcode = '22023';
  end if;

  perform reset_alfa_priv.asegurar_perfil(v_user);

  -- array_append solo si no esta: llamar dos veces no duplica.
  update reset_alfa.profiles
     set hitos_vistos = case
       when v_hito = any (hitos_vistos) then hitos_vistos
       else array_append(hitos_vistos, v_hito) end
   where user_id = v_user;

  return jsonb_build_object('hito', v_hito, 'marcado', true);
end $$;

revoke all on function reset_alfa.marcar_hito(text) from public, anon;
grant execute on function reset_alfa.marcar_hito(text) to authenticated;


-- COMPROBACION. Las tres columnas deben salir en true.
select
  exists (
    select 1 from information_schema.columns
     where table_schema = 'reset_alfa' and table_name = 'profiles'
       and column_name = 'hitos_vistos') as columna_creada,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'reset_alfa' and p.proname = 'marcar_hito') = 1 as funcion_creada,
  has_function_privilege('authenticated', 'reset_alfa.marcar_hito(text)', 'execute')
    as puede_ejecutarla;
