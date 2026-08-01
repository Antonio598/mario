-- =============================================================================
-- CONTENIDO INICIAL
--
-- Pega este fichero en el SQL Editor DESPUES de instalacion-esquema-aislado.sql.
-- Crea autor, categorias, productos, cursos, banco de temas y tres articulos
-- publicados, para que la web deje de estar vacia y pueda solicitarse la
-- revision de AdSense.
--
-- Si instalaste el esquema NORMAL (proyecto Supabase dedicado), sustituye
-- `reset_alfa.` por `public.` en todo el fichero antes de ejecutarlo.
--
-- Es idempotente: puedes ejecutarlo varias veces sin duplicar nada.
--
--
-- REGLAS DE CONTENIDO QUE CUMPLE ESTE TEXTO  ·  no son opcionales
--
-- La cuenta de AdSense depende de ellas. Si los articulos se leen como
-- contenido adulto, la cuenta se rechaza o se desmoneta, y con ella
-- desaparece la fuente de ingresos del proyecto.
--
--   · Registro clinico y de disciplina. Nada de lenguaje explicito ni
--     descripciones graficas.
--   · CERO afirmaciones medicas o fisiologicas. Ni testosterona, ni hormonas,
--     ni efectos sobre el cuerpo, ni "curacion". Solo experiencia subjetiva y
--     habito.
--   · Temario amplio a proposito: disciplina, productividad, entrenamiento,
--     finanzas, mentalidad y relaciones, no solo abstinencia. Multiplica las
--     paginas indexables, sube el CPC —el inventario de anunciantes en
--     "adiccion" es pobre— y protege la cuenta.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Autor
--
-- AdSense rechaza los sitios sin autor identificable y biografia real, y Google
-- lo usa como senal E-E-A-T. Sustituye el texto por el del cliente antes de
-- solicitar la revision.
-- -----------------------------------------------------------------------------

insert into reset_alfa.autores (id, slug, nombre, bio, url_web) values
  ('a0000000-0000-4000-8000-000000000001',
   'mario-modo-guerrero',
   'Mario',
   'Fundador de Modo Guerrero. Escribe sobre disciplina, autocontrol y '
   'construccion de habitos a partir de su propia experiencia y de la de los '
   'hombres a los que acompana en el programa Reset Alfa.',
   'https://modoguerrero.es/acerca-de')
on conflict (slug) do update
  set nombre = excluded.nombre, bio = excluded.bio;


-- -----------------------------------------------------------------------------
-- Categorias
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- Productos
--
-- La app NATIVA no muestra `precio_cents`: abre `url_web` en el navegador
-- externo. La app WEB si puede mostrarlo y cobrar, porque no le aplica la
-- comision del 15-30 % de Apple y Google.
-- -----------------------------------------------------------------------------

insert into reset_alfa.products (id, slug, nombre, descripcion, tipo, precio_cents, url_web, orden) values
  ('b0000000-0000-4000-8000-000000000001', 'reto-21-dias', 'Reto 21 dias',
   'Tres semanas de acciones diarias para instalar el habito de decidir por ti mismo.',
   'reto', 2900, 'https://modoguerrero.es/producto/reto-21-dias', 1),

  ('b0000000-0000-4000-8000-000000000002', 'libro-modo-guerrero', 'Modo Guerrero (libro)',
   'El metodo completo por escrito: disparadores, protocolos y sistema de rachas.',
   'libro', 1900, 'https://modoguerrero.es/producto/libro-modo-guerrero', 2),

  ('b0000000-0000-4000-8000-000000000003', 'programa-reset-alfa', 'Programa Reset Alfa',
   'Las tres fases del programa formativo completo, con mentorias grabadas.',
   'programa', 39700, 'https://modoguerrero.es/producto/programa-reset-alfa', 3),

  ('b0000000-0000-4000-8000-000000000004', 'mastermind-vip', 'Mastermind VIP',
   'Grupo reducido por invitacion. Acompanamiento directo y sesiones en vivo.',
   'mastermind', 99700, 'https://modoguerrero.es/producto/mastermind-vip', 4)
