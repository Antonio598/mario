-- =============================================================================
-- RESET ALFA - CARTA ANTI-RECAIDA
--
-- Un mensaje que el usuario se escribe a si mismo para leerlo en el momento en
-- que aparece la tentacion. Se compone respondiendo a cinco preguntas guiadas;
-- se guardan las respuestas por separado (jsonb) y no el texto ya montado,
-- para poder editarlas una a una y componer la carta de distintas formas sin
-- perder nada.
--
-- Es contenido intimo pero NO de categoria especial del art. 9: habla de
-- motivos y de identidad, no describe la vida sexual. Por eso no pide el
-- consentimiento reforzado que si piden los registros de recaida.
--
-- Como el P.A.D: escritura solo por RPC, security definer, perfil asegurado.
-- Idempotente.
--
-- ORDEN: despues de pad.sql.
-- =============================================================================

alter table reset_alfa.profiles
  add column if not exists carta jsonb;

comment on column reset_alfa.profiles.carta is
  'Carta anti-recaida: respuestas a las preguntas guiadas, por clave. Null '
  'hasta que la escribe.';


create or replace function reset_alfa.guardar_carta(p_respuestas jsonb)
returns jsonb language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
declare
  v_user   uuid := auth.uid();
  v_claves text[] := array['motivo', 'coste', 'despues', 'futuro', 'mensaje'];
  v_clave  text;
  v_valor  text;
  v_limpia jsonb := '{}'::jsonb;
  v_llenas integer := 0;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  if p_respuestas is null or jsonb_typeof(p_respuestas) <> 'object' then
    raise exception 'La carta debe ser un objeto con las respuestas' using errcode = '22023';
  end if;

  -- Solo se conservan las claves conocidas, recortadas y con tope. Lo que no
  -- este en la lista se descarta en silencio: el cliente no decide el esquema.
  foreach v_clave in array v_claves loop
    v_valor := nullif(trim(coalesce(p_respuestas ->> v_clave, '')), '');
    if v_valor is not null then
      if char_length(v_valor) > 1000 then
        raise exception 'Cada respuesta puede tener como maximo 1000 caracteres'
          using errcode = '22023';
      end if;
      v_limpia := v_limpia || jsonb_build_object(v_clave, v_valor);
      v_llenas := v_llenas + 1;
    end if;
  end loop;

  -- Una carta vacia no es una carta. Con una sola respuesta ya vale: es
  -- preferible una linea sincera a un formulario abandonado.
  if v_llenas = 0 then
    raise exception 'La carta necesita al menos una respuesta' using errcode = '22023';
  end if;

  perform reset_alfa_priv.asegurar_perfil(v_user);

  update reset_alfa.profiles set carta = v_limpia where user_id = v_user;

  return jsonb_build_object('carta', v_limpia, 'guardado', true);
end $$;

revoke all on function reset_alfa.guardar_carta(jsonb) from public, anon;
grant execute on function reset_alfa.guardar_carta(jsonb) to authenticated;


-- -----------------------------------------------------------------------------
-- COMPROBACION. Las tres columnas deben salir en true.
-- -----------------------------------------------------------------------------
select
  exists (
    select 1 from information_schema.columns
     where table_schema = 'reset_alfa' and table_name = 'profiles' and column_name = 'carta')
    as columna_creada,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'reset_alfa' and p.proname = 'guardar_carta') = 1
    as funcion_creada,
  has_function_privilege('authenticated', 'reset_alfa.guardar_carta(jsonb)', 'execute')
    as puede_ejecutarla;
