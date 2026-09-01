-- =============================================================================
-- CONTENIDO REAL DE MODO GUERRERO
--
-- FICHERO UNICO DE CONTENIDO. Sustituye a contenido-inicial.sql y a
-- prototipo-beta.sql: no hace falta ejecutar aquellos.
--
-- ORDEN:
--   1. instalacion-esquema-aislado.sql   crea las 18 tablas
--   2. ESTE FICHERO                      mete el contenido
--   3. admin-editores.sql                (opcional) panel de administracion
--
-- Idempotente: puedes ejecutarlo las veces que quieras.
-- Si usas el esquema NORMAL, cambia `reset_alfa.` por `public.`
--   y `reset_alfa_priv.` por `app.`
-- =============================================================================


-- =============================================================================
-- 1 - COLUMNAS NUEVAS
-- =============================================================================

alter table reset_alfa.courses add column if not exists url_externa   text;
alter table reset_alfa.courses add column if not exists url_protocolo text;

comment on column reset_alfa.courses.url_externa is
  'Video de la masterclass o ficha del curso. La app no aloja el contenido: '
  'lo abre donde ya vive.';
comment on column reset_alfa.courses.url_protocolo is
  'PDF descargable del protocolo asociado, si lo tiene.';


alter table reset_alfa.products
  add column if not exists mostrar_precio boolean not null default true;
alter table reset_alfa.products
  add column if not exists cta_texto text;

comment on column reset_alfa.products.mostrar_precio is
  'false cuando el producto no se vende directo, sino por llamada de admision. '
  'La interfaz oculta el precio pero el dato sigue guardado, para poder volver '
  'a venderlo directo sin recuperarlo de ningun sitio.';
comment on column reset_alfa.products.cta_texto is
  'Texto del boton. Nulo usa el de por defecto segun el tipo de producto.';


-- =============================================================================
-- 2 - AUTOR Y CATEGORIAS  (necesarios para los articulos de la web)
-- =============================================================================

insert into reset_alfa.autores (id, slug, nombre, bio, url_web) values
  ('a0000000-0000-4000-8000-000000000001', 'mario-modo-guerrero', 'Mario',
   'Fundador de Modo Guerrero. Escribe sobre disciplina, autocontrol y '
   'construccion de habitos a partir de su propia experiencia y de la de los '
   'hombres a los que acompana en el programa Reset Alfa.',
   'https://modoguerrero.es/acerca-de')
on conflict (slug) do update set nombre = excluded.nombre, bio = excluded.bio;


-- Temario amplio a proposito: concentrar todo en la abstinencia limita las
-- paginas indexables y deja el sitio en un nicho con CPC bajo.
insert into reset_alfa.categorias (slug, nombre, descripcion, meta_description, orden) values
  ('disciplina', 'Disciplina',
   'Rutinas, constancia y sistemas para sostener el esfuerzo cuando la motivacion se agota.',
   'Habitos y rutinas para construir disciplina real y sostenerla en el tiempo.', 1),
  ('autocontrol', 'Autocontrol',
   'Gestion de impulsos, disparadores y recaidas. El nucleo del metodo Reset Alfa.',
   'Como identificar disparadores, cortar impulsos y recuperar el control.', 2),
  ('productividad', 'Productividad',
   'Gestion del tiempo, foco profundo y eliminacion de distracciones.',
   'Metodos de foco y gestion del tiempo para trabajar sin dispersarte.', 3),
  ('entrenamiento', 'Entrenamiento',
   'Fuerza, constancia y rendimiento fisico como palanca de disciplina.',
   'Entrenamiento y constancia fisica como base de la disciplina diaria.', 4),
  ('finanzas', 'Finanzas personales',
   'Control del dinero, ahorro y decisiones a largo plazo.',
   'Habitos financieros para ordenar tus cuentas y decidir a largo plazo.', 5),
  ('mentalidad', 'Mentalidad',
   'Identidad, proposito y la conversacion que mantienes contigo mismo.',
   'Identidad, proposito y mentalidad para sostener un cambio duradero.', 6),
  ('relaciones', 'Relaciones',
   'Vinculos, limites y comunicacion.',
   'Limites, comunicacion y vinculos sanos.', 7)
on conflict (slug) do update
  set nombre = excluded.nombre, descripcion = excluded.descripcion;


