-- =============================================================================
-- PRUEBAS DE AISLAMIENTO RLS
--
-- Ejecutar contra la instancia LOCAL despues de `supabase db reset`:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--        -v ON_ERROR_STOP=1 -f supabase/tests/rls.test.sql
--
-- Simula usuarios reales fijando el rol `authenticated` y el claim `sub` del
-- JWT, que es exactamente de donde lee auth.uid(). Si alguna asercion falla, el
-- script aborta con error.
--
-- Estas pruebas son el control mas importante de la Fase 1: son los datos del
-- art. 9 RGPD los que estan detras de estas politicas.
-- =============================================================================

\set ON_ERROR_STOP on
\timing off

-- -----------------------------------------------------------------------------
-- Preparacion: dos usuarios. El trigger on_auth_user_created crea sus perfiles.
-- -----------------------------------------------------------------------------

delete from auth.users
where id in ('11111111-1111-4111-8111-111111111111',
             '22222222-2222-4222-8222-222222222222');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values
  ('00000000-0000-0000-0000-000000000000',
   '11111111-1111-4111-8111-111111111111',
   'authenticated', 'authenticated', 'guerrero-a@test.local', 'x',
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Guerrero A"}'),
  ('00000000-0000-0000-0000-000000000000',
   '22222222-2222-4222-8222-222222222222',
   'authenticated', 'authenticated', 'guerrero-b@test.local', 'x',
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Guerrero B"}');


-- Datos de partida, creados como `postgres` (salta RLS a proposito: es lo que
-- hara el RPC `security definer` de la Fase 2).
insert into public.streaks (id, user_id, fecha_inicio, dias_actuales, activa) values
  ('33333333-3333-4333-8333-333333333331', '11111111-1111-4111-8111-111111111111', current_date - 5, 5, true),
  ('33333333-3333-4333-8333-333333333332', '22222222-2222-4222-8222-222222222222', current_date - 3, 3, true);

insert into public.checkins (id, user_id, streak_id, fecha, estado) values
  ('44444444-4444-4444-8444-444444444441', '11111111-1111-4111-8111-111111111111',
   '33333333-3333-4333-8333-333333333331', current_date - 1, 'en_racha'),
  ('44444444-4444-4444-8444-444444444442', '11111111-1111-4111-8111-111111111111',
   '33333333-3333-4333-8333-333333333331', current_date, 'recaida'),
  ('44444444-4444-4444-8444-444444444443', '22222222-2222-4222-8222-222222222222',
   '33333333-3333-4333-8333-333333333332', current_date, 'en_racha');


-- =============================================================================
-- 1 · El perfil de otro usuario es invisible
-- =============================================================================

set role authenticated;
set request.jwt.claims to '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

do $$
declare v_total int; v_propios int;
begin
  select count(*) into v_total from public.profiles;
  select count(*) into v_propios from public.profiles
    where user_id = '11111111-1111-4111-8111-111111111111';

  assert v_total = 1,   format('profiles: A ve %s filas, deberia ver 1', v_total);
  assert v_propios = 1, 'profiles: A no ve su propio perfil';
  raise notice 'OK 1 · profiles aislado';
end $$;


-- =============================================================================
-- 2 · Los check-ins y las rachas ajenas son invisibles
-- =============================================================================

do $$
declare v_checkins int; v_streaks int;
begin
  select count(*) into v_checkins from public.checkins;
  select count(*) into v_streaks  from public.streaks;

  assert v_checkins = 2, format('checkins: A ve %s filas, deberia ver 2', v_checkins);
  assert v_streaks  = 1, format('streaks: A ve %s filas, deberia ver 1', v_streaks);
  raise notice 'OK 2 · checkins y streaks aislados';
end $$;


-- =============================================================================
-- 3 · El cliente no puede escribir check-ins ni rachas
--     (deben pasar por el RPC atomico de la Fase 2)
-- =============================================================================

-- Nota sobre como se comporta la RLS aqui, que no es simetrico:
--   · INSERT sin politica  -> error 42501 (insufficient_privilege).
--   · UPDATE/DELETE sin politica -> NO hay error: sencillamente ninguna fila
--     resulta visible para la operacion y se modifican 0 filas.
-- Por eso la denegacion de escritura se comprueba contando filas afectadas y
-- releyendo el valor, no esperando una excepcion.

do $$
declare v_afectadas int; v_dias int;
begin
  begin
    insert into public.checkins (user_id, fecha, estado)
    values ('11111111-1111-4111-8111-111111111111', current_date - 10, 'en_racha');
    raise exception 'FALLO 3a: el cliente ha podido insertar un check-in directamente';
  exception when insufficient_privilege then
    null;
  end;

  update public.streaks set dias_actuales = 500
  where user_id = '11111111-1111-4111-8111-111111111111';
  get diagnostics v_afectadas = row_count;

  assert v_afectadas = 0,
    format('FALLO 3b: el cliente ha modificado %s rachas', v_afectadas);

  select dias_actuales into v_dias from public.streaks
  where user_id = '11111111-1111-4111-8111-111111111111';
  assert v_dias = 5, format('FALLO 3c: la racha vale %s, deberia seguir en 5', v_dias);

  delete from public.checkins
  where user_id = '11111111-1111-4111-8111-111111111111';
  get diagnostics v_afectadas = row_count;
  assert v_afectadas = 0,
    format('FALLO 3d: el cliente ha borrado %s check-ins', v_afectadas);

  raise notice 'OK 3 · escritura de rachas y check-ins bloqueada para el cliente';
end $$;


-- =============================================================================
-- 4 · El usuario no puede falsear sus propias estadisticas
-- =============================================================================

do $$
begin
  -- Lo permitido: sus datos de perfil.
  update public.profiles set nombre = 'Guerrero A renombrado'
  where user_id = '11111111-1111-4111-8111-111111111111';

  begin
    update public.profiles set record_personal = 999
    where user_id = '11111111-1111-4111-8111-111111111111';
    raise exception 'FALLO 4: el usuario ha podido escribir su record_personal';
  exception when insufficient_privilege then
    null;
  end;

  raise notice 'OK 4 · columnas de estadisticas protegidas por GRANT';
end $$;


-- =============================================================================
-- 5 · art. 9 RGPD: sin consentimiento explicito no se guarda la recaida
-- =============================================================================

do $$
begin
  begin
    insert into public.relapses (user_id, checkin_id, lugar, trigger)
    values ('11111111-1111-4111-8111-111111111111',
            '44444444-4444-4444-8444-444444444442', 'casa', 'aburrimiento');
    raise exception 'FALLO 5: se ha guardado una recaida sin consentimiento';
  exception when insufficient_privilege then
    null;
  end;
  raise notice 'OK 5 · insercion bloqueada sin consentimiento explicito';
end $$;


-- =============================================================================
-- 6 · Con consentimiento si se guarda, y sigue siendo privada
-- =============================================================================

do $$
begin
  insert into public.consents (user_id, tipo, concedido, version_politica, origen)
  values ('11111111-1111-4111-8111-111111111111', 'datos_sensibles', true, '2026-07-30', 'app');

  insert into public.relapses (user_id, checkin_id, lugar, trigger, ejecuto_pad)
  values ('11111111-1111-4111-8111-111111111111',
          '44444444-4444-4444-8444-444444444442', 'casa', 'aburrimiento', false);

  raise notice 'OK 6 · recaida guardada con consentimiento vigente';
end $$;


-- =============================================================================
-- 7 · El usuario B no alcanza los datos sensibles de A
-- =============================================================================

set request.jwt.claims to '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

do $$
declare v_relapses int; v_checkins int; v_consents int;
begin
  select count(*) into v_relapses from public.relapses;
  select count(*) into v_checkins from public.checkins;
  select count(*) into v_consents from public.consents;

  assert v_relapses = 0, format('FUGA GRAVE: B ve %s recaidas de A', v_relapses);
  assert v_checkins = 1, format('checkins: B ve %s filas, deberia ver 1', v_checkins);
  assert v_consents = 0, format('consents: B ve %s filas ajenas', v_consents);
  raise notice 'OK 7 · datos del art. 9 aislados entre usuarios';
end $$;


-- =============================================================================
-- 8 · El paywall vive en la base de datos, no en la interfaz
-- =============================================================================

do $$
declare v_gratis int; v_premium int;
begin
  select count(*) into v_gratis from public.lessons l
    join public.courses c on c.id = l.course_id where c.tipo = 'gratis';
  select count(*) into v_premium from public.lessons l
    join public.courses c on c.id = l.course_id where c.tipo = 'premium';

  assert v_gratis  > 0, 'lessons: no se ven las lecciones gratuitas';
  assert v_premium = 0, format('FUGA: se ven %s lecciones premium sin permiso', v_premium);
  raise notice 'OK 8 · lecciones premium ocultas sin entitlement';
end $$;


-- =============================================================================
-- 9 · El usuario no puede regalarse un permiso
-- =============================================================================

do $$
begin
  begin
    insert into public.entitlements (user_id, product_id, origen)
    values ('22222222-2222-4222-8222-222222222222',
            'b0000000-0000-4000-8000-000000000003', 'manual');
    raise exception 'FALLO 9: el usuario ha podido concederse un permiso';
  exception when insufficient_privilege then
    null;
  end;
  raise notice 'OK 9 · entitlements no escribibles por el cliente';
end $$;


-- =============================================================================
-- 10 · Con permiso concedido por el servidor, el contenido se desbloquea
-- =============================================================================

reset role;
reset request.jwt.claims;

insert into public.entitlements (user_id, product_id, origen, activo)
values ('22222222-2222-4222-8222-222222222222',
        'b0000000-0000-4000-8000-000000000003', 'manual', true);

set role authenticated;
set request.jwt.claims to '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

do $$
declare v_programa int; v_mastermind int;
begin
  select count(*) into v_programa from public.lessons l
    join public.courses c on c.id = l.course_id
    where c.product_id = 'b0000000-0000-4000-8000-000000000003';

  -- El Mastermind cuelga de OTRO producto: no debe desbloquearse en cascada.
  select count(*) into v_mastermind from public.lessons l
    join public.courses c on c.id = l.course_id
    where c.product_id = 'b0000000-0000-4000-8000-000000000004';

  assert v_programa  > 0, 'el entitlement no ha desbloqueado el programa';
  assert v_mastermind = 0, 'FUGA: un permiso ha desbloqueado un producto distinto';
  raise notice 'OK 10 · desbloqueo correcto y acotado al producto comprado';
end $$;


-- =============================================================================
-- 11 · Usuario anonimo: solo contenido publico y publicado
-- =============================================================================

reset role;
reset request.jwt.claims;
set role anon;

do $$
declare v_articles int; v_drafts int; v_profiles int; v_relapses int;
        v_products int; v_topics int; v_lessons int;
begin
  select count(*) into v_articles from public.articles;
  select count(*) into v_drafts   from public.articles where estado <> 'publicado';
  select count(*) into v_profiles from public.profiles;
  select count(*) into v_relapses from public.relapses;
  select count(*) into v_products from public.products;
  select count(*) into v_topics   from public.topic_bank;
  select count(*) into v_lessons  from public.lessons;

  assert v_articles = 1, format('anon ve %s articulos, deberia ver 1 publicado', v_articles);
  assert v_drafts   = 0, 'FUGA: anon ve articulos en borrador';
  assert v_profiles = 0, 'FUGA GRAVE: anon ve perfiles';
  assert v_relapses = 0, 'FUGA GRAVE: anon ve registros de recaida';
  assert v_products > 0, 'anon no ve el catalogo publico';
  assert v_topics   = 0, 'FUGA: anon ve el banco de temas';
  assert v_lessons  = 0, 'FUGA: anon ve lecciones sin cuenta';
  raise notice 'OK 11 · anon limitado a contenido publico';
end $$;


-- =============================================================================
-- 12 · art. 15 y 20 RGPD: exportacion de datos
-- =============================================================================

reset role;
set role authenticated;
set request.jwt.claims to '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

do $$
declare v_export jsonb;
begin
  v_export := public.export_my_data();

  assert v_export ->> 'formato' = 'reset-alfa/v1', 'export: formato incorrecto';
  assert v_export -> 'perfil' ->> 'user_id' = '11111111-1111-4111-8111-111111111111',
    'export: no incluye el perfil del usuario';
  assert jsonb_array_length(v_export -> 'recaidas') = 1,
    'export: no incluye los registros de recaida';
  assert jsonb_array_length(v_export -> 'consentimientos') = 1,
    'export: no incluye el historico de consentimientos';
  assert jsonb_array_length(v_export -> 'checkins') = 2,
    'export: no incluye los check-ins';

  raise notice 'OK 12 · export_my_data completo (arts. 15 y 20 RGPD)';
end $$;


-- =============================================================================
-- 13 · art. 17 RGPD: borrado real desde el RPC
-- =============================================================================

set request.jwt.claims to '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

do $$
begin
  perform public.delete_my_account();
end $$;

reset role;
reset request.jwt.claims;

do $$
declare v_users int; v_profiles int; v_entitlements int; v_log int;
begin
  select count(*) into v_users from auth.users
    where id = '22222222-2222-4222-8222-222222222222';
  select count(*) into v_profiles from public.profiles
    where user_id = '22222222-2222-4222-8222-222222222222';
  select count(*) into v_entitlements from public.entitlements
    where user_id = '22222222-2222-4222-8222-222222222222';
  select count(*) into v_log from public.deletion_log
    where user_id = '22222222-2222-4222-8222-222222222222';

  assert v_users = 0,        'FALLO: la cuenta sigue existiendo tras delete_my_account';
  assert v_profiles = 0,     'FALLO: el perfil ha sobrevivido al borrado';
  assert v_entitlements = 0, 'FALLO: los permisos han sobrevivido al borrado';
  assert v_log = 1,          'FALLO: no queda constancia de la supresion';

  raise notice 'OK 13 · delete_my_account borra de verdad (art. 17 RGPD)';
end $$;


-- =============================================================================
-- Limpieza
-- =============================================================================

reset role;
reset request.jwt.claims;

delete from auth.users
where id in ('11111111-1111-4111-8111-111111111111',
             '22222222-2222-4222-8222-222222222222');

do $$
declare v_huerfanas int;
begin
  select count(*) into v_huerfanas from public.relapses;
  assert v_huerfanas = 0,
    format('FALLO: quedan %s recaidas tras borrar el usuario. El CASCADE no funciona '
           'y el art. 17 RGPD no se cumple.', v_huerfanas);
  raise notice 'OK 14 · borrado en cascada verificado (art. 17 RGPD)';
end $$;

\echo ''
\echo '================================================='
\echo ' TODAS LAS PRUEBAS DE RLS HAN PASADO'
\echo '================================================='
