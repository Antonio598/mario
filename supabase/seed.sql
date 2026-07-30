-- =============================================================================
-- SEED · datos de prueba para desarrollo local
--
-- Se aplica solo con `supabase db reset`. Nunca se ejecuta en produccion.
-- Los UUID son fijos para que los tests y las capturas sean reproducibles.
--
-- AVISO SOBRE EL TEXTO: las descripciones respetan las reglas de contenido del
-- proyecto. Marco de habitos, disciplina y foco. Cero lenguaje explicito y cero
-- afirmaciones medicas o fisiologicas (nada de testosterona, hormonas ni
-- efectos sobre el cuerpo). Una cuenta de AdSense se pierde por esto.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Autor
-- -----------------------------------------------------------------------------

insert into public.autores (id, slug, nombre, bio, url_web) values
  ('a0000000-0000-4000-8000-000000000001',
   'mario-modo-guerrero',
   'Mario',
   'Fundador de Modo Guerrero. Escribe sobre disciplina, autocontrol y '
   'construccion de habitos a partir de su propia experiencia y de la de los '
   'hombres a los que acompana en el programa Reset Alfa.',
   'https://modoguerrero.es/acerca-de');


-- -----------------------------------------------------------------------------
-- Categorias
--
-- Deliberadamente amplias. Concentrar todo el contenido en la abstinencia
-- limita las paginas indexables y deja el sitio en un nicho con inventario
-- publicitario pobre y CPC bajo. Estas siete multiplican la superficie de
-- busqueda y protegen la cuenta publicitaria.
-- -----------------------------------------------------------------------------

insert into public.categorias (slug, nombre, descripcion, meta_description, orden) values
  ('disciplina',    'Disciplina',
   'Rutinas, constancia y sistemas para sostener el esfuerzo cuando la motivacion se agota.',
   'Habitos y rutinas para construir disciplina real y sostenerla en el tiempo.', 1),

  ('autocontrol',   'Autocontrol',
   'Gestion de impulsos, disparadores y recaidas. El nucleo del metodo Reset Alfa.',
   'Como identificar disparadores, cortar impulsos y recuperar el control.', 2),

  ('productividad', 'Productividad',
   'Gestion del tiempo, foco profundo y eliminacion de distracciones.',
   'Metodos de foco y gestion del tiempo para trabajar sin dispersarte.', 3),

  ('entrenamiento', 'Entrenamiento',
   'Fuerza, constancia y rendimiento fisico como palanca de disciplina.',
   'Entrenamiento y constancia fisica como base de la disciplina diaria.', 4),

  ('finanzas',      'Finanzas personales',
   'Control del dinero, ahorro y decisiones a largo plazo.',
   'Habitos financieros para ordenar tus cuentas y decidir a largo plazo.', 5),

  ('mentalidad',    'Mentalidad',
   'Identidad, proposito y la conversacion que mantienes contigo mismo.',
   'Identidad, proposito y mentalidad para sostener un cambio duradero.', 6),

  ('relaciones',    'Relaciones',
   'Vinculos, limites y comunicacion.',
   'Limites, comunicacion y vinculos sanos.', 7);


-- -----------------------------------------------------------------------------
-- Productos
--
-- Toda la venta ocurre en la web. `url_web` es lo unico que la app usa: abre
-- esa direccion en el navegador externo. La app nunca muestra precio_cents.
-- -----------------------------------------------------------------------------

insert into public.products (id, slug, nombre, descripcion, tipo, precio_cents, url_web, orden) values
  ('b0000000-0000-4000-8000-000000000001', 'reto-21-dias',
   'Reto 21 dias',
   'Tres semanas de acciones diarias para instalar el habito de decidir por ti mismo.',
   'reto', 2900, 'https://modoguerrero.es/reto-21-dias', 1),

  ('b0000000-0000-4000-8000-000000000002', 'libro-modo-guerrero',
   'Modo Guerrero (libro)',
   'El metodo completo por escrito: disparadores, protocolos y sistema de rachas.',
   'libro', 1900, 'https://modoguerrero.es/libro-modo-guerrero', 2),

  ('b0000000-0000-4000-8000-000000000003', 'programa-reset-alfa',
   'Programa Reset Alfa',
   'Las tres fases del programa formativo completo, con mentorias grabadas.',
   'programa', 39700, 'https://modoguerrero.es/programa-reset-alfa', 3),

  ('b0000000-0000-4000-8000-000000000004', 'mastermind-vip',
   'Mastermind VIP',
   'Grupo reducido por invitacion. Acompanamiento directo y sesiones en vivo.',
   'mastermind', 99700, 'https://modoguerrero.es/mastermind', 4);