-- =============================================================================
-- 3 - MASTERCLASSES GRATUITAS Y SUS PROTOCOLOS
--
-- El video vive en YouTube y el protocolo es un PDF del propio dominio. La app
-- no aloja ninguno de los dos: los abre donde ya estan. Duplicarlos obligaria a
-- mantenerlos en dos sitios y verlos divergir.
--
-- No todas las masterclasses tienen protocolo, ni todos los protocolos tienen
-- masterclass: `Largas Rachas` es solo PDF y `Disfunciones sexuales` es solo
-- video. Por eso las dos columnas son independientes y admiten nulo.
-- =============================================================================

insert into reset_alfa.courses
  (slug, titulo, descripcion, tipo, product_id, orden, url_externa, url_protocolo)
values
  ('masterclass-potencia-sexual',
   'Masterclass Potencia Sexual Masculina',
   'Como revertir los danos de la pornografia para volver a disfrutar del sexo.',
   'gratis', null, 1,
   'https://youtu.be/AfG_glm3qhk',
   'https://modoguerrero.es/wp-content/uploads/2026/08/Protocolo-de-Actuacion-Potencia-sexual.pdf'),

  ('masterclass-reset',
   'Masterclass Reset',
   'El sistema probado para dejar el porno y construir tu linea base.',
   'gratis', null, 2,
   'https://youtu.be/M_QKAPN7eoc',
   'https://modoguerrero.es/wp-content/uploads/2026/08/Protocolo-Reset-Dopaminico.pdf'),

  ('masterclass-dejar-el-porno',
   'Masterclass: como deje el porno tras mas de 4 anos',
   'El relato de primera mano y el metodo que funciono.',
   'gratis', null, 3,
   'https://www.youtube.com/watch?v=g5b8c9AcpyA',
   'https://modoguerrero.es/wp-content/uploads/2026/08/Protocolo-para-dejar-el-porno.pdf'),

  ('masterclass-identidad-alfa',
   'Masterclass Identidad Alfa',
   'Como crear paso a paso tu version mas Alfa sin fingir ser otro.',
   'gratis', null, 4,
   'https://youtu.be/QBNkCfyk21s',
   'https://modoguerrero.es/wp-content/uploads/2026/08/Protocolo-Identidad-Alfa.pdf'),

  ('masterclass-disfunciones-sexuales',
   'Masterclass Disfunciones sexuales',
   'Que ocurre, por que ocurre y como se aborda desde el habito.',
   'gratis', null, 5,
   'https://youtu.be/gxOT_zLrTS0',
   null),

  -- Solo protocolo: no tiene masterclass asociada.
  ('protocolo-largas-rachas',
   'Protocolo Largas Rachas',
   'Descubre como evitar recaidas tontas y romper tu record de racha.',
   'gratis', null, 6,
   null,
   'https://modoguerrero.es/wp-content/uploads/2026/08/Protocolo-Largas-Rachas.pdf')

on conflict (slug) do update set
  titulo        = excluded.titulo,
  descripcion   = excluded.descripcion,
  tipo          = excluded.tipo,
  orden         = excluded.orden,
  url_externa   = excluded.url_externa,
  url_protocolo = excluded.url_protocolo;


-- =============================================================================
-- 4 - PROGRAMA RESET ALFA
--
-- 1497 USD. `precio_cents` guarda centavos: 149700.
-- =============================================================================

-- El programa no se compra por enlace: se accede tras una llamada de admision.
-- El precio se conserva en la tabla pero no se muestra, de modo que volver a
-- venderlo directo sea cambiar un booleano y no recuperar el dato de otro sitio.
--
-- Efecto secundario util: sin precio ni enlace de pago dentro de la app, la
-- guideline 3.1.1 de Apple sobre compras externas deja de aplicar.
insert into reset_alfa.products
  (id, slug, nombre, descripcion, tipo, precio_cents, moneda, url_web, orden,
   mostrar_precio, cta_texto)
values
  ('b0000000-0000-4000-8000-000000000003', 'programa-reset-alfa',
   'Programa Online de Liderazgo Reset Alfa',
   'Desencadenado, Transmutacion Sexual, Liderazgo y el archivo completo de '
   'mentorias grabadas.',
   'programa', 149700, 'USD',
   'https://marioruperezdc.youcanbook.me', 1,
   false, 'Agendar llamada de admision')
on conflict (slug) do update set
  nombre = excluded.nombre, descripcion = excluded.descripcion,
  precio_cents = excluded.precio_cents, moneda = excluded.moneda,
  url_web = excluded.url_web, orden = excluded.orden, activo = true,
  mostrar_precio = excluded.mostrar_precio, cta_texto = excluded.cta_texto;