on conflict (slug) do update
  set nombre = excluded.nombre, precio_cents = excluded.precio_cents;


-- -----------------------------------------------------------------------------
-- Cursos: 4 masterclasses gratuitas + programa premium
-- -----------------------------------------------------------------------------

insert into reset_alfa.courses (id, slug, titulo, descripcion, tipo, product_id, orden) values
  ('c0000000-0000-4000-8000-000000000001', 'potencia-sexual', 'Potencia Sexual',
   'Como recuperar el control sobre tus impulsos y dejar de delegar en ellos tus decisiones.',
   'gratis', null, 1),
  ('c0000000-0000-4000-8000-000000000002', 'reset', 'Reset',
   'El punto de partida: cortar con el patron actual y construir una linea base.',
   'gratis', null, 2),
  ('c0000000-0000-4000-8000-000000000003', 'largas-rachas', 'Largas Rachas',
   'Que cambia cuando la racha deja de ser un reto y pasa a ser tu normalidad.',
   'gratis', null, 3),
  ('c0000000-0000-4000-8000-000000000004', 'identidad-alfa', 'Identidad Alfa',
   'Dejar de resistirte a un habito y convertirte en alguien que sencillamente no lo tiene.',
   'gratis', null, 4),

  ('c0000000-0000-4000-8000-000000000005', 'fase-i-desencadenado', 'Fase I · Desencadenado',
   'Identificacion de disparadores y construccion de tu Protocolo Anti-Deseo.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 5),
  ('c0000000-0000-4000-8000-000000000006', 'fase-ii-transmutacion', 'Fase II · Transmutacion',
   'Redirigir la energia liberada hacia entrenamiento, trabajo y proyectos.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 6),
  ('c0000000-0000-4000-8000-000000000007', 'fase-iii-liderazgo', 'Fase III · Liderazgo',
   'Sostener el cambio en el tiempo y liderar a otros desde el ejemplo.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 7),
  ('c0000000-0000-4000-8000-000000000008', 'mentorias-grabadas', 'Mentorias grabadas',
   'Archivo de sesiones de acompanamiento del programa.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 8),
  ('c0000000-0000-4000-8000-000000000009', 'mastermind', 'Mastermind',
   'Grupo por invitacion. Sesiones en vivo y seguimiento directo.',
   'premium', 'b0000000-0000-4000-8000-000000000004', 9)
on conflict (slug) do update
  set titulo = excluded.titulo, descripcion = excluded.descripcion;


-- -----------------------------------------------------------------------------
-- Banco de temas para el pipeline diario de n8n
-- -----------------------------------------------------------------------------

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
where not exists (
  select 1 from reset_alfa.topic_bank t where t.tema = v.tema
);


-- -----------------------------------------------------------------------------
-- Articulos publicados
--
-- Tres piezas de tres categorias distintas, para que la web tenga contenido
-- real y las paginas de categoria no salgan vacias. Escritos con las reglas de
-- arriba: habito y experiencia subjetiva, cero fisiologia.
-- -----------------------------------------------------------------------------

insert into reset_alfa.articles
  (slug, titulo, meta_description, contenido_md, categoria, autor_id,
   estado, fecha_publicacion, tiempo_lectura, keywords)
values

-- 1 ---------------------------------------------------------------------------
('rutina-matinal-que-aguanta-los-dias-malos',
 'La rutina matinal que aguanta los dias malos',
 'Una rutina no sirve si solo funciona cuando tienes ganas. Como disenar una que resista.',
 E'La mayoria de rutinas matinales se disenan para el mejor dia del mes. Te levantas con energia, tienes tiempo de sobra y encadenas seis habitos seguidos. Funciona tres dias.\n\n'
 '## El error de disenar para el mejor dia\n\n'
 'El problema no es la rutina. Es que la disenaste pensando en la version de ti que menos aparece.\n\n'
 'Los dias malos son mayoria: dormiste poco, te has levantado tarde, tienes prisa. Si tu rutina solo encaja en el dia perfecto, en cuanto llega un martes normal la saltas entera. Y saltarla una vez es lo que abre la puerta a saltarla siempre.\n\n'
 '## La version de cinco minutos\n\n'
 'Define dos versiones de tu rutina:\n\n'
 '- **La completa.** La que haces cuando todo va bien.\n'
 '- **La minima.** Cinco minutos. Dos o tres acciones, no mas.\n\n'
 'La minima es la que de verdad cuenta, porque es la que vas a hacer los dias que decidiran si esto dura o no.\n\n'
 '> Un habito no se rompe el dia que lo haces mal. Se rompe el dia que lo haces cero.\n\n'
 '## Como elegir esos cinco minutos\n\n'
 'Quedate con lo que cambia el resto del dia:\n\n'
 '1. **Levantarte a la misma hora.** Aunque hayas dormido mal. Es lo unico que ordena las siguientes dieciseis horas.\n'
 '2. **Una accion fisica.** Lo que sea, con tal de que te saque de la cama y no admita negociacion.\n'
 '3. **Decidir la primera tarea.** Una sola, escrita. Sin esto, la manana se la come el movil.\n\n'
 'Nada mas. Si tu version minima tiene siete pasos, no es minima.\n\n'
 '## Que hacer cuando la saltes\n\n'
 'La vas a saltar. Lo importante no es evitarlo, es lo que pasa despues.\n\n'
 'La regla es simple: **nunca dos dias seguidos**. Un dia sin rutina es un dia. Dos son el principio de otra cosa.\n\n'
 'Cuando falles, no recuperes lo perdido ni te castigues con una version doble al dia siguiente. Vuelve a la version de cinco minutos y sigue.',
 'disciplina', 'a0000000-0000-4000-8000-000000000001',
 'publicado', now() - interval '3 days', 5,
 array['rutina matinal', 'disciplina', 'habitos', 'constancia']),

-- 2 ---------------------------------------------------------------------------
('identificar-tus-disparadores',
 'Identificar tus disparadores: el mapa que casi nadie hace',
 'No caes por falta de fuerza de voluntad. Caes en sitios, horas y estados concretos. Este es el metodo para encontrarlos.',
 E'Casi todo el mundo intenta resolver esto con fuerza de voluntad. Aprietas los dientes, aguantas y esperas que baste. Funciona hasta que dejas de estar atento, que es exactamente cuando pasa.\n\n'
 '## El impulso no aparece de la nada\n\n'
 'Cuando reconstruyes las ultimas veces con calma, aparece un patron incomodo: casi siempre es el mismo sitio, la misma franja horaria y el mismo estado.\n\n'
 'Eso no es casualidad ni debilidad. Es un disparador: una senal del entorno que enciende una secuencia que ya tienes automatizada.\n\n'
 '## Los cuatro ejes\n\n'
 'Un disparador casi nunca es una sola cosa. Suele ser la suma de cuatro:\n\n'
 '- **Lugar.** Donde estabas exactamente. No "en casa": "en la cama, con la luz apagada".\n'
 '- **Hora.** La franja concreta. Las once de la noche no es lo mismo que las siete de la manana.\n'
 '- **Estado.** Cansancio, aburrimiento, estres, euforia. El aburrimiento aparece muchisimo mas de lo que la gente espera.\n'
 '- **Antesala.** Que estabas haciendo los diez minutos anteriores.\n\n'
 '## Como se hace el mapa\n\n'
 'Necesitas datos, y los datos solo salen de registrar. Despues de cada episodio, anota los cuatro ejes. Sin adjetivos y sin juicio: hechos.\n\n'
 'Con **tres registros** empiezan a verse coincidencias. Con diez, el patron es evidente y deja de ser opinable.\n\n'
 '> Cuando dejas de preguntarte por que eres asi y empiezas a preguntarte donde y cuando, el problema se vuelve resoluble.\n\n'
 '## Que hacer con el mapa\n\n'
 'Ataca el eje mas facil de cambiar, no el mas importante.\n\n'
 'Si el patron es "cama, once de la noche, aburrido, con el movil", no empieces por el aburrimiento. Empieza por el movil: dejarlo cargando en otra habitacion es una decision que tomas una vez, a las ocho de la tarde, con la cabeza fria.\n\n'
 'Cambiar el entorno gana casi siempre a resistir el impulso, porque no depende de como estes esa noche.',
 'autocontrol', 'a0000000-0000-4000-8000-000000000001',
 'publicado', now() - interval '2 days', 6,
 array['disparadores', 'autocontrol', 'habitos', 'patrones']),

-- 3 ---------------------------------------------------------------------------
('trabajo-profundo-dos-horas-de-foco',
 'Trabajo profundo: como recuperar dos horas de foco al dia',
 'No te falta tiempo. Te falta tiempo seguido. Como construir dos bloques que nadie interrumpa.',
 E'La queja habitual es "no tengo tiempo". Casi siempre es falsa. Lo que no hay es tiempo **seguido**.\n\n'
 'Cuatro horas partidas en trozos de diez minutos no son cuatro horas de trabajo: son cuarenta interrupciones.\n\n'
 '## El coste de volver\n\n'
 'Cada vez que te interrumpen no pierdes los treinta segundos de la interrupcion. Pierdes el tiempo de volver a donde estabas, y ese tiempo es mucho mayor de lo que parece mientras ocurre.\n\n'
 'Por eso terminas el dia agotado con la sensacion de no haber avanzado en nada: has trabajado muchas horas, pero ninguna entera.\n\n'
 '## Dos bloques, no todo el dia\n\n'
 'No hace falta reorganizar la jornada. Con dos bloques de noventa minutos cambia el resultado de la semana.\n\n'
 '1. **Ponlos en el calendario.** Como una reunion. Un hueco sin nombre se lo come cualquier cosa.\n'
 '2. **Decide la tarea la noche anterior.** Empezar un bloque decidiendo que hacer es empezarlo perdiendo.\n'
 '3. **El movil fuera de la habitacion.** No boca abajo ni en silencio: fuera. Estando presente, parte de tu atencion se queda vigilandolo.\n'
 '4. **Una sola pestana.** Si necesitas tres, es que la tarea no estaba bien definida.\n\n'
 '## Empieza por uno\n\n'
 'Dos bloques diarios desde el primer dia es la forma habitual de abandonar en una semana.\n\n'
 'Empieza por uno, a la misma hora, todos los dias laborables. Cuando lleves dos semanas sin saltartelo, anade el segundo.\n\n'
 '> Un bloque que cumples siempre vale mas que tres que cumples a veces.\n\n'
 '## Como sabes que funciona\n\n'
 'No lo midas en horas trabajadas. Mide una cosa: al terminar el bloque, hay algo que antes no existia.\n\n'
 'Si al cerrar el portatil no puedes senalar que has producido, no era un bloque de trabajo profundo. Era estar delante de la pantalla.',
 'productividad', 'a0000000-0000-4000-8000-000000000001',
 'publicado', now() - interval '1 day', 5,
 array['trabajo profundo', 'foco', 'productividad', 'concentracion'])

on conflict (slug) do update
  set titulo = excluded.titulo,
      meta_description = excluded.meta_description,
      contenido_md = excluded.contenido_md,
      estado = excluded.estado,
      fecha_publicacion = excluded.fecha_publicacion;


-- =============================================================================
-- Comprobacion
-- =============================================================================

do $$
declare v_art int; v_cat int; v_cur int; v_pro int; v_tem int;
begin
  select count(*) into v_art from reset_alfa.articles where estado = 'publicado';
  select count(*) into v_cat from reset_alfa.categorias;
  select count(*) into v_cur from reset_alfa.courses;
  select count(*) into v_pro from reset_alfa.products;
  select count(*) into v_tem from reset_alfa.topic_bank where not usado;

  raise notice '';
  raise notice 'Articulos publicados : %', v_art;
  raise notice 'Categorias           : %', v_cat;
  raise notice 'Cursos               : %', v_cur;
  raise notice 'Productos            : %', v_pro;
  raise notice 'Temas pendientes     : %', v_tem;
  raise notice '';
  raise notice 'Listo. La web ya tiene contenido en / y en /articulos.';
end $$;
