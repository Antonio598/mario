-- =============================================================================
-- PRUEBAS DEL MOTOR DE RACHAS
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--        -v ON_ERROR_STOP=1 -f supabase/tests/streaks.test.sql
--
-- COMO SE SIMULA EL PASO DEL TIEMPO
--
-- No se puede adelantar el reloj del servidor, pero si mover al usuario de
-- zona horaria. Pacific/Midway (UTC-11) y Pacific/Kiritimati (UTC+14) estan
-- separadas 25 horas, asi que su fecha local difiere SIEMPRE en exactamente un
-- dia, sea cual sea la hora UTC a la que se ejecuten las pruebas. Ninguna de
-- las dos aplica horario de verano.
--
-- Cambiar entre ellas ejercita a la vez las dos condiciones del criterio de
-- aceptacion: el cruce de medianoche y el cambio de zona horaria.
-- =============================================================================

\set ON_ERROR_STOP on

delete from auth.users where id = '55555555-5555-4555-8555-555555555555';

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000000',
  '55555555-5555-4555-8555-555555555555',
  'authenticated', 'authenticated', 'racha@test.local', 'x',
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Guerrero Racha"}'
);

-- Punto de partida: el usuario vive en el extremo oriental de la linea de
-- cambio de fecha. Su "hoy" es el mas atrasado posible.
update public.profiles set timezone = 'Pacific/Midway'
where user_id = '55555555-5555-4555-8555-555555555555';

set role authenticated;
set request.jwt.claims to '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}';


-- =============================================================================
-- 1 · Primer check-in: crea la racha y la cuenta como dia 1
-- =============================================================================

do $$
declare v_r jsonb;
begin
  v_r := public.estado_diario();
  assert (v_r ->> 'necesita_checkin')::boolean, 'un usuario nuevo deberia necesitar check-in';
  assert (v_r ->> 'racha_actual')::int = 0, 'sin racha iniciada deberia marcar 0';

  v_r := public.registrar_checkin();

  assert (v_r ->> 'registrado')::boolean, 'el primer check-in deberia registrarse';
  assert (v_r ->> 'racha_actual')::int = 1,
    format('el primer dia deberia ser el dia 1, no %s', v_r ->> 'racha_actual');
  assert (v_r ->> 'dias_totales')::int = 1, 'dias_totales deberia ser 1';
  assert not (v_r ->> 'necesita_checkin')::boolean, 'ya no deberia pedir check-in hoy';

  raise notice 'OK 1 · primer check-in: racha en dia 1';
end $$;


-- =============================================================================
-- 2 · Idempotencia: un segundo toque el mismo dia no suma
-- =============================================================================

do $$
declare v_r jsonb;
begin
  v_r := public.registrar_checkin();

  assert not (v_r ->> 'registrado')::boolean, 'no deberia registrar dos veces el mismo dia';
  assert v_r ->> 'motivo' = 'ya_registrado', 'el motivo deberia ser ya_registrado';
  assert (v_r ->> 'dias_totales')::int = 1,
    format('dias_totales se ha inflado a %s con un doble toque', v_r ->> 'dias_totales');

  raise notice 'OK 2 · doble check-in el mismo dia no suma';
end $$;


-- =============================================================================
-- 3 · Cruce de medianoche: al dia siguiente vuelve a pedir check-in y suma
-- =============================================================================

reset role;
update public.profiles set timezone = 'Pacific/Kiritimati'   -- +1 dia local
where user_id = '55555555-5555-4555-8555-555555555555';
set role authenticated;