-- =============================================================================
-- 5 - CURSOS PREMIUM
-- =============================================================================

insert into reset_alfa.courses
  (slug, titulo, descripcion, tipo, product_id, orden, url_externa)
values
  ('desencadenado', 'Fase I: Desencadenado',
   'Liberate de la adiccion a la pornografia.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 10,
   'https://modoguerrero.es/curso/desencadenado-curso-para-eliminar-adicciones/'),

  ('transmutacion-sexual', 'Fase II: Transmutacion',
   'Construye tu imperio gracias a tu energia sexual.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 11,
   'https://modoguerrero.es/curso/transmutacion-sexual/'),

  ('liderazgo', 'Fase III: Liderazgo',
   'Conviertete en el hombre que inspira a traves del ejemplo.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 12,
   'https://modoguerrero.es/curso/liderazgo'),

  ('mentorias-grabadas', 'Mentorias grabadas',
   'Archivo completo de sesiones de acompanamiento del programa.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 13,
   'https://modoguerrero.es/curso/mentorias-grabadas/')

on conflict (slug) do update set
  titulo = excluded.titulo, descripcion = excluded.descripcion,
  tipo = excluded.tipo, product_id = excluded.product_id,
  orden = excluded.orden, url_externa = excluded.url_externa;


-- =============================================================================
-- 6 - LIBROS
--
-- Los dos primeros se compran en Amazon. Un enlace a Amazon convierte mejor que
-- uno a tienda propia (la gente ya tiene la cuenta y el pago guardado) a cambio
-- de su comision. Es decision de negocio, no tecnica.
--
-- El Cuaderno de Bitacora sigue en la tienda propia porque no esta en Amazon.
-- =============================================================================

insert into reset_alfa.products
  (slug, nombre, descripcion, tipo, precio_cents, moneda, url_web, imagen_url, orden)
values
  ('libro-activa-el-modo-alfa-vol1',
   'Activa el Modo Alfa Vol. 1',
   'Energia Sexual Masculina. El primer libro de la saga: ensenanzas ancestrales '
   'sobre la retencion seminal, como retener tu energia sexual y transmutarla en '
   'poder personal, y despertar tu version mas Alfa por mucho tiempo que lleve dormida.',
   'libro', 1990, 'EUR',
   'https://a.co/d/0fwvO82Q',
   'https://modoguerrero.es/wp-content/uploads/2026/04/Packs-Escuela-300x300.png', 2),

  ('libro-activa-el-modo-guerrero',
   'Activa el Modo Guerrero',
   'El libro fundacional del movimiento: una filosofia de vida basada en la '
   'excelencia personal y en el servicio al mundo a traves de las pasiones. '
   'Descubriras cual es tu Arquetipo de Guerrero y como dejar una huella que '
   'trascienda.',
   'libro', 1990, 'EUR',
   'https://www.amazon.es/dp/8409633213',
   'https://modoguerrero.es/wp-content/uploads/2025/07/Packs-Escuela-300x300.png', 3),

  ('cuaderno-de-bitacora',
   'El Cuaderno de Bitacora',
   'Un cuaderno-planificador de 30 dias con el que aprenderas a marcarte '
   'objetivos de forma inteligente y trabajarlos de forma persistente, para '
   'construir un imperio que se convertira en legado para ti y para los tuyos.',
   'libro', 1490, 'EUR',
   'https://modoguerrero.es/producto/cuaderno-de-bitacora/',
   'https://modoguerrero.es/wp-content/uploads/2025/07/Packs-Escuela-1-300x300.png', 4)

on conflict (slug) do update set
  nombre = excluded.nombre, descripcion = excluded.descripcion,
  precio_cents = excluded.precio_cents, moneda = excluded.moneda,
  url_web = excluded.url_web, imagen_url = excluded.imagen_url,
  orden = excluded.orden, activo = true;


-- =============================================================================
-- 7 - RETIRAR LO QUE YA NO VA
--
-- Los productos se DESACTIVAN, no se borran: `entitlements` los referencia con
-- ON DELETE RESTRICT, y borrar uno que alguien compro dejaria al cliente sin
-- acceso a algo que pago.
-- =============================================================================

