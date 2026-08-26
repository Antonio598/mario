-- =============================================================================
-- AJUSTES DEL PROTOTIPO BETA
--
-- Pega DESPUES de contenido-real.sql. Aditivo e idempotente.
-- Si usas el esquema NORMAL, cambia `reset_alfa.` por `public.`
--   y `reset_alfa_priv.` por `app.`
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1 - Descripciones reales de los libros, tal como estan en el prototipo
-- -----------------------------------------------------------------------------

update reset_alfa.products set descripcion =
  'El primer libro de la Saga Activa el Modo Alfa. Contiene ensenanzas '
  'ancestrales sobre la retencion seminal: como retener tu energia sexual y '
  'transmutarla en poder personal, y despertar tu version mas Alfa por mucho '
  'tiempo que lleve dormida.'
where slug = 'libro-activa-el-modo-alfa-vol1';

update reset_alfa.products set descripcion =
  'El libro fundacional del movimiento Modo Guerrero, una filosofia de vida '
  'basada en la excelencia personal y en la contribucion al mundo a traves de '
  'las pasiones. Descubriras cual es tu Arquetipo de Guerrero y como poner tus '
  'talentos al servicio del mundo para dejar una huella que trascienda.'
where slug = 'libro-activa-el-modo-guerrero';

update reset_alfa.products set descripcion =
  'Un cuaderno-planificador de 30 dias con el que aprenderas a marcarte '
  'objetivos de forma inteligente y trabajarlos de forma persistente, para '
  'construir un imperio que se convertira en legado para ti y para los tuyos.'
where slug = 'cuaderno-de-bitacora';


-- -----------------------------------------------------------------------------
-- 2 - Descripciones de las fases, del boceto de Formacion
-- -----------------------------------------------------------------------------

update reset_alfa.courses set titulo = 'Fase I: Desencadenado',
  descripcion = 'Liberate de la adiccion a la pornografia.'
where slug = 'desencadenado';

update reset_alfa.courses set titulo = 'Fase II: Transmutacion',
  descripcion = 'Construye tu imperio gracias a tu energia sexual.'
where slug = 'transmutacion-sexual';

update reset_alfa.courses set titulo = 'Fase III: Liderazgo',
  descripcion = 'Conviertete en el hombre que inspira a traves del ejemplo.'
where slug = 'liderazgo';

update reset_alfa.courses set
  descripcion = 'Archivo completo de sesiones de acompanamiento del programa.'
where slug = 'mentorias-grabadas';


-- -----------------------------------------------------------------------------
-- 3 - Mastermind: acceso por invitacion
--
-- No tiene enlace de compra a proposito. Es por invitacion, y poner un boton de
-- pago a algo que no se puede comprar solo genera solicitudes que hay que
-- rechazar.
-- -----------------------------------------------------------------------------

insert into reset_alfa.products
  (id, slug, nombre, descripcion, tipo, precio_cents, moneda, url_web, activo, orden)
values
  ('b0000000-0000-4000-8000-000000000004', 'mastermind-modo-guerrero',
   'Mastermind Modo Guerrero',
   'Tu siguiente paso en la tribu: acceder al circulo interno del Modo Guerrero.',
   'mastermind', 0, 'EUR', null, true, 5)
on conflict (id) do update set
  slug        = excluded.slug,
  nombre      = excluded.nombre,
  descripcion = excluded.descripcion,
  url_web     = excluded.url_web,
  activo      = true,
  orden       = excluded.orden;

insert into reset_alfa.courses
  (slug, titulo, descripcion, tipo, product_id, orden, url_externa)
values
  ('mastermind', 'Mastermind Modo Guerrero',
   'Tu siguiente paso en la tribu: acceder al circulo interno del Modo Guerrero.',
   'premium', 'b0000000-0000-4000-8000-000000000004', 20,
   'https://modoguerrero.es/escuela')
on conflict (slug) do update set
  titulo      = excluded.titulo,
  descripcion = excluded.descripcion,
  product_id  = excluded.product_id,
  orden       = excluded.orden;


-- -----------------------------------------------------------------------------
-- 4 - Historial de recaidas
--
-- Cada entrada trae la longitud de la racha que se rompio ese dia, que es el
-- dato que da contexto: "20 de mayo. Racha anterior: 11 dias".
--
-- Se calcula desde `streaks` y no se guarda aparte: es informacion que ya
-- existe, y duplicarla obligaria a mantenerla sincronizada.
-- -----------------------------------------------------------------------------

create or replace function reset_alfa.historial_recaidas(p_limite integer default 20)
returns jsonb
language plpgsql
stable
security definer
set search_path = reset_alfa, pg_catalog
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(x order by x.fecha desc)
    from (
      select
        c.fecha,
        r.id as relapse_id,
        -- La racha que se cerro ese dia. Puede no existir si el historial se
        -- ajusto a mano, de ahi el coalesce.
        coalesce(s.dias_actuales, 0) as racha_anterior
      from reset_alfa.checkins c
      left join reset_alfa.relapses r on r.checkin_id = c.id
      left join reset_alfa.streaks  s on s.id = c.streak_id
      where c.user_id = v_user and c.estado = 'recaida'
      order by c.fecha desc
      limit greatest(p_limite, 1)
    ) x
  ), '[]'::jsonb);
end $$;

revoke all on function reset_alfa.historial_recaidas(integer) from public, anon;
grant execute on function reset_alfa.historial_recaidas(integer) to authenticated;


-- =============================================================================
do $$
declare v_l int; v_c int;
begin
  select count(*) into v_l from reset_alfa.products where tipo = 'libro' and activo;
  select count(*) into v_c from reset_alfa.courses  where tipo = 'premium';
  raise notice '';
  raise notice 'Libros con descripcion : %', v_l;
  raise notice 'Cursos premium         : %  (4 fases + mastermind = 5)', v_c;
  raise notice '';
end $$;
