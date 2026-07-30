-- =============================================================================
-- 0011 · MOTOR DE RACHAS  (Fase 2)
--
-- Toda la escritura de rachas pasa por aqui. `streaks` y `checkins` solo tienen
-- politicas de SELECT, asi que el cliente NO puede insertar por su cuenta.
--
-- El motivo es que registrar un check-in no es una escritura, es una
-- transicion de varios pasos: cerrar la racha activa, actualizar el record,
-- acumular el total y abrir una racha nueva. Si el cliente pudiera hacerlo
-- pieza a pieza, podria ejecutar la mitad —dejando el estado incoherente— o
-- sencillamente falsear una racha de 500 dias desde la consola.
--
-- Aqui ocurre entero o no ocurre nada.
--
-- LOS DOS CONTADORES NO MIDEN LO MISMO:
--   dias_actuales  Dias naturales desde fecha_inicio. Es el numero grande de la
--                  pantalla de Inicio. Un dia sin marcar NO rompe la racha y
--                  sigue contando: se calcula por diferencia de fechas, nunca
--                  como contador incremental, de modo que no puede
--                  desincronizarse.
--   dias_totales   Numero de check-ins 'en_racha' de todo el historial. Mide
--                  constancia, no antiguedad. Este si es un acumulador.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Longitud de una racha en dias naturales
--
-- El primer dia es el dia 1, no el dia 0: un contador que arranca en cero el
-- dia que empiezas desmotiva y no es lo que nadie espera ver.
--
-- Una racha que empieza manana (la que se abre tras una recaida) devuelve 0.
-- -----------------------------------------------------------------------------
create or replace function app.longitud_racha(p_inicio date, p_hasta date)
returns integer
language sql
immutable
as $$
  select greatest((p_hasta - p_inicio) + 1, 0);
$$;

comment on function app.longitud_racha(date, date) is
  'Dias naturales de una racha, con el primer dia contando como 1. Devuelve 0 '
  'si aun no ha empezado.';


-- -----------------------------------------------------------------------------
-- Racha activa del usuario, creandola si no existe
--
-- Un usuario recien registrado no tiene ninguna. En vez de crearla en el alta
-- —lo que arrancaria su contador antes de que decidiera empezar— se crea de
-- forma perezosa en el primer check-in.
-- -----------------------------------------------------------------------------
create or replace function app.racha_activa(p_user_id uuid, p_hoy date)
returns public.streaks
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_racha public.streaks%rowtype;
begin
  select * into v_racha
  from public.streaks
  where user_id = p_user_id and activa;

  if not found then
    insert into public.streaks (user_id, fecha_inicio, dias_actuales, activa)
    values (p_user_id, p_hoy, app.longitud_racha(p_hoy, p_hoy), true)
    returning * into v_racha;
  end if;

  return v_racha;
end;
$$;


-- -----------------------------------------------------------------------------
-- Record personal, recalculado desde los datos
--
-- No se acumula con greatest(record, nuevo). Ese enfoque parece natural pero es
-- incorrecto: si el usuario marca "sigo en racha" por la manana con 6 dias y
-- recae por la tarde, el record quedaria congelado en 6 cuando en realidad
-- nunca completo mas de 5 dias limpios. El dia en que recaes no es un dia
-- limpio, y un record que solo puede subir jamas podria corregirlo.
--
-- Recalcularlo sobre la tabla es la unica forma de que el numero sea siempre
-- cierto, tambien hacia abajo.
-- -----------------------------------------------------------------------------
create or replace function app.recalcular_record(p_user_id uuid, p_hoy date)
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_record integer;
begin
  select coalesce(max(
    case
      when s.activa then app.longitud_racha(s.fecha_inicio, p_hoy)
      else s.dias_actuales
    end
  ), 0)
  into v_record
  from public.streaks s
  where s.user_id = p_user_id;

  update public.profiles
     set record_personal = v_record
   where user_id = p_user_id;

  return v_record;
end;
$$;


