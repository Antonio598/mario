-- =============================================================================
-- CONTENIDO REAL DE MODO GUERRERO
--
-- Pega en el SQL Editor DESPUES de instalacion-esquema-aislado.sql.
-- Sustituye los datos de ejemplo por los enlaces, precios e imagenes reales.
-- Es idempotente: puedes ejecutarlo las veces que quieras.
--
-- Si usas el esquema NORMAL, cambia `reset_alfa.` por `public.`
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1 - Columna para el enlace externo de cada curso
--
-- Las masterclasses y los cursos viven en modoguerrero.es/escuela, no dentro de
-- la app. La app solo necesita saber a donde enviar al usuario.
-- -----------------------------------------------------------------------------

alter table reset_alfa.courses
  add column if not exists url_externa text;

alter table reset_alfa.courses
  add column if not exists url_protocolo text;

comment on column reset_alfa.courses.url_externa is
  'Ficha del curso en modoguerrero.es. La app abre esta URL; no aloja el video.';
comment on column reset_alfa.courses.url_protocolo is
  'PDF descargable del protocolo asociado, si lo tiene.';


-- -----------------------------------------------------------------------------
-- 2 - Masterclasses gratuitas y sus protocolos
-- -----------------------------------------------------------------------------

insert into reset_alfa.courses
  (slug, titulo, descripcion, tipo, product_id, orden, url_externa, url_protocolo)
values
  ('masterclass-potencia-sexual',
   'Masterclass Potencia Sexual Masculina',
   'Recupera el control sobre tus impulsos y deja de delegar en ellos tus decisiones.',
   'gratis', null, 1,
   'https://modoguerrero.es/curso/masterclass-potencia-sexual-masculina',
   'https://modoguerrero.es/wp-content/uploads/2026/06/Protocolo-de-Actuacion-Potencia-sexual-1.pdf'),

  ('masterclass-reset',
   'Masterclass Reset',
   'El punto de partida: cortar con el patron actual y construir tu linea base.',
   'gratis', null, 2,
   'https://modoguerrero.es/curso/masterclass-reset',
   null),

  ('protocolo-largas-rachas',
   'Largas Rachas',
   'Que cambia cuando la racha deja de ser un reto y pasa a ser tu normalidad.',
   'gratis', null, 3,
   'https://modoguerrero.es/escuela',
   'https://modoguerrero.es/wp-content/uploads/2026/06/Protocolo-Largas-Rachas.pdf'),

  ('masterclass-identidad-alfa',
   'Masterclass Identidad Alfa',
   'Deja de resistirte a un habito y conviertete en alguien que sencillamente no lo tiene.',
   'gratis', null, 4,
   'https://modoguerrero.es/curso/masterclass-identidad-alfa',
   'https://modoguerrero.es/wp-content/uploads/2026/07/Protocolo-Identidad-Alfa.pdf')

on conflict (slug) do update set
  titulo        = excluded.titulo,
  descripcion   = excluded.descripcion,
  url_externa   = excluded.url_externa,
  url_protocolo = excluded.url_protocolo,
  orden         = excluded.orden;


-- -----------------------------------------------------------------------------
-- 3 - Producto Reset Alfa
--
-- 1497 USD. `precio_cents` guarda centavos, asi que son 149700.
-- -----------------------------------------------------------------------------

insert into reset_alfa.products
  (id, slug, nombre, descripcion, tipo, precio_cents, moneda, url_web, orden)
values
  ('b0000000-0000-4000-8000-000000000003',
   'programa-reset-alfa',
   'Reset Alfa',
   'El programa completo: Desencadenado, Transmutacion Sexual, Liderazgo y las mentorias grabadas.',
   'programa', 149700, 'USD',
   'https://buy.stripe.com/aFa00i5ay8YC39dgYE5os2l', 1)
on conflict (slug) do update set
  nombre       = excluded.nombre,
  descripcion  = excluded.descripcion,
  precio_cents = excluded.precio_cents,
  moneda       = excluded.moneda,
  url_web      = excluded.url_web,
  orden        = excluded.orden,
  activo       = true;


