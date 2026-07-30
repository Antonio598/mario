-- =============================================================================
-- 0006 · CONTENIDO EDITORIAL
--
-- La web publica es el motor de trafico y la fuente del ingreso publicitario.
-- Estas tablas son las unicas del sistema con lectura anonima.
--
-- `categorias` y `autores` existen como tablas y no como texto libre por dos
-- razones de negocio:
--   · Las paginas de categoria deben tener URLs estables y canonicas propias.
--     Con texto libre, una errata crea una pagina duplicada y canibaliza el
--     posicionamiento.
--   · AdSense rechaza sitios sin autor visible y biografia real. La ficha de
--     autor tiene que ser publica, y `profiles` no lo es ni debe serlo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Autores
-- -----------------------------------------------------------------------------

create table public.autores (
  id         uuid        primary key default gen_random_uuid(),
  slug       text        not null unique
                         check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  nombre     text        not null,
  bio        text        not null,
  avatar_url text,
  url_web    text,
  url_social text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.autores is
  'Ficha publica de autor. Requisito de AdSense (autor visible y biografia '
  'real) y senal E-E-A-T para Google. Separada de `profiles`, que es privada.';

create trigger autores_set_updated_at
  before update on public.autores
  for each row execute function app.set_updated_at();


-- -----------------------------------------------------------------------------
-- Categorias
-- -----------------------------------------------------------------------------

create table public.categorias (
  slug             text        primary key
                               check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  nombre           text        not null,
  descripcion      text,
  meta_description text        check (char_length(meta_description) <= 160),
  orden            integer     not null default 0,
  created_at       timestamptz not null default now()
);

comment on table public.categorias is
  'Taxonomia cerrada. Cada fila genera una pagina indexable /categoria/[slug].';


-- -----------------------------------------------------------------------------
-- Articulos
-- -----------------------------------------------------------------------------

create table public.articles (
  id                uuid                  primary key default gen_random_uuid(),

  -- El slug es la URL. Inmutable en la practica: cambiarlo tras indexar cuesta
  -- el posicionamiento ganado y obliga a una redireccion 301.
  slug              text                  not null unique
                                          check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),

  titulo            text                  not null check (char_length(titulo) between 1 and 200),

  -- Google trunca las meta descriptions por encima de ~160 caracteres.
  meta_description  text                  check (char_length(meta_description) <= 160),

  contenido_md      text                  not null,
  categoria         text                  not null references public.categorias (slug),
  autor_id          uuid                  references public.autores (id),

  estado            public.article_estado not null default 'draft',
  fecha_publicacion timestamptz,

  tiempo_lectura    integer               check (tiempo_lectura is null or tiempo_lectura > 0),
  keywords          text[]                not null default '{}',
  og_image_url      text,

  created_at        timestamptz           not null default now(),
  updated_at        timestamptz           not null default now(),

  -- Un articulo publicado sin fecha romperia el sitemap y el orden del indice.
  constraint articles_publicado_requiere_fecha check (
    estado <> 'publicado' or fecha_publicacion is not null
  )
);

comment on table public.articles is
  'Articulos de la web publica. Escritura reservada a service_role: los crea '
  'n8n en estado draft y solo pasan a publicado tras aprobacion humana.';

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function app.set_updated_at();

-- Indice parcial: la consulta del indice publico y del sitemap solo mira
-- articulos publicados, que son una fraccion del total.
create index articles_publicados_idx
  on public.articles (fecha_publicacion desc)
  where estado = 'publicado';

create index articles_categoria_idx
  on public.articles (categoria, fecha_publicacion desc)
  where estado = 'publicado';

create index articles_estado_idx on public.articles (estado);


-- -----------------------------------------------------------------------------
-- Banco de temas  (alimenta el pipeline n8n + Claude de la Fase 3)
-- -----------------------------------------------------------------------------

create table public.topic_bank (
  id                uuid        primary key default gen_random_uuid(),
  tema              text        not null,
  keyword_objetivo  text        not null,
  categoria         text        not null references public.categorias (slug),

  -- Mayor = antes. El cron diario toma el pendiente de mayor prioridad.
  prioridad         integer     not null default 0,

  notas             text,
  usado             boolean     not null default false,
  article_id        uuid        references public.articles (id) on delete set null,
  created_at        timestamptz not null default now(),
  usado_at          timestamptz
);

comment on table public.topic_bank is
  'Cola de temas para el pipeline diario. Interno: sin ninguna politica RLS, '
  'de modo que solo service_role (n8n) lo alcanza.';

create index topic_bank_pendientes_idx
  on public.topic_bank (prioridad desc, created_at)
  where not usado;


-- -----------------------------------------------------------------------------
-- RLS
--
-- Unico bloque del esquema con lectura para `anon`. Es contenido publico y
-- ese es exactamente el objetivo: que Google lo indexe.
-- -----------------------------------------------------------------------------

alter table public.autores    enable row level security;
alter table public.categorias enable row level security;
alter table public.articles   enable row level security;
alter table public.topic_bank enable row level security;

create policy "autores_public_read"
  on public.autores for select
  to anon, authenticated
  using (true);

create policy "categorias_public_read"
  on public.categorias for select
  to anon, authenticated
  using (true);

-- La condicion de fecha evita que un articulo programado se filtre antes de
-- tiempo por la API, aunque ya este marcado como publicado.
create policy "articles_public_read"
  on public.articles for select
  to anon, authenticated
  using (estado = 'publicado' and fecha_publicacion <= now());

-- `topic_bank` no recibe ninguna politica: con RLS activo y sin politicas,
-- nadie salvo service_role puede leerlo ni escribirlo. Es lo que queremos, la
-- estrategia de contenidos no es publica.

-- Escritura de articulos, categorias y autores: solo service_role, que salta
-- la RLS por definicion. No se crea ninguna politica de INSERT/UPDATE/DELETE.