update reset_alfa.products set activo = false
 where slug in ('reto-21-dias', 'libro-modo-guerrero', 'mastermind-vip',
                'mastermind-modo-guerrero');

-- Los cursos si pueden borrarse: nadie compra un curso, se compra el producto.
--
-- Se borra por lista blanca y no por lista negra. Con una lista negra hay que
-- acordarse de anadir cada slug antiguo, y el que se olvide se queda para
-- siempre en pantalla junto al nuevo, con su titulo viejo y sus enlaces viejos.
-- Este fichero es la fuente de verdad del catalogo: lo que no esta aqui arriba
-- no debe existir en la tabla.
delete from reset_alfa.courses
 where slug not in (
   'masterclass-potencia-sexual',
   'masterclass-reset',
   'masterclass-dejar-el-porno',
   'masterclass-identidad-alfa',
   'masterclass-disfunciones-sexuales',
   'protocolo-largas-rachas',
   'desencadenado',
   'transmutacion-sexual',
   'liderazgo',
   'mentorias-grabadas');


-- =============================================================================
-- 8 - BANCO DE TEMAS  (pipeline diario de n8n)
-- =============================================================================

insert into reset_alfa.topic_bank (tema, keyword_objetivo, categoria, prioridad)
select * from (values
  ('Como construir una rutina matinal que aguante los dias malos',
   'rutina matinal disciplina', 'disciplina', 100),
  ('Identificar tus disparadores: el mapa que casi nadie hace',
   'identificar disparadores habitos', 'autocontrol', 95),
  ('Trabajo profundo: como recuperar dos horas de foco al dia',
   'trabajo profundo concentracion', 'productividad', 90),
  ('Entrenar cuando no te apetece: el sistema de la barrera minima',
   'entrenar sin motivacion constancia', 'entrenamiento', 85),
  ('Presupuesto personal en una hoja: el metodo mas simple que funciona',
   'presupuesto personal simple', 'finanzas', 80),
  ('Identidad antes que objetivos: por que fallan los propositos',
   'cambiar habitos identidad', 'mentalidad', 75),
  ('Poner limites sin romper la relacion',
   'como poner limites', 'relaciones', 70),
  ('El movil fuera del dormitorio: la regla que mas cambia el dia siguiente',
   'movil dormitorio dormir mejor', 'disciplina', 65),
  ('Que hacer con los primeros quince minutos despues de una recaida',
   'que hacer despues de una recaida', 'autocontrol', 60),
  ('Como decidir menos para decidir mejor',
   'fatiga de decision', 'productividad', 55)
) as v(tema, keyword, categoria, prioridad)
where not exists (select 1 from reset_alfa.topic_bank t where t.tema = v.tema);


-- =============================================================================
-- 9 - ARTICULOS DE ARRANQUE
--
-- Tres piezas de tres categorias distintas, para que la web tenga contenido y
-- las paginas de categoria no salgan vacias.
--
-- REGLAS QUE CUMPLE ESTE TEXTO, y de las que depende la cuenta de AdSense:
-- registro de disciplina, sin lenguaje explicito y CERO afirmaciones medicas o
-- fisiologicas. Ni testosterona, ni hormonas, ni efectos sobre el cuerpo.
-- =============================================================================

insert into reset_alfa.articles
  (slug, titulo, meta_description, contenido_md, categoria, autor_id,
   estado, fecha_publicacion, tiempo_lectura, keywords)
values