do $$
declare v_r jsonb;
begin
  v_r := public.estado_diario();
  assert (v_r ->> 'necesita_checkin')::boolean,
    'tras cruzar medianoche deberia volver a pedir check-in';

  v_r := public.registrar_checkin();

  assert (v_r ->> 'registrado')::boolean, 'el check-in del dia siguiente deberia registrarse';
  assert (v_r ->> 'racha_actual')::int = 2,
    format('la racha deberia ir por 2 dias, va por %s', v_r ->> 'racha_actual');
  assert (v_r ->> 'dias_totales')::int = 2, 'dias_totales deberia ser 2';
  assert (v_r ->> 'record_personal')::int = 2, 'el record deberia haberse actualizado a 2';

  raise notice 'OK 3 · cruce de medianoche: la racha avanza a 2 dias';
end $$;


-- =============================================================================
-- 4 · Viaje hacia atras: la fecha local retrocede a un dia ya registrado
--
-- El usuario vuela hacia el este y su "hoy" vuelve a ser el dia anterior. No
-- debe volver a preguntarsele, ni perderse ni duplicarse nada.
-- =============================================================================

reset role;
update public.profiles set timezone = 'Pacific/Midway'
where user_id = '55555555-5555-4555-8555-555555555555';
set role authenticated;

do $$
declare v_r jsonb;
begin
  v_r := public.estado_diario();
  assert not (v_r ->> 'necesita_checkin')::boolean,
    'al retroceder de fecha no deberia volver a pedir check-in de un dia ya hecho';

  v_r := public.registrar_checkin();
  assert not (v_r ->> 'registrado')::boolean, 'no deberia registrar nada';
  assert (v_r ->> 'dias_totales')::int = 2,
    format('viajar no debe alterar el total (%s)', v_r ->> 'dias_totales');

  raise notice 'OK 4 · retroceso de fecha por viaje: sin duplicados ni perdidas';
end $$;


-- =============================================================================
-- 5 · Un dia sin registro NO rompe la racha
--
-- Se reescribe el historial para simular un hueco: racha iniciada hace 5 dias,
-- con solo dos check-ins. El contador debe seguir midiendo dias naturales.
-- =============================================================================

reset role;
reset request.jwt.claims;

delete from public.checkins where user_id = '55555555-5555-4555-8555-555555555555';
delete from public.streaks  where user_id = '55555555-5555-4555-8555-555555555555';
update public.profiles
   set timezone = 'Pacific/Midway', dias_totales = 0, record_personal = 0
 where user_id = '55555555-5555-4555-8555-555555555555';

-- Racha empezada hace 5 dias (en la fecha local del usuario, no en UTC).
insert into public.streaks (user_id, fecha_inicio, dias_actuales, activa)
values (
  '55555555-5555-4555-8555-555555555555',
  app.today_for_user('55555555-5555-4555-8555-555555555555') - 5,
  5, true
);

set role authenticated;
set request.jwt.claims to '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}';

do $$
declare v_r jsonb;
begin
  v_r := public.registrar_checkin();

  -- Del dia -5 al dia de hoy, ambos incluidos, son 6 dias naturales, aunque
  -- solo se haya marcado uno.
  assert (v_r ->> 'racha_actual')::int = 6,
    format('la racha deberia contar 6 dias naturales, cuenta %s', v_r ->> 'racha_actual');
  assert (v_r ->> 'dias_totales')::int = 1,
    format('dias_totales cuenta check-ins, deberia ser 1 y es %s', v_r ->> 'dias_totales');

  raise notice 'OK 5 · los dias sin registro no rompen la racha y siguen contando';
end $$;


-- =============================================================================
-- 6 · Sin consentimiento del art. 9: la recaida se registra, el detalle no
--
-- Negarse a ceder datos sobre la propia vida sexual no puede impedir usar la
-- app (art. 7.4 RGPD).
-- =============================================================================