-- -----------------------------------------------------------------------------
-- Estado del dia
--
-- Lo llama la app al abrirse. Decide si procede mostrar el modal diario.
--
-- La fecha SIEMPRE la calcula el servidor a partir de la zona horaria guardada
-- en el perfil. Nunca se acepta la fecha del dispositivo: adelantar el reloj
-- del movil bastaria para inflar la racha.
-- -----------------------------------------------------------------------------
create or replace function public.estado_diario()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user     uuid := auth.uid();
  v_hoy      date;
  v_racha    public.streaks%rowtype;
  v_perfil   public.profiles%rowtype;
  v_ultima   date;
  v_hoy_hecho boolean;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  v_hoy := app.today_for_user(v_user);

  select * into v_perfil from public.profiles where user_id = v_user;
  select * into v_racha  from public.streaks  where user_id = v_user and activa;

  select max(fecha) into v_ultima from public.checkins where user_id = v_user;

  v_hoy_hecho := exists (
    select 1 from public.checkins where user_id = v_user and fecha = v_hoy
  );

  return jsonb_build_object(
    'fecha_local',      v_hoy,
    -- Si el usuario viaja hacia el oeste, su "hoy" puede retroceder a un dia
    -- que ya registro. No se le vuelve a preguntar ni se reescribe nada: el
    -- modal solo aparece cuando su fecha local supera la ultima registrada.
    'necesita_checkin', not v_hoy_hecho,
    'ultimo_checkin',   v_ultima,
    'racha_actual',     coalesce(app.longitud_racha(v_racha.fecha_inicio, v_hoy), 0),
    'racha_inicio',     v_racha.fecha_inicio,
    'record_personal',  coalesce(v_perfil.record_personal, 0),
    'dias_totales',     coalesce(v_perfil.dias_totales, 0),
    'timezone',         coalesce(v_perfil.timezone, 'Europe/Madrid'),
    -- La app lo necesita para saber si puede ofrecer el formulario de recaida
    -- o debe saltarselo. Ver guardar_recaida.
    'consiente_sensibles', app.has_consent(v_user, 'datos_sensibles')
  );
end;
$$;

revoke all on function public.estado_diario() from public, anon;
grant execute on function public.estado_diario() to authenticated;


-- -----------------------------------------------------------------------------
-- Check-in de continuidad
--
-- El caso feliz: el usuario sigue en racha.
-- -----------------------------------------------------------------------------
create or replace function public.registrar_checkin()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user      uuid := auth.uid();
  v_hoy       date;
  v_racha     public.streaks%rowtype;
  v_longitud  integer;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  v_hoy   := app.today_for_user(v_user);
  v_racha := app.racha_activa(v_user, v_hoy);

  -- Una racha abierta tras una recaida empieza manana. Si el usuario abre la
  -- app ese mismo dia, no hay nada que marcar todavia.
  if v_racha.fecha_inicio > v_hoy then
    return jsonb_build_object('registrado', false, 'motivo', 'racha_no_iniciada');
  end if;

  -- Idempotente: si ya marco hoy, se devuelve el estado sin tocar nada. Un
  -- doble toque en el boton no debe sumar dos dias.
  if exists (select 1 from public.checkins where user_id = v_user and fecha = v_hoy) then
    return jsonb_build_object('registrado', false, 'motivo', 'ya_registrado')
           || public.estado_diario();
  end if;

  insert into public.checkins (user_id, streak_id, fecha, estado)
  values (v_user, v_racha.id, v_hoy, 'en_racha');

  v_longitud := app.longitud_racha(v_racha.fecha_inicio, v_hoy);

  update public.streaks
     set dias_actuales = v_longitud
   where id = v_racha.id;

  update public.profiles
     set dias_totales = dias_totales + 1
   where user_id = v_user;

  perform app.recalcular_record(v_user, v_hoy);

  return jsonb_build_object('registrado', true) || public.estado_diario();
end;
$$;

revoke all on function public.registrar_checkin() from public, anon;
grant execute on function public.registrar_checkin() to authenticated;