('rutina-matinal-que-aguanta-los-dias-malos',
 'La rutina matinal que aguanta los dias malos',
 'Una rutina no sirve si solo funciona cuando tienes ganas. Como disenar una que resista.',
 E'La mayoria de rutinas matinales se disenan para el mejor dia del mes. Te levantas con energia, tienes tiempo de sobra y encadenas seis habitos seguidos. Funciona tres dias.\n\n'
 '## El error de disenar para el mejor dia\n\n'
 'El problema no es la rutina. Es que la disenaste pensando en la version de ti que menos aparece.\n\n'
 'Los dias malos son mayoria: dormiste poco, te has levantado tarde, tienes prisa. Si tu rutina solo encaja en el dia perfecto, en cuanto llega un martes normal la saltas entera. Y saltarla una vez es lo que abre la puerta a saltarla siempre.\n\n'
 '## La version de cinco minutos\n\n'
 'Define dos versiones: la completa, para cuando todo va bien, y **la minima**, de cinco minutos y dos o tres acciones.\n\n'
 'La minima es la que de verdad cuenta, porque es la que vas a hacer los dias que decidiran si esto dura.\n\n'
 '> Un habito no se rompe el dia que lo haces mal. Se rompe el dia que lo haces cero.\n\n'
 '## Que meter en esos cinco minutos\n\n'
 '1. **Levantarte a la misma hora.** Aunque hayas dormido mal. Es lo unico que ordena las siguientes dieciseis horas.\n'
 '2. **Una accion fisica.** Lo que sea, con tal de que te saque de la cama y no admita negociacion.\n'
 '3. **Decidir la primera tarea.** Una sola, escrita. Sin esto, la manana se la come el movil.\n\n'
 'Nada mas. Si tu version minima tiene siete pasos, no es minima.\n\n'
 '## Que hacer cuando la saltes\n\n'
 'La vas a saltar. La regla es simple: **nunca dos dias seguidos**. Un dia sin rutina es un dia. Dos son el principio de otra cosa.',
 'disciplina', 'a0000000-0000-4000-8000-000000000001',
 'publicado', now() - interval '3 days', 5,
 array['rutina matinal', 'disciplina', 'habitos', 'constancia']),

('identificar-tus-disparadores',
 'Identificar tus disparadores: el mapa que casi nadie hace',
 'No caes por falta de fuerza de voluntad. Caes en sitios, horas y estados concretos.',
 E'Casi todo el mundo intenta resolver esto con fuerza de voluntad. Aprietas los dientes, aguantas y esperas que baste. Funciona hasta que dejas de estar atento, que es exactamente cuando pasa.\n\n'
 '## El impulso no aparece de la nada\n\n'
 'Cuando reconstruyes las ultimas veces con calma, aparece un patron incomodo: casi siempre es el mismo sitio, la misma franja horaria y el mismo estado.\n\n'
 'Eso no es casualidad ni debilidad. Es un disparador: una senal del entorno que enciende una secuencia que ya tienes automatizada.\n\n'
 '## Los cuatro ejes\n\n'
 '- **Lugar.** Donde estabas exactamente. No "en casa": "en la cama, con la luz apagada".\n'
 '- **Hora.** La franja concreta.\n'
 '- **Estado.** Cansancio, aburrimiento, estres, euforia. El aburrimiento aparece muchisimo mas de lo que la gente espera.\n'
 '- **Antesala.** Que estabas haciendo los diez minutos anteriores.\n\n'
 '## Como se hace el mapa\n\n'
 'Necesitas datos, y los datos solo salen de registrar. Con **tres registros** empiezan a verse coincidencias. Con diez, el patron deja de ser opinable.\n\n'
 '> Cuando dejas de preguntarte por que eres asi y empiezas a preguntarte donde y cuando, el problema se vuelve resoluble.\n\n'
 '## Que hacer con el mapa\n\n'
 'Ataca el eje mas facil de cambiar, no el mas importante.\n\n'
 'Si el patron es "cama, once de la noche, aburrido, con el movil", no empieces por el aburrimiento. Empieza por el movil: dejarlo cargando en otra habitacion es una decision que tomas una vez, a las ocho de la tarde, con la cabeza fria.',
 'autocontrol', 'a0000000-0000-4000-8000-000000000001',
 'publicado', now() - interval '2 days', 6,
 array['disparadores', 'autocontrol', 'habitos', 'patrones']),

('trabajo-profundo-dos-horas-de-foco',
 'Trabajo profundo: como recuperar dos horas de foco al dia',
 'No te falta tiempo. Te falta tiempo seguido. Como construir bloques que nadie interrumpa.',
 E'La queja habitual es "no tengo tiempo". Casi siempre es falsa. Lo que no hay es tiempo **seguido**.\n\n'
 'Cuatro horas partidas en trozos de diez minutos no son cuatro horas de trabajo: son cuarenta interrupciones.\n\n'
 '## El coste de volver\n\n'
 'Cada interrupcion no te cuesta los treinta segundos que dura. Te cuesta el tiempo de volver a donde estabas, que es mucho mayor de lo que parece mientras ocurre.\n\n'
 'Por eso terminas el dia agotado con la sensacion de no haber avanzado: has trabajado muchas horas, pero ninguna entera.\n\n'
 '## Dos bloques, no todo el dia\n\n'
 '1. **Ponlos en el calendario.** Un hueco sin nombre se lo come cualquier cosa.\n'
 '2. **Decide la tarea la noche anterior.** Empezar decidiendo que hacer es empezar perdiendo.\n'
 '3. **El movil fuera de la habitacion.** No boca abajo: fuera. Estando presente, parte de tu atencion se queda vigilandolo.\n'
 '4. **Una sola pestana.** Si necesitas tres, la tarea no estaba bien definida.\n\n'
 '## Empieza por uno\n\n'
 'Dos bloques diarios desde el primer dia es la forma habitual de abandonar en una semana. Empieza por uno, a la misma hora. Cuando lleves dos semanas sin saltartelo, anade el segundo.\n\n'
 '> Un bloque que cumples siempre vale mas que tres que cumples a veces.\n\n'
 '## Como sabes que funciona\n\n'
 'No lo midas en horas. Mide una cosa: al terminar, hay algo que antes no existia.',
 'productividad', 'a0000000-0000-4000-8000-000000000001',
 'publicado', now() - interval '1 day', 5,
 array['trabajo profundo', 'foco', 'productividad', 'concentracion'])