-- -----------------------------------------------------------------------------
-- Cursos gratuitos: las 4 masterclasses, cada una con su protocolo
-- -----------------------------------------------------------------------------

insert into public.courses (id, slug, titulo, descripcion, tipo, product_id, orden) values
  ('c0000000-0000-4000-8000-000000000001', 'potencia-sexual',
   'Potencia Sexual',
   'Como recuperar el control sobre tus impulsos y dejar de delegar tus '
   'decisiones en ellos.', 'gratis', null, 1),

  ('c0000000-0000-4000-8000-000000000002', 'reset',
   'Reset',
   'El punto de partida: cortar con el patron actual y construir una linea base.',
   'gratis', null, 2),

  ('c0000000-0000-4000-8000-000000000003', 'largas-rachas',
   'Largas Rachas',
   'Que cambia cuando la racha deja de ser un reto y pasa a ser tu normalidad.',
   'gratis', null, 3),

  ('c0000000-0000-4000-8000-000000000004', 'identidad-alfa',
   'Identidad Alfa',
   'Dejar de resistirte a un habito y convertirte en alguien que sencillamente '
   'no lo tiene.', 'gratis', null, 4);


-- Cursos premium
insert into public.courses (id, slug, titulo, descripcion, tipo, product_id, orden) values
  ('c0000000-0000-4000-8000-000000000005', 'fase-i-desencadenado',
   'Fase I · Desencadenado',
   'Identificacion de disparadores y construccion de tu Protocolo Anti-Deseo.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 5),

  ('c0000000-0000-4000-8000-000000000006', 'fase-ii-transmutacion',
   'Fase II · Transmutacion',
   'Redirigir la energia liberada hacia entrenamiento, trabajo y proyectos.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 6),

  ('c0000000-0000-4000-8000-000000000007', 'fase-iii-liderazgo',
   'Fase III · Liderazgo',
   'Sostener el cambio en el tiempo y liderar a otros desde el ejemplo.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 7),

  ('c0000000-0000-4000-8000-000000000008', 'mentorias-grabadas',
   'Mentorias grabadas',
   'Archivo de sesiones de acompanamiento del programa.',
   'premium', 'b0000000-0000-4000-8000-000000000003', 8),

  ('c0000000-0000-4000-8000-000000000009', 'mastermind',
   'Mastermind',
   'Grupo por invitacion. Sesiones en vivo y seguimiento directo.',
   'premium', 'b0000000-0000-4000-8000-000000000004', 9);


-- -----------------------------------------------------------------------------
-- Lecciones: masterclass + protocolo en cada curso gratuito
-- -----------------------------------------------------------------------------

insert into public.lessons (course_id, titulo, contenido_md, orden, duracion)
select c.id, v.titulo, v.contenido, v.orden, v.duracion
from public.courses c
join (values
  ('potencia-sexual', 'Masterclass: Potencia Sexual',
   '## Que vas a ver aqui' || chr(10) ||
   'El impulso no es el problema. El automatismo si.', 1, 1800),
  ('potencia-sexual', 'Protocolo: cortar el automatismo',
   '## Pasos' || chr(10) || '1. Nombrar el disparador.' || chr(10) ||
   '2. Cambiar de entorno.' || chr(10) || '3. Registrar que ha pasado.', 2, 600),

  ('reset', 'Masterclass: Reset',
   '## Linea base' || chr(10) ||
   'Antes de mejorar nada hay que saber donde estas.', 1, 1800),
  ('reset', 'Protocolo: los primeros 7 dias',
   '## Pasos' || chr(10) || 'Una sola accion diaria, sin excepciones.', 2, 600),

  ('largas-rachas', 'Masterclass: Largas Rachas',
   '## Del reto al habito' || chr(10) ||
   'Lo que sostiene una racha larga no es fuerza de voluntad, es diseno.', 1, 1800),
  ('largas-rachas', 'Protocolo: blindar el entorno',
   '## Pasos' || chr(10) || 'Elimina la friccion de lo correcto. Anade friccion a lo demas.', 2, 600),

  ('identidad-alfa', 'Masterclass: Identidad Alfa',
   '## No es lo que haces, es quien eres' || chr(10) ||
   'Resistirse cansa. Ser otro, no.', 1, 1800),
  ('identidad-alfa', 'Protocolo: la declaracion diaria',
   '## Pasos' || chr(10) || 'Escribe cada manana quien decides ser hoy.', 2, 600)
) as v(curso_slug, titulo, contenido, orden, duracion)
  on v.curso_slug = c.slug;


-- Lecciones premium (para verificar que el paywall de RLS las oculta)
insert into public.lessons (course_id, titulo, contenido_md, orden, duracion)
select c.id, v.titulo, v.contenido, v.orden, v.duracion
from public.courses c
join (values
  ('fase-i-desencadenado',  'Modulo 1 · Mapa de disparadores',
   'Contenido premium. Si ves esto sin permiso, la RLS esta mal.', 1, 2400),
  ('fase-i-desencadenado',  'Modulo 2 · Construye tu P.A.D',
   'Contenido premium.', 2, 2400),
  ('fase-ii-transmutacion', 'Modulo 1 · Canalizar la energia',
   'Contenido premium.', 1, 2400),
  ('fase-iii-liderazgo',    'Modulo 1 · Sostener el cambio',
   'Contenido premium.', 1, 2400),
  ('mentorias-grabadas',    'Sesion 01',
   'Contenido premium.', 1, 3600),
  ('mastermind',            'Bienvenida al grupo',
   'Contenido premium por invitacion.', 1, 1200)
) as v(curso_slug, titulo, contenido, orden, duracion)
  on v.curso_slug = c.slug;


-- -----------------------------------------------------------------------------
-- Banco de temas para el pipeline de la Fase 3
-- -----------------------------------------------------------------------------

insert into public.topic_bank (tema, keyword_objetivo, categoria, prioridad) values
  ('Como construir una rutina matinal que aguante los dias malos',
   'rutina matinal disciplina', 'disciplina', 100),
  ('Identificar tus disparadores: el mapa que casi nadie hace',
   'identificar disparadores habitos', 'autocontrol', 90),
  ('Trabajo profundo: como recuperar dos horas de foco al dia',
   'trabajo profundo concentracion', 'productividad', 80),
  ('Entrenar cuando no te apetece: el sistema de la barrera minima',
   'entrenar sin motivacion constancia', 'entrenamiento', 70),
  ('Presupuesto personal en una hoja: el metodo mas simple que funciona',
   'presupuesto personal simple', 'finanzas', 60),
  ('Identidad antes que objetivos: por que fallan los propositos',
   'cambiar habitos identidad', 'mentalidad', 50),
  ('Poner limites sin romper la relacion',
   'como poner limites', 'relaciones', 40);


-- -----------------------------------------------------------------------------
-- Articulos de ejemplo (uno publicado, uno borrador)
--
-- Sirven para comprobar que `anon` ve el publicado y no ve el borrador.
-- -----------------------------------------------------------------------------

insert into public.articles
  (slug, titulo, meta_description, contenido_md, categoria, autor_id,
   estado, fecha_publicacion, tiempo_lectura, keywords)
values
  ('rutina-matinal-que-aguanta-los-dias-malos',
   'La rutina matinal que aguanta los dias malos',
   'Una rutina no sirve si solo funciona cuando tienes ganas. Como disenar una que resista.',
   '## El error de la rutina perfecta' || chr(10) || chr(10) ||
   'La mayoria de rutinas matinales se disenan para el mejor dia del mes.' || chr(10) || chr(10) ||
   '## La version minima' || chr(10) || chr(10) ||
   'Define la version de cinco minutos. Esa es la que cuenta.',
   'disciplina', 'a0000000-0000-4000-8000-000000000001',
   'publicado', now() - interval '2 days', 6,
   array['rutina matinal', 'disciplina', 'habitos']),

  ('borrador-de-prueba-no-visible',
   'Borrador de prueba',
   'No debe ser visible para usuarios anonimos.',
   'Si ves este articulo desde la web publica, la politica RLS de articles esta mal.',
   'mentalidad', 'a0000000-0000-4000-8000-000000000001',
   'draft', null, 3,
   array['prueba']);