-- -----------------------------------------------------------------------------
-- Recaida: check-in y detalle, en una sola transaccion
--
-- Cierra la racha activa, consolida el record y abre una racha nueva a cero
-- MANANA, no hoy: el dia de la recaida no cuenta como dia de la racha nueva.
--
-- SOBRE EL DETALLE Y EL ART. 9 RGPD:
-- Si el usuario no dio consentimiento explicito, el check-in se registra
-- igualmente y el detalle se descarta en silencio. Es deliberado: negarse a
-- ceder datos sobre la propia vida sexual no puede impedir usar la app
-- (art. 7.4), y fallar aqui dejaria al usuario sin poder registrar su recaida
-- justo en el peor momento posible.
-- -----------------------------------------------------------------------------
create or replace function public.guardar_recaida(
  p_lugar              text default null,
  p_hora               time default null,
  p_trigger            text default null,
  p_accion_correctiva  text default null,
  p_ejecuto_pad        boolean default null,
  p_motivo_fallo       text default null,
  p_ajuste_pad         text default null,
  p_contexto_ambiental text default null,
  p_contexto_emocional text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user       uuid := auth.uid();
  v_hoy        date;
  v_racha      public.streaks%rowtype;
  v_checkin_id uuid;
  v_longitud   integer := 0;
  v_detalle    boolean := false;
  v_estado_previo public.checkin_estado;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  v_hoy := app.today_for_user(v_user);

  select id, estado into v_checkin_id, v_estado_previo
  from public.checkins
  where user_id = v_user and fecha = v_hoy;

  -- LA TRANSICION SE EJECUTA UNA SOLA VEZ POR DIA.
  --
  -- Si hoy ya consta como recaida, la racha ya se cerro y ya se abrio la
  -- siguiente, que empieza MANANA. Volver a ejecutarla intentaria cerrar esa
  -- racha nueva con fecha de fin anterior a su inicio. Ocurre en dos casos
  -- reales: una segunda recaida el mismo dia, y el usuario que vuelve atras
  -- para completar o corregir el formulario.
  if v_estado_previo is distinct from 'recaida' then
    v_racha := app.racha_activa(v_user, v_hoy);

    if v_checkin_id is null then
      insert into public.checkins (user_id, streak_id, fecha, estado)
      values (v_user, v_racha.id, v_hoy, 'recaida')
      returning id into v_checkin_id;
    else
      -- Habia dicho "sigo en racha" por la manana y ha recaido despues: se
      -- corrige el estado del dia.
      update public.checkins set estado = 'recaida' where id = v_checkin_id;
    end if;

    -- Longitud final: hasta AYER. El dia de la recaida no cuenta como limpio.
    v_longitud := app.longitud_racha(v_racha.fecha_inicio, v_hoy - 1);

    update public.streaks
       set activa        = false,
           fecha_fin     = v_hoy,
           dias_actuales = v_longitud
     where id = v_racha.id;

    -- Racha nueva a cero, empezando manana.
    insert into public.streaks (user_id, fecha_inicio, dias_actuales, activa)
    values (v_user, v_hoy + 1, 0, true);

    -- Al final: asi el record refleja la longitud real hasta ayer y puede
    -- corregirse a la baja si hoy se habia marcado check-in antes de recaer.
    perform app.recalcular_record(v_user, v_hoy);
  else
    -- Solo se actualiza el detalle. Se recupera la longitud ya consolidada
    -- para poder devolverla.
    select s.dias_actuales into v_longitud
    from public.checkins c
    join public.streaks s on s.id = c.streak_id
    where c.id = v_checkin_id;
  end if;

  if app.has_consent(v_user, 'datos_sensibles') then
    insert into public.relapses (
      user_id, checkin_id, lugar, hora, trigger, accion_correctiva,
      ejecuto_pad, motivo_fallo, ajuste_pad, contexto_ambiental, contexto_emocional
    ) values (
      v_user, v_checkin_id, p_lugar, p_hora, p_trigger, p_accion_correctiva,
      p_ejecuto_pad, p_motivo_fallo, p_ajuste_pad, p_contexto_ambiental, p_contexto_emocional
    )
    on conflict (checkin_id) do update set
      lugar = excluded.lugar, hora = excluded.hora, trigger = excluded.trigger,
      accion_correctiva = excluded.accion_correctiva, ejecuto_pad = excluded.ejecuto_pad,
      motivo_fallo = excluded.motivo_fallo, ajuste_pad = excluded.ajuste_pad,
      contexto_ambiental = excluded.contexto_ambiental,
      contexto_emocional = excluded.contexto_emocional;

    v_detalle := true;
  end if;

  return jsonb_build_object(
    'registrado',      true,
    'checkin_id',      v_checkin_id,
    'racha_anterior',  v_longitud,
    'detalle_guardado', v_detalle
  ) || public.estado_diario();
end;
$$;

revoke all on function public.guardar_recaida(
  text, time, text, text, boolean, text, text, text, text
) from public, anon;
grant execute on function public.guardar_recaida(
  text, time, text, text, boolean, text, text, text, text
) to authenticated;


-- -----------------------------------------------------------------------------
-- Calendario del mes
--
-- Devuelve solo los dias CON registro. La ausencia de una fecha significa "sin
-- registro", que es un estado con entidad propia: no rompe la racha.
-- -----------------------------------------------------------------------------
create or replace function public.calendario_mes(p_anio integer, p_mes integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user   uuid := auth.uid();
  v_desde  date;
  v_hasta  date;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  v_desde := make_date(p_anio, p_mes, 1);
  v_hasta := (v_desde + interval '1 month')::date - 1;

  return coalesce(
    (select jsonb_agg(
       jsonb_build_object(
         'fecha',      c.fecha,
         'estado',     c.estado,
         'relapse_id', r.id
       ) order by c.fecha)
     from public.checkins c
     left join public.relapses r on r.checkin_id = c.id
     where c.user_id = v_user
       and c.fecha between v_desde and v_hasta),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.calendario_mes(integer, integer) from public, anon;
grant execute on function public.calendario_mes(integer, integer) to authenticated;