do $$
declare v_r jsonb;
begin
  v_r := public.guardar_recaida(
    p_lugar   => 'casa',
    p_trigger => 'aburrimiento'
  );

  assert (v_r ->> 'registrado')::boolean, 'la recaida deberia registrarse igualmente';
  assert not (v_r ->> 'detalle_guardado')::boolean,
    'el detalle sensible NO deberia guardarse sin consentimiento';
  assert (v_r ->> 'racha_anterior')::int = 5,
    format('la racha cerrada deberia medir 5 dias (hasta ayer), mide %s',
           v_r ->> 'racha_anterior');
  assert (v_r ->> 'racha_actual')::int = 0,
    'la racha nueva deberia empezar manana y marcar 0';
  assert (v_r ->> 'record_personal')::int = 5, 'el record deberia consolidarse en 5';

  raise notice 'OK 6 · recaida sin consentimiento: check-in si, detalle no';
end $$;


-- =============================================================================
-- 7 · El dia de la recaida queda marcado en el calendario
-- =============================================================================

do $$
declare v_cal jsonb; v_hoy date;
begin
  v_hoy := app.today_for_user('55555555-5555-4555-8555-555555555555');

  v_cal := public.calendario_mes(
    extract(year from v_hoy)::int,
    extract(month from v_hoy)::int
  );

  assert jsonb_array_length(v_cal) > 0, 'el calendario del mes deberia traer dias';
  assert exists (
    select 1 from jsonb_array_elements(v_cal) d
    where (d ->> 'fecha')::date = v_hoy and d ->> 'estado' = 'recaida'
  ), 'el dia de hoy deberia aparecer como recaida en el calendario';

  raise notice 'OK 7 · la recaida aparece marcada en el calendario';
end $$;


-- =============================================================================
-- 8 · Con consentimiento, el detalle si se guarda
-- =============================================================================

do $$
declare v_r jsonb; v_detalle public.relapses%rowtype;
begin
  insert into public.consents (user_id, tipo, concedido, version_politica, origen)
  values ('55555555-5555-4555-8555-555555555555', 'datos_sensibles', true, '2026-07-30', 'app');

  -- Mismo dia: ya existe el check-in de recaida, se actualiza el detalle.
  v_r := public.guardar_recaida(
    p_lugar              => 'salon',
    p_trigger            => 'aburrimiento nocturno',
    p_accion_correctiva  => 'dejar el movil fuera del dormitorio',
    p_ejecuto_pad        => false,
    p_motivo_fallo       => 'no lo recorde',
    p_contexto_emocional => 'cansancio'
  );

  assert (v_r ->> 'detalle_guardado')::boolean, 'con consentimiento deberia guardarse el detalle';

  select * into v_detalle from public.relapses
  where user_id = '55555555-5555-4555-8555-555555555555';

  assert v_detalle.lugar = 'salon', 'el lugar no se ha guardado';
  assert v_detalle.ejecuto_pad = false, 'ejecuto_pad no se ha guardado';

  raise notice 'OK 8 · con consentimiento el detalle se guarda';
end $$;


-- =============================================================================
-- 9 · Solo puede haber una racha activa
-- =============================================================================

do $$
declare v_activas int;
begin
  select count(*) into v_activas
  from public.streaks
  where user_id = '55555555-5555-4555-8555-555555555555' and activa;

  assert v_activas = 1, format('hay %s rachas activas, deberia haber exactamente 1', v_activas);

  raise notice 'OK 9 · una unica racha activa tras la recaida';
end $$;


-- =============================================================================
-- 10 · El cliente sigue sin poder escribir directamente
-- =============================================================================

do $$
declare v_afectadas int;
begin
  update public.streaks set dias_actuales = 999
  where user_id = '55555555-5555-4555-8555-555555555555';
  get diagnostics v_afectadas = row_count;

  assert v_afectadas = 0,
    'los RPC no deben haber abierto una via de escritura directa a streaks';

  raise notice 'OK 10 · la escritura directa sigue cerrada al cliente';
end $$;


-- =============================================================================
-- Limpieza
-- =============================================================================

reset role;
reset request.jwt.claims;

delete from auth.users where id = '55555555-5555-4555-8555-555555555555';

\echo ''
\echo '================================================='
\echo ' MOTOR DE RACHAS: TODAS LAS PRUEBAS HAN PASADO'
\echo '================================================='
