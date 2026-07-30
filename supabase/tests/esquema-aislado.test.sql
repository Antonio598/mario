-- Pruebas del aislamiento entre `public` (otra app) y `reset_alfa`.

insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111',
   'authenticated','authenticated','a@test.local','x', now(), now(), now(),
   '{"provider":"email"}', '{"full_name":"Guerrero A"}'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222',
   'authenticated','authenticated','b@test.local','x', now(), now(), now(),
   '{"provider":"email"}', '{"full_name":"Solo otra app"}');

-- 1 · La otra app sigue intacta y no se ha creado ningún perfil de Reset Alfa
--     por el simple hecho de registrarse (no hay trigger sobre auth.users).
do $$
declare v_otra int; v_ra int;
begin
  select count(*) into v_otra from public.profiles;
  select count(*) into v_ra   from reset_alfa.profiles;
  assert v_otra = 1, 'la tabla public.profiles de la otra app se ha alterado';
  assert v_ra = 0, format('se han creado %s perfiles de Reset Alfa sin usar la app', v_ra);
  raise notice 'OK 1 · sin contaminacion: registrarse no crea perfil en Reset Alfa';
end $$;

-- 2 · El perfil se crea de forma perezosa al usar la app.
set role authenticated;
set request.jwt.claims to '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

do $$
declare v_r jsonb;
begin
  v_r := reset_alfa.estado_diario();
  assert (v_r ->> 'necesita_checkin')::boolean, 'deberia pedir check-in';
  assert (v_r ->> 'racha_actual')::int = 0, 'sin racha deberia marcar 0';
  raise notice 'OK 2 · alta perezosa del perfil al usar la app';
end $$;

-- 3 · El motor de rachas funciona igual dentro del esquema.
do $$
declare v_r jsonb;
begin
  v_r := reset_alfa.registrar_checkin();
  assert (v_r ->> 'registrado')::boolean, 'el check-in deberia registrarse';
  assert (v_r ->> 'racha_actual')::int = 1, 'el primer dia deberia ser el dia 1';
  assert (v_r ->> 'dias_totales')::int = 1, 'dias_totales deberia ser 1';
  raise notice 'OK 3 · motor de rachas operativo en reset_alfa';
end $$;

-- 4 · El usuario B (solo de la otra app) sigue sin perfil aquí.
do $$
declare v_ra int;
begin
  select count(*) into v_ra from reset_alfa.profiles;
  assert v_ra = 1, format('hay %s perfiles; solo A ha usado Reset Alfa', v_ra);
  raise notice 'OK 4 · solo tiene perfil quien ha abierto Reset Alfa';
end $$;

-- 5 · Aislamiento RLS entre usuarios dentro del esquema.
set request.jwt.claims to '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
do $$
declare v_p int; v_c int;
begin
  select count(*) into v_p from reset_alfa.profiles;
  select count(*) into v_c from reset_alfa.checkins;
  assert v_p = 0, format('B ve %s perfiles ajenos', v_p);
  assert v_c = 0, format('B ve %s check-ins ajenos', v_c);
  raise notice 'OK 5 · RLS aisla usuarios dentro del esquema';
end $$;

-- 6 · La escritura directa sigue cerrada al cliente.
set request.jwt.claims to '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
-- En esta instalación el bloqueo es MÁS fuerte que en la normal: además de no
-- tener política RLS, se revoca el privilegio, así que la operación lanza un
-- error de permisos en vez de afectar a 0 filas en silencio.
do $$
declare v_dias int;
begin
  begin
    insert into reset_alfa.checkins (user_id, fecha, estado)
    values ('11111111-1111-4111-8111-111111111111', current_date - 10, 'en_racha');
    raise exception 'FALLO: el cliente ha insertado un check-in directamente';
  exception when insufficient_privilege then null;
  end;

  begin
    update reset_alfa.streaks set dias_actuales = 999;
    raise exception 'FALLO: el cliente ha podido inflar su racha';
  exception when insufficient_privilege then null;
  end;

  select dias_actuales into v_dias from reset_alfa.streaks
  where user_id = '11111111-1111-4111-8111-111111111111' and activa;
  assert v_dias = 1, format('la racha vale %s, deberia seguir en 1', v_dias);

  raise notice 'OK 6 · escritura directa bloqueada por privilegios';
end $$;

-- 7 · Art. 9: sin consentimiento no se guarda el detalle de la recaída.
do $$
declare v_r jsonb;
begin
  v_r := reset_alfa.guardar_recaida(p_lugar => 'casa', p_trigger => 'aburrimiento');
  assert (v_r ->> 'registrado')::boolean, 'la recaida deberia registrarse';
  assert not (v_r ->> 'detalle_guardado')::boolean,
    'el detalle NO deberia guardarse sin consentimiento';
  raise notice 'OK 7 · art. 9 impuesto por el motor tambien aqui';
end $$;

-- 8 · El paywall sigue en la política RLS.
reset role;
insert into reset_alfa.products (id, slug, nombre, tipo, precio_cents)
values ('b0000000-0000-4000-8000-000000000003','programa','Programa','programa',39700);
insert into reset_alfa.courses (id, slug, titulo, tipo, product_id)
values ('c0000000-0000-4000-8000-000000000001','fase-i','Fase I','premium',
        'b0000000-0000-4000-8000-000000000003');
insert into reset_alfa.lessons (course_id, titulo, orden)
values ('c0000000-0000-4000-8000-000000000001','Modulo 1',1);

set role authenticated;
set request.jwt.claims to '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
do $$
declare v_l int;
begin
  select count(*) into v_l from reset_alfa.lessons;
  assert v_l = 0, format('FUGA: se ven %s lecciones premium sin permiso', v_l);
  raise notice 'OK 8 · paywall activo en el esquema aislado';
end $$;

-- 9 · Borrado del art. 17 SIN tocar auth.users (identidad compartida).
do $$
declare v_ra int; v_auth int; v_otra int;
begin
  perform reset_alfa.borrar_mis_datos();

  select count(*) into v_ra from reset_alfa.profiles
    where user_id = '11111111-1111-4111-8111-111111111111';
  assert v_ra = 0, 'los datos de Reset Alfa deberian haberse borrado';

  raise notice 'OK 9 · borrado de datos de Reset Alfa';
end $$;

reset role;
reset request.jwt.claims;

do $$
declare v_auth int; v_otra int;
begin
  select count(*) into v_auth from auth.users
    where id = '11111111-1111-4111-8111-111111111111';
  select count(*) into v_otra from public.profiles;

  assert v_auth = 1,
    'FALLO GRAVE: se ha borrado la identidad, expulsando al usuario de la otra app';
  assert v_otra = 1, 'la otra app se ha visto afectada por el borrado';

  raise notice 'OK 10 · la identidad y la otra app quedan intactas';
end $$;

delete from auth.users where id in ('11111111-1111-4111-8111-111111111111',
                                    '22222222-2222-4222-8222-222222222222');