on conflict (slug) do update set
  titulo = excluded.titulo, meta_description = excluded.meta_description,
  contenido_md = excluded.contenido_md, estado = excluded.estado,
  fecha_publicacion = excluded.fecha_publicacion;


-- =============================================================================
-- 10 - AJUSTE MANUAL DE LA RACHA
--
-- Quien lleva meses sin porno no empieza en cero al instalar la app. Sin esto,
-- el primer contacto con el producto es perder su progreso real.
--
-- Recalcula `fecha_inicio` hacia atras en vez de escribir el contador: asi el
-- valor sigue siendo una diferencia de fechas y no puede desincronizarse.
-- =============================================================================

create or replace function reset_alfa.ajustar_racha(p_dias integer)
returns jsonb language plpgsql
security definer set search_path = reset_alfa, pg_catalog
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
     set fecha_inicio = v_hoy - greatest(p_dias - 1, 0), dias_actuales = p_dias
   where id = v_racha.id;

  perform reset_alfa_priv.recalcular_record(v_user, v_hoy);
  return reset_alfa.estado_diario();
end $$;

revoke all on function reset_alfa.ajustar_racha(integer) from public, anon;
grant execute on function reset_alfa.ajustar_racha(integer) to authenticated;


-- =============================================================================
-- 11 - DETALLE E HISTORIAL DE RECAIDAS
-- =============================================================================

create or replace function reset_alfa.detalle_recaida(p_fecha date)
returns jsonb language plpgsql stable
security definer set search_path = reset_alfa, pg_catalog
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


-- Cada entrada trae la longitud de la racha que se rompio ese dia. Se calcula
-- desde `streaks`: duplicar ese dato obligaria a mantenerlo sincronizado.
create or replace function reset_alfa.historial_recaidas(p_limite integer default 20)
returns jsonb language plpgsql stable
security definer set search_path = reset_alfa, pg_catalog
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(x order by x.fecha desc)
    from (
      select c.fecha, r.id as relapse_id,
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
-- COMPROBACION
-- =============================================================================

do $$
declare v_g int; v_p int; v_l int; v_prog int; v_art int;
begin
  select count(*) into v_g    from reset_alfa.courses  where tipo = 'gratis';
  select count(*) into v_p    from reset_alfa.courses  where tipo = 'premium';
  select count(*) into v_l    from reset_alfa.products where tipo = 'libro' and activo;
  select count(*) into v_prog from reset_alfa.products where tipo = 'programa' and activo;
  select count(*) into v_art  from reset_alfa.articles where estado = 'publicado';

  raise notice '';
  raise notice 'Masterclasses y protocolos : %  (esperado 6)', v_g;
  raise notice 'Cursos premium             : %  (esperado 4)', v_p;
  raise notice 'Libros activos             : %  (esperado 3)', v_l;
  raise notice 'Programa activo            : %  (esperado 1)', v_prog;
  raise notice 'Articulos publicados       : %  (esperado 3)', v_art;
  raise notice '';

  -- Si estos numeros no cuadran, lo normal es que este fichero no se haya
  -- llegado a ejecutar y la app siga sirviendo el contenido de la primera
  -- carga: titulos viejos, descripciones viejas y enlaces que no son los
  -- definitivos.
  if v_g <> 6 or v_p <> 4 then
    raise notice 'AVISO: el catalogo no cuadra. Vuelve a ejecutar este fichero entero.';
  end if;
end $$;