-- -----------------------------------------------------------------------------
-- 4 - Cursos premium, enlazados a la formacion real
-- -----------------------------------------------------------------------------

insert into reset_alfa.courses
  (slug, titulo, descripcion, tipo, product_id, orden, url_externa)
values
  ('desencadenado', 'Desencadenado',
   'Curso para eliminar adicciones. Identificacion de disparadores y construccion de tu P.A.D.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 10,
   'https://modoguerrero.es/curso/desencadenado-curso-para-eliminar-adicciones/'),

  ('transmutacion-sexual', 'Transmutacion Sexual',
   'Redirigir la energia liberada hacia entrenamiento, trabajo y proyectos.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 11,
   'https://modoguerrero.es/curso/transmutacion-sexual/'),

  ('liderazgo', 'Liderazgo',
   'Sostener el cambio en el tiempo y liderar a otros desde el ejemplo.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 12,
   'https://modoguerrero.es/curso/liderazgo'),

  ('mentorias-grabadas', 'Mentorias grabadas',
   'Archivo completo de sesiones de acompanamiento del programa.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 13,
   'https://modoguerrero.es/curso/mentorias-grabadas/')

on conflict (slug) do update set
  titulo      = excluded.titulo,
  descripcion = excluded.descripcion,
  tipo        = excluded.tipo,
  product_id  = excluded.product_id,
  orden       = excluded.orden,
  url_externa = excluded.url_externa;


-- -----------------------------------------------------------------------------
-- 5 - Libros
--
-- Los precios de la web son rangos (25-37 EUR) porque hay varias ediciones. Se
-- guarda el minimo y la ficha muestra "desde": prometer el precio bajo y cobrar
-- el alto es la forma mas rapida de perder la venta en el ultimo paso.
-- -----------------------------------------------------------------------------

insert into reset_alfa.products
  (slug, nombre, descripcion, tipo, precio_cents, moneda, url_web, imagen_url, orden)
values
  ('libro-activa-el-modo-guerrero',
   'Activa el Modo Guerrero',
   'El metodo completo por escrito: disparadores, protocolos y sistema de rachas.',
   'libro', 2500, 'EUR',
   'https://modoguerrero.es/producto/libro-activa-el-modo-guerrero/',
   'https://modoguerrero.es/wp-content/uploads/2025/07/Packs-Escuela-300x300.png', 2),

  ('cuaderno-de-bitacora',
   'Cuaderno de Bitacora',
   'El registro diario en papel: rachas, disparadores y ajustes de tu protocolo.',
   'libro', 3000, 'EUR',
   'https://modoguerrero.es/producto/cuaderno-de-bitacora/',
   'https://modoguerrero.es/wp-content/uploads/2025/07/Packs-Escuela-1-300x300.png', 3),

  ('libro-activa-el-modo-alfa-vol1',
   'Activa el Modo Alfa Vol. 1',
   'Energia Sexual Masculina.',
   'libro', 1900, 'EUR',
   'https://modoguerrero.es/producto/libro-activa-el-modo-alfa-vol1/',
   'https://modoguerrero.es/wp-content/uploads/2026/04/Packs-Escuela-300x300.png', 4)

on conflict (slug) do update set
  nombre       = excluded.nombre,
  descripcion  = excluded.descripcion,
  precio_cents = excluded.precio_cents,
  moneda       = excluded.moneda,
  url_web      = excluded.url_web,
  imagen_url   = excluded.imagen_url,
  orden        = excluded.orden,
  activo       = true;


-- -----------------------------------------------------------------------------
-- 6 - Retirar el Reto 21 dias y los cursos de ejemplo
--
-- Se marcan como inactivos en lugar de borrarse: `entitlements` referencia
-- productos con ON DELETE RESTRICT, y borrar uno que alguien haya comprado
-- dejaria al cliente sin acceso a algo que pago.
-- -----------------------------------------------------------------------------

