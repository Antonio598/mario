-- =============================================================================
-- RESET ALFA - PLAN PERSONALIZADO (cuestionario de entrada)
--
-- Las respuestas del test que el usuario hace ANTES de crear la cuenta. Se
-- guardan en el perfil en cuanto existe sesion, y al guardarlas se marca
-- onboarding_completado: la app deja de mandar al usuario al test.
--
-- p_plan puede ser NULL. Es el caso de quien salta el test con sesion abierta:
-- no hay respuestas que guardar, pero el flag si tiene que ponerse.
--
-- Solo se conservan las claves conocidas. El cliente no decide el esquema.
-- Escritura por RPC, security definer, perfil asegurado. Idempotente.
--
-- ORDEN: despues de carta.sql.
-- =============================================================================

alter table reset_alfa.profiles
  add column if not exists plan jsonb;

comment on column reset_alfa.profiles.plan is
  'Respuestas del cuestionario de entrada, por clave. Null si no lo hizo o lo salto.';


create or replace function reset_alfa.guardar_plan(p_plan jsonb default null)
returns jsonb language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
declare
  v_user   uuid := auth.uid();
  v_claves text[] := array['edad', 'anios_habito', 'frecuencia_semana', 'minutos_sesion',
                           'disparador', 'coste', 'objetivo', 'intentos', 'fecha_objetivo'];
  v_clave  text;
  v_valor  jsonb;
  v_tipo   text;
  v_limpio jsonb := '{}'::jsonb;
  v_hay    boolean := false;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  if p_plan is not null then
    if jsonb_typeof(p_plan) <> 'object' then
      raise exception 'El plan debe ser un objeto' using errcode = '22023';
    end if;

    if length(p_plan::text) > 4000 then
      raise exception 'El plan es demasiado grande' using errcode = '22023';
    end if;

    -- Solo claves de la lista y solo valores escalares o listas de escalares.
    foreach v_clave in array v_claves loop
      v_valor := p_plan -> v_clave;
      if v_valor is null then continue; end if;

      v_tipo := jsonb_typeof(v_valor);
      if v_tipo in ('string', 'number', 'boolean') then
        v_limpio := v_limpio || jsonb_build_object(v_clave, v_valor);
        v_hay := true;
      elsif v_tipo = 'array' and not exists (
        select 1 from jsonb_array_elements(v_valor) e
         where jsonb_typeof(e) not in ('string', 'number', 'boolean')) then
        v_limpio := v_limpio || jsonb_build_object(v_clave, v_valor);
        v_hay := true;
      end if;
    end loop;
  end if;

  perform reset_alfa_priv.asegurar_perfil(v_user);

  -- Si no llego nada valido se conserva el plan anterior, pero el flag se
  -- pone igual. Saltar el test no puede dejar al usuario atrapado.
  update reset_alfa.profiles
     set plan = case when v_hay then v_limpio else plan end,
         onboarding_completado = true
   where user_id = v_user;

  return jsonb_build_object(
    'plan', case when v_hay then v_limpio else null end,
    'onboarding_completado', true);
end $$;

revoke all on function reset_alfa.guardar_plan(jsonb) from public, anon;
grant execute on function reset_alfa.guardar_plan(jsonb) to authenticated;


-- -----------------------------------------------------------------------------
-- COMPROBACION. Las tres columnas deben salir en true.
-- -----------------------------------------------------------------------------
select
  exists (
    select 1 from information_schema.columns
     where table_schema = 'reset_alfa' and table_name = 'profiles' and column_name = 'plan')
    as columna_creada,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'reset_alfa' and p.proname = 'guardar_plan') = 1
    as funcion_creada,
  has_function_privilege('authenticated', 'reset_alfa.guardar_plan(jsonb)', 'execute')
    as puede_ejecutarla;
