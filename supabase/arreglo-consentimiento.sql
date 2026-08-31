-- =============================================================================
-- RESET ALFA - ARREGLO: GUARDAR EL CONSENTIMIENTO POR RPC
--
-- QUE ARREGLA
-- Al pulsar "Acepto, empezar el protocolo" salia "No hemos podido guardar tu
-- decision". La app insertaba directamente en reset_alfa.consents, y esa
-- insercion depende de tres cosas que en un proyecto compartido fallan solas:
--
--   1. Que el esquema reset_alfa este expuesto en PostgREST.
--   2. Que el rol `authenticated` conserve el INSERT sobre la tabla.
--   3. Que exista fila en profiles (aqui no hay trigger sobre auth.users, asi
--      que el perfil se crea de forma perezosa desde los RPC).
--
-- Esta funcion es SECURITY DEFINER: se ejecuta con los permisos del dueno del
-- esquema, crea el perfil si falta y escribe la fila. Deja de depender de los
-- privilegios del cliente. Sigue siendo imposible consentir por otro: el
-- user_id no es un parametro, sale de auth.uid().
--
-- Es idempotente. Se puede ejecutar tantas veces como haga falta.
--
-- ORDEN DE EJECUCION DE LOS FICHEROS:
--   1) instalacion-esquema-aislado.sql
--   2) contenido-real.sql
--   3) admin-editores.sql        (opcional)
--   4) arreglo-consentimiento.sql   <-- este
-- =============================================================================

create or replace function reset_alfa.dar_consentimiento(
  p_tipo      text,
  p_concedido boolean,
  p_version   text,
  p_origen    text default 'web')
returns jsonb language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
declare
  v_user uuid := auth.uid();
  v_id   uuid;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  if p_version is null or char_length(trim(p_version)) = 0 then
    raise exception 'Falta la version de la politica' using errcode = '22023';
  end if;

  -- El origen llega del cliente, asi que se normaliza en vez de confiar en el.
  if p_origen is null or p_origen not in ('app', 'web') then
    p_origen := 'web';
  end if;

  perform reset_alfa_priv.asegurar_perfil(v_user);

  -- Solo se INSERTA; nunca se modifica una fila anterior. Revocar es insertar
  -- concedido = false. El historial completo es la prueba del art. 7.1 RGPD, y
  -- un registro que se puede alterar no acredita nada.
  insert into reset_alfa.consents
    (user_id, tipo, concedido, version_politica, origen)
  values
    (v_user, p_tipo::reset_alfa.consent_tipo, p_concedido, trim(p_version), p_origen)
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'tipo', p_tipo,
    'concedido', p_concedido,
    'guardado', true);
end $$;

revoke all on function reset_alfa.dar_consentimiento(text, boolean, text, text)
  from public, anon;
grant execute on function reset_alfa.dar_consentimiento(text, boolean, text, text)
  to authenticated;


-- -----------------------------------------------------------------------------
-- Red de seguridad: si un GRANT masivo anterior dejo la tabla sin INSERT para
-- `authenticated`, se devuelve. La RLS sigue siendo la que manda.
-- -----------------------------------------------------------------------------
grant select, insert on reset_alfa.consents to authenticated;
revoke insert, update, delete on reset_alfa.consents from anon;


-- -----------------------------------------------------------------------------
-- COMPROBACION. Deberia devolver una fila con las cuatro columnas en true.
-- -----------------------------------------------------------------------------
select
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'reset_alfa' and p.proname = 'dar_consentimiento') = 1
    as funcion_creada,
  has_function_privilege('authenticated',
    'reset_alfa.dar_consentimiento(text, boolean, text, text)', 'execute')
    as puede_ejecutarla,
  has_table_privilege('authenticated', 'reset_alfa.consents', 'insert')
    as puede_insertar,
  (select count(*) from pg_policies
    where schemaname = 'reset_alfa' and tablename = 'consents') >= 2
    as tiene_politicas;