update reset_alfa.products set activo = false
 where slug in ('reto-21-dias', 'libro-modo-guerrero', 'mastermind-vip');

delete from reset_alfa.courses
 where slug in ('potencia-sexual', 'reset', 'largas-rachas', 'identidad-alfa',
                'fase-i-desencadenado', 'fase-ii-transmutacion', 'fase-iii-liderazgo',
                'mastermind');


-- -----------------------------------------------------------------------------
-- 7 - Ajuste manual de la racha
--
-- Quien lleva meses sin porno no empieza en cero al instalar la app. Sin esto,
-- el primer contacto con el producto es perder su progreso real, y la app se
-- desinstala el mismo dia.
--
-- Recalcula fecha_inicio hacia atras en vez de escribir el contador: asi el
-- valor sigue siendo una diferencia de fechas y no puede desincronizarse
-- despues.
-- -----------------------------------------------------------------------------

create or replace function reset_alfa.ajustar_racha(p_dias integer)
returns jsonb
language plpgsql
security definer
set search_path = reset_alfa, pg_catalog
as $$
declare
  v_user  uuid := auth.uid();
  v_hoy   date;
  v_racha reset_alfa.streaks%rowtype;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  -- Tope de 10 anos: un numero absurdo suele ser un error de tecleo, y un
  -- contador de 90.000 dias arruina la credibilidad de la propia app.
  if p_dias < 0 or p_dias > 3650 then
    raise exception 'Los dias deben estar entre 0 y 3650' using errcode = '22023';
  end if;

  perform reset_alfa_priv.asegurar_perfil(v_user);
  v_hoy   := reset_alfa_priv.today_for_user(v_user);
  v_racha := reset_alfa_priv.racha_activa(v_user, v_hoy);

  -- Con p_dias = 1 la racha empieza HOY (el primer dia es el dia 1).
  update reset_alfa.streaks
     set fecha_inicio  = v_hoy - greatest(p_dias - 1, 0),
         dias_actuales = p_dias
   where id = v_racha.id;

  perform reset_alfa_priv.recalcular_record(v_user, v_hoy);

  return reset_alfa.estado_diario();
end $$;

revoke all on function reset_alfa.ajustar_racha(integer) from public, anon;
grant execute on function reset_alfa.ajustar_racha(integer) to authenticated;


-- -----------------------------------------------------------------------------
-- 8 - Detalle de una recaida, para abrirlo desde el calendario
-- -----------------------------------------------------------------------------

create or replace function reset_alfa.detalle_recaida(p_fecha date)
returns jsonb
language plpgsql
stable
security definer
set search_path = reset_alfa, pg_catalog
as $$
declare
  v_user uuid := auth.uid();
  v_res  jsonb;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  select to_jsonb(r) into v_res
  from reset_alfa.relapses r
  join reset_alfa.checkins c on c.id = r.checkin_id
  where r.user_id = v_user and c.fecha = p_fecha;

  return coalesce(v_res, 'null'::jsonb);
end $$;

revoke all on function reset_alfa.detalle_recaida(date) from public, anon;
grant execute on function reset_alfa.detalle_recaida(date) to authenticated;


-- =============================================================================
-- Comprobacion
-- =============================================================================

do $$
declare v_g int; v_p int; v_l int; v_prog int;
begin
  select count(*) into v_g    from reset_alfa.courses  where tipo = 'gratis';
  select count(*) into v_p    from reset_alfa.courses  where tipo = 'premium';
  select count(*) into v_l    from reset_alfa.products where tipo = 'libro'   and activo;
  select count(*) into v_prog from reset_alfa.products where tipo = 'programa' and activo;

  raise notice '';
  raise notice 'Masterclasses gratuitas : %  (esperado 4)', v_g;
  raise notice 'Cursos premium          : %  (esperado 4)', v_p;
  raise notice 'Libros activos          : %  (esperado 3)', v_l;
  raise notice 'Programas activos       : %  (esperado 1)', v_prog;
  raise notice '';
end $$;
