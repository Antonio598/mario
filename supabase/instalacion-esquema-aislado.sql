-- =============================================================================
-- RESET ALFA · INSTALACION EN UN PROYECTO SUPABASE COMPARTIDO
--
-- Pega este fichero entero en el SQL Editor de Supabase y ejecutalo una vez.
-- Es idempotente en lo que puede serlo: si algo falla a mitad, corrige y vuelve
-- a ejecutar (las tablas ya creadas daran error de "ya existe", que es seguro).
--
--
-- COMO SE AISLA DE TU OTRA APP
--
--   reset_alfa       Tablas, tipos y funciones que la API expone. Equivale al
--                    esquema `public` de la instalacion normal.
--   reset_alfa_priv  Funciones internas. PostgREST no lo expone: nada de aqui
--                    es invocable desde un cliente.
--
-- Tu otra app vive en `public` y no se toca. Los nombres no pueden chocar
-- porque estan en esquemas distintos: puedes tener `public.profiles` y
-- `reset_alfa.profiles` conviviendo sin relacion alguna.
--
--
-- LO QUE ESTE AISLAMIENTO **NO** SEPARA  ·  LEE ESTO ANTES DE EJECUTAR
--
-- 1. LA AUTENTICACION ES COMPARTIDA. `auth.users` es unico por proyecto. Quien
--    se registre en tu otra app existira tambien aqui, y al reves. No hay forma
--    de separarlo dentro de un mismo proyecto.
--
-- 2. POR ESO NO HAY TRIGGER SOBRE auth.users. La instalacion normal crea el
--    perfil con un trigger al registrarse. Aqui NO, a proposito: cada alta en
--    tu otra app crearia un perfil de Reset Alfa a alguien que no ha abierto
--    esta app en su vida. El perfil se crea de forma perezosa la primera vez
--    que el usuario usa Reset Alfa (ver `reset_alfa_priv.asegurar_perfil`).
--
-- 3. "ELIMINAR CUENTA" NO BORRA auth.users. En la instalacion normal el borrado
--    del art. 17 RGPD elimina el usuario y todo cae en cascada. Aqui eso
--    expulsaria al usuario TAMBIEN de tu otra app. Por eso `borrar_mis_datos()`
--    borra unicamente los datos de Reset Alfa y deja la identidad intacta.
--    Documenta esa diferencia en tu politica de privacidad.
--
-- Si cualquiera de los tres puntos te incomoda, la alternativa es un proyecto
-- Supabase aparte: aislamiento total y el plan gratuito permite dos proyectos.
--
--
-- DESPUES DE EJECUTAR ESTE FICHERO, DOS PASOS OBLIGATORIOS
--
--   a) Settings > API > Exposed schemas: anade `reset_alfa`.
--      Sin esto la API devuelve 404 en todas las tablas.
--
--   b) En el codigo, los clientes deben apuntar al esquema:
--         createClient(url, key, { db: { schema: 'reset_alfa' } })
--      Hay que hacerlo en apps/web/src/lib/supabase/{client,server,static,admin}.ts
--      y en apps/mobile/src/lib/supabase.ts
-- =============================================================================


-- =============================================================================
-- 1 · ESQUEMAS Y PERMISOS
-- =============================================================================

create schema if not exists reset_alfa;
create schema if not exists reset_alfa_priv;

comment on schema reset_alfa is
  'Reset Alfa (Modo Guerrero). Aislado de public, que pertenece a otra app.';
comment on schema reset_alfa_priv is
  'Funciones internas de Reset Alfa. No expuesto por PostgREST.';

-- Supabase concede privilegios por defecto solo en `public`. En un esquema
-- propio hay que concederlos a mano; si no, la API responde con "permission
-- denied" aunque las politicas RLS sean correctas.
grant usage on schema reset_alfa to anon, authenticated, service_role;

alter default privileges in schema reset_alfa
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema reset_alfa
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema reset_alfa
  grant all on functions to anon, authenticated, service_role;

-- El esquema privado: `authenticated` necesita USAGE porque las politicas RLS
-- se evaluan con sus privilegios y algunas llaman a estas funciones. `anon` no.
revoke all on schema reset_alfa_priv from public;
grant usage on schema reset_alfa_priv to authenticated, service_role;


-- =============================================================================
-- 2 · TIPOS
-- =============================================================================

do $$
begin
  create type reset_alfa.checkin_estado     as enum ('en_racha', 'recaida');
  create type reset_alfa.article_estado     as enum ('draft', 'aprobado', 'publicado');
  create type reset_alfa.course_tipo        as enum ('gratis', 'premium');
  create type reset_alfa.product_tipo       as enum ('libro', 'reto', 'programa', 'mastermind');
  create type reset_alfa.entitlement_origen as enum ('stripe', 'manual');
  create type reset_alfa.suscriptor_estado  as enum ('pendiente', 'confirmado', 'baja');

  create type reset_alfa.notification_tipo as enum (
    'articulo_diario', 'recordatorio_checkin', 'hito', 'sistema');

  -- Granularidad del consentimiento (art. 7.2 RGPD): cada finalidad por
  -- separado. `datos_sensibles` cubre los registros de recaida, que son datos
  -- de categoria especial del art. 9.
  create type reset_alfa.consent_tipo as enum (
    'datos_sensibles', 'marketing_email', 'push', 'analitica');
exception
  when duplicate_object then null;
end $$;


-- =============================================================================
-- 3 · FUNCIONES AUXILIARES
-- =============================================================================

create or replace function reset_alfa_priv.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;


-- Valida un identificador IANA. No puede ser un CHECK: contendria subconsulta.
create or replace function reset_alfa_priv.validate_timezone()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then
    raise exception 'Zona horaria no valida: %', new.timezone
      using errcode = '22023', hint = 'Usa un identificador IANA, p.ej. Europe/Madrid';
  end if;
  return new;
end $$;


-- =============================================================================
-- 4 · PERFILES
--
-- `record_personal` y `dias_totales` viven aqui y no en `streaks`: son
-- agregados de usuario. En streaks se duplicarian en cada fila historica y
-- toda escritura tendria que actualizar N filas.
-- =============================================================================

create table reset_alfa.profiles (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null unique
                                    references auth.users (id) on delete cascade,
  nombre                text        not null check (char_length(nombre) between 1 and 80),
  avatar_url            text        check (avatar_url is null or avatar_url ~ '^https?://'),
  timezone              text        not null default 'Europe/Madrid',
  record_personal       integer     not null default 0 check (record_personal >= 0),
  dias_totales          integer     not null default 0 check (dias_totales >= 0),
  onboarding_completado boolean     not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on reset_alfa.profiles
  for each row execute function reset_alfa_priv.set_updated_at();
create trigger profiles_validate_timezone
  before insert or update of timezone on reset_alfa.profiles
  for each row execute function reset_alfa_priv.validate_timezone();

alter table reset_alfa.profiles enable row level security;

-- `(select auth.uid())` envuelto en subconsulta a proposito: Postgres lo evalua
-- una sola vez como InitPlan en lugar de una vez por fila.
create policy "profiles_select_own" on reset_alfa.profiles for select
  to authenticated using ((select auth.uid()) = user_id);

create policy "profiles_update_own" on reset_alfa.profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- El usuario no puede escribir sus propias estadisticas. El orden importa: en
-- PostgreSQL no se puede revocar una columna suelta si existe un GRANT de
-- tabla; hay que retirar el de tabla y reconceder solo lo permitido.
revoke update on reset_alfa.profiles from authenticated;
grant update (nombre, avatar_url, timezone, onboarding_completado)
  on reset_alfa.profiles to authenticated;


-- Dia natural del usuario. Base de toda la logica de racha: el servidor nunca
-- confia en la fecha del dispositivo, que seria manipulable.
create or replace function reset_alfa_priv.today_for_user(p_user_id uuid)
returns date language sql stable
security definer set search_path = reset_alfa, pg_catalog as $$
  select (now() at time zone coalesce(
    (select p.timezone from reset_alfa.profiles p where p.user_id = p_user_id),
    'Europe/Madrid'))::date;
$$;


-- -----------------------------------------------------------------------------
-- Alta perezosa del perfil
--
-- ESTA ES LA PIEZA CLAVE DEL AISLAMIENTO. La instalacion normal usa un trigger
-- sobre auth.users; aqui no puede ser, porque `auth` es compartido con tu otra
-- app y cada alta alli crearia un perfil de Reset Alfa a alguien que no usa
-- esta app.
--
-- En su lugar, el perfil se crea la primera vez que el usuario llama a
-- cualquier RPC de Reset Alfa. Resultado: solo tienen perfil aqui los usuarios
-- que realmente han abierto esta app.
-- -----------------------------------------------------------------------------
create or replace function reset_alfa_priv.asegurar_perfil(p_user_id uuid)
returns void language plpgsql
security definer set search_path = reset_alfa, auth, pg_catalog as $$
begin
  insert into reset_alfa.profiles (user_id, nombre, avatar_url)
  select
    u.id,
    coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
      'Guerrero'),
    nullif(u.raw_user_meta_data ->> 'avatar_url', '')
  from auth.users u
  where u.id = p_user_id
  on conflict (user_id) do nothing;
end $$;


-- =============================================================================
-- 5 · CONSENTIMIENTOS  ·  arts. 7 y 9 RGPD
--
-- Libro de solo insercion. Revocar no borra: inserta una fila con
-- concedido = false. Un registro que se puede alterar no acredita nada.
-- =============================================================================

create table reset_alfa.consents (
  id               uuid                      primary key default gen_random_uuid(),
  user_id          uuid                      not null references auth.users (id) on delete cascade,
  tipo             reset_alfa.consent_tipo   not null,
  concedido        boolean                   not null,
  version_politica text                      not null check (char_length(version_politica) > 0),
  origen           text                      not null default 'app' check (origen in ('app','web')),
  -- SHA-256 con sal de servidor. Nunca la IP en claro.
  ip_hash          text                      check (ip_hash is null or ip_hash ~ '^[a-f0-9]{64}$'),
  user_agent       text,
  created_at       timestamptz               not null default now()
);

create index consents_user_tipo_idx on reset_alfa.consents (user_id, tipo, created_at desc);

alter table reset_alfa.consents enable row level security;

create policy "consents_select_own" on reset_alfa.consents for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "consents_insert_own" on reset_alfa.consents for insert
  to authenticated with check ((select auth.uid()) = user_id);
-- Sin UPDATE ni DELETE por diseno.


create or replace function reset_alfa_priv.has_consent(
  p_user_id uuid, p_tipo reset_alfa.consent_tipo)
returns boolean language sql stable
security definer set search_path = reset_alfa, pg_catalog as $$
  select coalesce((
    select c.concedido from reset_alfa.consents c
    where c.user_id = p_user_id and c.tipo = p_tipo
    order by c.created_at desc limit 1), false);
$$;


-- =============================================================================
-- 6 · RACHAS Y CHECK-INS
-- =============================================================================

create table reset_alfa.streaks (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  fecha_inicio  date        not null,
  fecha_fin     date,
  dias_actuales integer     not null default 0 check (dias_actuales >= 0),
  activa        boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint streaks_fin_coherente check (
    (activa and fecha_fin is null) or (not activa and fecha_fin is not null)),
  constraint streaks_rango_valido check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

-- El motor garantiza la invariante: jamas dos rachas activas por usuario.
create unique index streaks_una_activa_por_usuario
  on reset_alfa.streaks (user_id) where activa;
create index streaks_user_inicio_idx on reset_alfa.streaks (user_id, fecha_inicio desc);

create trigger streaks_set_updated_at before update on reset_alfa.streaks
  for each row execute function reset_alfa_priv.set_updated_at();


create table reset_alfa.checkins (
  id         uuid                      primary key default gen_random_uuid(),
  user_id    uuid                      not null references auth.users (id) on delete cascade,
  streak_id  uuid                      references reset_alfa.streaks (id) on delete set null,
  fecha      date                      not null,
  estado     reset_alfa.checkin_estado not null,
  created_at timestamptz               not null default now(),
  -- Un check-in por dia natural, impuesto por el motor.
  constraint checkins_user_fecha_unique unique (user_id, fecha)
);

create index checkins_user_fecha_idx on reset_alfa.checkins (user_id, fecha desc);


create or replace function reset_alfa_priv.validate_checkin_fecha()
returns trigger language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
begin
  if new.fecha > reset_alfa_priv.today_for_user(new.user_id) then
    raise exception 'No se puede registrar un check-in en el futuro (%)', new.fecha
      using errcode = '22007';
  end if;
  return new;
end $$;

create trigger checkins_validate_fecha
  before insert or update of fecha on reset_alfa.checkins
  for each row execute function reset_alfa_priv.validate_checkin_fecha();


-- Solo lectura para el cliente. La escritura pasa por los RPC atomicos: si el
-- cliente pudiera insertar directamente, podria ejecutar media transicion o
-- falsear una racha de 500 dias desde la consola.
alter table reset_alfa.streaks  enable row level security;
alter table reset_alfa.checkins enable row level security;

create policy "streaks_select_own" on reset_alfa.streaks for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "checkins_select_own" on reset_alfa.checkins for select
  to authenticated using ((select auth.uid()) = user_id);


-- =============================================================================
-- 7 · RECAIDAS  ·  DATOS DE CATEGORIA ESPECIAL (art. 9 RGPD)
--
-- Todos los campos son opcionales por minimizacion. La insercion sin
-- consentimiento explicito la bloquea un trigger, no la interfaz.
-- =============================================================================

create table reset_alfa.relapses (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users (id) on delete cascade,
  checkin_id         uuid        not null unique
                                 references reset_alfa.checkins (id) on delete cascade,
  lugar              text,
  hora               time,
  trigger            text,
  accion_correctiva  text,
  ejecuto_pad        boolean,
  motivo_fallo       text,
  ajuste_pad         text,
  contexto_ambiental text,
  contexto_emocional text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index relapses_user_created_idx on reset_alfa.relapses (user_id, created_at desc);

create trigger relapses_set_updated_at before update on reset_alfa.relapses
  for each row execute function reset_alfa_priv.set_updated_at();


-- Base licita impuesta por el motor: ningun fallo de interfaz, ningun cliente
-- antiguo y ninguna llamada directa a la API puede saltarselo.
create or replace function reset_alfa_priv.require_sensitive_consent()
returns trigger language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
begin
  if not reset_alfa_priv.has_consent(new.user_id, 'datos_sensibles') then
    raise exception
      'Falta consentimiento explicito para el tratamiento de datos de categoria especial'
      using errcode = '42501';
  end if;
  return new;
end $$;

create trigger relapses_require_consent
  before insert on reset_alfa.relapses
  for each row execute function reset_alfa_priv.require_sensitive_consent();


alter table reset_alfa.relapses enable row level security;

create policy "relapses_select_own" on reset_alfa.relapses for select
  to authenticated using ((select auth.uid()) = user_id);

create policy "relapses_insert_own" on reset_alfa.relapses for insert
  to authenticated with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from reset_alfa.checkins c
      where c.id = relapses.checkin_id
        and c.user_id = (select auth.uid())
        and c.estado = 'recaida'));

create policy "relapses_update_own" on reset_alfa.relapses for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "relapses_delete_own" on reset_alfa.relapses for delete
  to authenticated using ((select auth.uid()) = user_id);


-- =============================================================================
-- 8 · CONTENIDO EDITORIAL  (unico bloque con lectura anonima)
-- =============================================================================

create table reset_alfa.autores (
  id         uuid        primary key default gen_random_uuid(),
  slug       text        not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  nombre     text        not null,
  bio        text        not null,
  avatar_url text,
  url_web    text,
  url_social text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger autores_set_updated_at before update on reset_alfa.autores
  for each row execute function reset_alfa_priv.set_updated_at();


create table reset_alfa.categorias (
  slug             text        primary key check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  nombre           text        not null,
  descripcion      text,
  meta_description text        check (char_length(meta_description) <= 160),
  orden            integer     not null default 0,
  created_at       timestamptz not null default now()
);


create table reset_alfa.articles (
  id                uuid                       primary key default gen_random_uuid(),
  slug              text                       not null unique
                                               check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  titulo            text                       not null check (char_length(titulo) between 1 and 200),
  meta_description  text                       check (char_length(meta_description) <= 160),
  contenido_md      text                       not null,
  categoria         text                       not null references reset_alfa.categorias (slug),
  autor_id          uuid                       references reset_alfa.autores (id),
  estado            reset_alfa.article_estado  not null default 'draft',
  fecha_publicacion timestamptz,
  tiempo_lectura    integer                    check (tiempo_lectura is null or tiempo_lectura > 0),
  keywords          text[]                     not null default '{}',
  og_image_url      text,
  created_at        timestamptz                not null default now(),
  updated_at        timestamptz                not null default now(),
  constraint articles_publicado_requiere_fecha check (
    estado <> 'publicado' or fecha_publicacion is not null)
);

create trigger articles_set_updated_at before update on reset_alfa.articles
  for each row execute function reset_alfa_priv.set_updated_at();

create index articles_publicados_idx on reset_alfa.articles (fecha_publicacion desc)
  where estado = 'publicado';
create index articles_categoria_idx on reset_alfa.articles (categoria, fecha_publicacion desc)
  where estado = 'publicado';


create table reset_alfa.topic_bank (
  id               uuid        primary key default gen_random_uuid(),
  tema             text        not null,
  keyword_objetivo text        not null,
  categoria        text        not null references reset_alfa.categorias (slug),
  prioridad        integer     not null default 0,
  notas            text,
  usado            boolean     not null default false,
  article_id       uuid        references reset_alfa.articles (id) on delete set null,
  created_at       timestamptz not null default now(),
  usado_at         timestamptz
);

create index topic_bank_pendientes_idx on reset_alfa.topic_bank (prioridad desc, created_at)
  where not usado;


alter table reset_alfa.autores    enable row level security;
alter table reset_alfa.categorias enable row level security;
alter table reset_alfa.articles   enable row level security;
alter table reset_alfa.topic_bank enable row level security;

create policy "autores_public_read" on reset_alfa.autores for select
  to anon, authenticated using (true);
create policy "categorias_public_read" on reset_alfa.categorias for select
  to anon, authenticated using (true);

-- La condicion de fecha evita filtrar un articulo programado antes de tiempo.
create policy "articles_public_read" on reset_alfa.articles for select
  to anon, authenticated
  using (estado = 'publicado' and fecha_publicacion <= now());

-- `topic_bank` sin ninguna politica: con RLS activo, solo service_role llega.
-- La estrategia de contenidos no es publica.


-- =============================================================================
-- 9 · PRODUCTOS Y PERMISOS
--
-- La app movil nunca muestra `precio_cents` ni abre un checkout: eso obligaria
-- a usar la compra integrada de Apple y Google, con su comision del 15-30 %.
-- Solo lee `entitlements` y abre `url_web` en el navegador externo.
-- =============================================================================

create table reset_alfa.products (
  id              uuid                     primary key default gen_random_uuid(),
  slug            text                     not null unique
                                           check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  nombre          text                     not null,
  descripcion     text,
  tipo            reset_alfa.product_tipo  not null,
  precio_cents    integer                  not null check (precio_cents >= 0),
  moneda          char(3)                  not null default 'EUR',
  stripe_price_id text                     unique,
  url_web         text,
  imagen_url      text,
  activo          boolean                  not null default true,
  orden           integer                  not null default 0,
  created_at      timestamptz              not null default now(),
  updated_at      timestamptz              not null default now()
);

create trigger products_set_updated_at before update on reset_alfa.products
  for each row execute function reset_alfa_priv.set_updated_at();


create table reset_alfa.entitlements (
  id                         uuid                            primary key default gen_random_uuid(),
  user_id                    uuid                            not null
                                                             references auth.users (id) on delete cascade,
  -- RESTRICT y no CASCADE: borrar un producto comprado dejaria al cliente sin
  -- acceso a algo que pago. Debe fallar y obligar a decidir.
  product_id                 uuid                            not null
                                                             references reset_alfa.products (id) on delete restrict,
  origen                     reset_alfa.entitlement_origen   not null default 'stripe',
  activo                     boolean                         not null default true,
  expires_at                 timestamptz,
  -- Idempotencia de los webhooks: Stripe reintenta las entregas.
  stripe_checkout_session_id text                            unique,
  created_at                 timestamptz                     not null default now(),
  updated_at                 timestamptz                     not null default now(),
  constraint entitlements_user_product_unique unique (user_id, product_id)
);

create index entitlements_user_activos_idx on reset_alfa.entitlements (user_id, product_id)
  where activo;

create trigger entitlements_set_updated_at before update on reset_alfa.entitlements
  for each row execute function reset_alfa_priv.set_updated_at();


create or replace function reset_alfa_priv.has_entitlement(p_user_id uuid, p_product_id uuid)
returns boolean language sql stable
security definer set search_path = reset_alfa, pg_catalog as $$
  select exists (
    select 1 from reset_alfa.entitlements e
    where e.user_id = p_user_id and e.product_id = p_product_id
      and e.activo and (e.expires_at is null or e.expires_at > now()));
$$;


alter table reset_alfa.products     enable row level security;
alter table reset_alfa.entitlements enable row level security;

create policy "products_public_read" on reset_alfa.products for select
  to anon, authenticated using (activo);

create policy "entitlements_select_own" on reset_alfa.entitlements for select
  to authenticated using ((select auth.uid()) = user_id);

-- Sin politicas de escritura: si el usuario pudiera insertar aqui, se
-- regalaria el programa completo desde la consola del navegador.


-- =============================================================================
-- 10 · FORMACION  ·  el paywall vive en la politica RLS de `lessons`
-- =============================================================================

create table reset_alfa.courses (
  id          uuid                  primary key default gen_random_uuid(),
  slug        text                  not null unique
                                    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  titulo      text                  not null,
  descripcion text,
  tipo        reset_alfa.course_tipo not null default 'gratis',
  product_id  uuid                  references reset_alfa.products (id) on delete restrict,
  imagen_url  text,
  orden       integer               not null default 0,
  publicado   boolean               not null default true,
  created_at  timestamptz           not null default now(),
  updated_at  timestamptz           not null default now(),
  constraint courses_premium_requiere_producto check (
    tipo <> 'premium' or product_id is not null)
);

create trigger courses_set_updated_at before update on reset_alfa.courses
  for each row execute function reset_alfa_priv.set_updated_at();


create table reset_alfa.lessons (
  id           uuid        primary key default gen_random_uuid(),
  course_id    uuid        not null references reset_alfa.courses (id) on delete cascade,
  titulo       text        not null,
  video_url    text,
  contenido_md text,
  orden        integer     not null default 0,
  -- Segundos, misma unidad que progress.ultima_posicion.
  duracion     integer     check (duracion is null or duracion > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint lessons_course_orden_unique unique (course_id, orden)
);

create index lessons_course_orden_idx on reset_alfa.lessons (course_id, orden);

create trigger lessons_set_updated_at before update on reset_alfa.lessons
  for each row execute function reset_alfa_priv.set_updated_at();


create table reset_alfa.progress (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users (id) on delete cascade,
  lesson_id       uuid        not null references reset_alfa.lessons (id) on delete cascade,
  completada      boolean     not null default false,
  ultima_posicion integer     not null default 0 check (ultima_posicion >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint progress_user_lesson_unique unique (user_id, lesson_id)
);

create index progress_user_idx on reset_alfa.progress (user_id);

create trigger progress_set_updated_at before update on reset_alfa.progress
  for each row execute function reset_alfa_priv.set_updated_at();


alter table reset_alfa.courses  enable row level security;
alter table reset_alfa.lessons  enable row level security;
alter table reset_alfa.progress enable row level security;

-- El catalogo si es publico: la pestana Formacion debe mostrar los titulos
-- premium bloqueados. Lo que no se ve sin pagar son las lecciones.
create policy "courses_public_read" on reset_alfa.courses for select
  to anon, authenticated using (publicado);

-- EL PAYWALL. Si estuviera solo en la interfaz, el contenido premium seguiria
-- siendo accesible con una peticion directa usando la anon key, que es publica.
create policy "lessons_read_si_gratis_o_con_permiso" on reset_alfa.lessons for select
  to authenticated using (
    exists (
      select 1 from reset_alfa.courses c
      where c.id = lessons.course_id and c.publicado
        and (c.tipo = 'gratis' or c.product_id is null
             or reset_alfa_priv.has_entitlement((select auth.uid()), c.product_id))));

create policy "progress_select_own" on reset_alfa.progress for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "progress_insert_own" on reset_alfa.progress for insert
  to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from reset_alfa.lessons l where l.id = progress.lesson_id));
create policy "progress_update_own" on reset_alfa.progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


-- =============================================================================
-- 11 · NOTIFICACIONES, PUSH Y SUSCRIPTORES
-- =============================================================================

create table reset_alfa.notifications (
  id         uuid                          primary key default gen_random_uuid(),
  user_id    uuid                          not null references auth.users (id) on delete cascade,
  tipo       reset_alfa.notification_tipo  not null,
  titulo     text                          not null,
  cuerpo     text                          not null,
  deeplink   text,
  leida      boolean                       not null default false,
  created_at timestamptz                   not null default now()
);

create index notifications_user_no_leidas_idx
  on reset_alfa.notifications (user_id, created_at desc) where not leida;

alter table reset_alfa.notifications enable row level security;

create policy "notifications_select_own" on reset_alfa.notifications for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "notifications_marcar_leida" on reset_alfa.notifications for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- La politica no puede limitar QUE columnas se tocan; el GRANT si. Sin esto el
-- usuario podria reescribir el titulo y el cuerpo de sus notificaciones.
revoke update on reset_alfa.notifications from authenticated;
grant update (leida) on reset_alfa.notifications to authenticated;


create table reset_alfa.push_tokens (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  token      text        not null unique,
  plataforma text        not null check (plataforma in ('ios','android')),
  activo     boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_idx on reset_alfa.push_tokens (user_id) where activo;

create trigger push_tokens_set_updated_at before update on reset_alfa.push_tokens
  for each row execute function reset_alfa_priv.set_updated_at();

alter table reset_alfa.push_tokens enable row level security;

create policy "push_tokens_select_own" on reset_alfa.push_tokens for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "push_tokens_insert_own" on reset_alfa.push_tokens for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "push_tokens_update_own" on reset_alfa.push_tokens for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "push_tokens_delete_own" on reset_alfa.push_tokens for delete
  to authenticated using ((select auth.uid()) = user_id);


-- Doble confirmacion obligatoria: una direccion escrita en un formulario no
-- prueba que sea de quien la escribio, y enviar a direcciones no confirmadas
-- arruina la reputacion del dominio.
create table reset_alfa.email_subscribers (
  id               uuid                          primary key default gen_random_uuid(),
  email            text                          not null unique
                                                 check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  estado           reset_alfa.suscriptor_estado  not null default 'pendiente',
  origen           text,
  token            uuid                          not null default gen_random_uuid(),
  version_politica text,
  ip_hash          text                          check (ip_hash is null or ip_hash ~ '^[a-f0-9]{64}$'),
  created_at       timestamptz                   not null default now(),
  confirmado_at    timestamptz,
  baja_at          timestamptz,
  constraint suscriptor_confirmado_coherente check (
    estado <> 'confirmado' or confirmado_at is not null)
);

create index email_subscribers_estado_idx on reset_alfa.email_subscribers (estado);

create or replace function reset_alfa_priv.normalizar_email()
returns trigger language plpgsql as $$
begin
  new.email := lower(trim(new.email));
  return new;
end $$;

create trigger email_subscribers_normalizar
  before insert or update of email on reset_alfa.email_subscribers
  for each row execute function reset_alfa_priv.normalizar_email();

-- Sin politicas: si `anon` pudiera leerla, cualquiera se descargaria la lista
-- de correos completa desde el navegador.
alter table reset_alfa.email_subscribers enable row level security;


-- =============================================================================
-- 12 · MOTOR DE RACHAS
--
-- Registrar un check-in no es una escritura: es una transicion de varios pasos
-- (cerrar racha, actualizar record, acumular total, abrir racha nueva). Aqui
-- ocurre entera o no ocurre nada.
--
-- LOS DOS CONTADORES NO MIDEN LO MISMO:
--   dias_actuales  Dias naturales desde fecha_inicio. Un dia sin marcar NO
--                  rompe la racha y sigue contando. Se calcula por diferencia
--                  de fechas, nunca como acumulador.
--   dias_totales   Numero de check-ins 'en_racha' del historico. Mide
--                  constancia, no antiguedad.
-- =============================================================================

-- El primer dia es el dia 1, no el dia 0. Una racha que empieza manana da 0.
create or replace function reset_alfa_priv.longitud_racha(p_inicio date, p_hasta date)
returns integer language sql immutable as $$
  select greatest((p_hasta - p_inicio) + 1, 0);
$$;


create or replace function reset_alfa_priv.racha_activa(p_user_id uuid, p_hoy date)
returns reset_alfa.streaks language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
declare v_racha reset_alfa.streaks%rowtype;
begin
  select * into v_racha from reset_alfa.streaks where user_id = p_user_id and activa;

  if not found then
    insert into reset_alfa.streaks (user_id, fecha_inicio, dias_actuales, activa)
    values (p_user_id, p_hoy, reset_alfa_priv.longitud_racha(p_hoy, p_hoy), true)
    returning * into v_racha;
  end if;

  return v_racha;
end $$;


-- El record se RECALCULA, no se acumula con greatest(). Si el usuario marca
-- "sigo en racha" por la manana con 6 dias y recae por la tarde, un maximo
-- monotonico quedaria congelado en 6, cuando nunca completo mas de 5 dias
-- limpios: el dia en que recaes no es un dia limpio.
create or replace function reset_alfa_priv.recalcular_record(p_user_id uuid, p_hoy date)
returns integer language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
declare v_record integer;
begin
  select coalesce(max(
    case when s.activa then reset_alfa_priv.longitud_racha(s.fecha_inicio, p_hoy)
         else s.dias_actuales end), 0)
  into v_record
  from reset_alfa.streaks s where s.user_id = p_user_id;

  update reset_alfa.profiles set record_personal = v_record where user_id = p_user_id;
  return v_record;
end $$;


create or replace function reset_alfa.estado_diario()
returns jsonb language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
declare
  v_user      uuid := auth.uid();
  v_hoy       date;
  v_racha     reset_alfa.streaks%rowtype;
  v_perfil    reset_alfa.profiles%rowtype;
  v_ultima    date;
  v_hoy_hecho boolean;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  -- Alta perezosa: el perfil se crea la primera vez que el usuario usa la app,
  -- no al registrarse. Ver el comentario de asegurar_perfil.
  perform reset_alfa_priv.asegurar_perfil(v_user);

  v_hoy := reset_alfa_priv.today_for_user(v_user);

  select * into v_perfil from reset_alfa.profiles where user_id = v_user;
  select * into v_racha  from reset_alfa.streaks  where user_id = v_user and activa;
  select max(fecha) into v_ultima from reset_alfa.checkins where user_id = v_user;

  v_hoy_hecho := exists (
    select 1 from reset_alfa.checkins where user_id = v_user and fecha = v_hoy);

  return jsonb_build_object(
    'fecha_local',         v_hoy,
    -- Si el usuario viaja hacia el oeste, su "hoy" puede retroceder a un dia ya
    -- registrado. No se le vuelve a preguntar ni se reescribe nada.
    'necesita_checkin',    not v_hoy_hecho,
    'ultimo_checkin',      v_ultima,
    'racha_actual',        coalesce(reset_alfa_priv.longitud_racha(v_racha.fecha_inicio, v_hoy), 0),
    'racha_inicio',        v_racha.fecha_inicio,
    'record_personal',     coalesce(v_perfil.record_personal, 0),
    'dias_totales',        coalesce(v_perfil.dias_totales, 0),
    'timezone',            coalesce(v_perfil.timezone, 'Europe/Madrid'),
    'consiente_sensibles', reset_alfa_priv.has_consent(v_user, 'datos_sensibles'));
end $$;


create or replace function reset_alfa.registrar_checkin()
returns jsonb language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
declare
  v_user     uuid := auth.uid();
  v_hoy      date;
  v_racha    reset_alfa.streaks%rowtype;
  v_longitud integer;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  perform reset_alfa_priv.asegurar_perfil(v_user);

  v_hoy   := reset_alfa_priv.today_for_user(v_user);
  v_racha := reset_alfa_priv.racha_activa(v_user, v_hoy);

  -- Una racha abierta tras una recaida empieza manana.
  if v_racha.fecha_inicio > v_hoy then
    return jsonb_build_object('registrado', false, 'motivo', 'racha_no_iniciada');
  end if;

  -- Idempotente: un doble toque en el boton no debe sumar dos dias.
  if exists (select 1 from reset_alfa.checkins where user_id = v_user and fecha = v_hoy) then
    return jsonb_build_object('registrado', false, 'motivo', 'ya_registrado')
           || reset_alfa.estado_diario();
  end if;

  insert into reset_alfa.checkins (user_id, streak_id, fecha, estado)
  values (v_user, v_racha.id, v_hoy, 'en_racha');

  v_longitud := reset_alfa_priv.longitud_racha(v_racha.fecha_inicio, v_hoy);

  update reset_alfa.streaks set dias_actuales = v_longitud where id = v_racha.id;
  update reset_alfa.profiles set dias_totales = dias_totales + 1 where user_id = v_user;

  perform reset_alfa_priv.recalcular_record(v_user, v_hoy);

  return jsonb_build_object('registrado', true) || reset_alfa.estado_diario();
end $$;


create or replace function reset_alfa.guardar_recaida(
  p_lugar              text default null,
  p_hora               time default null,
  p_trigger            text default null,
  p_accion_correctiva  text default null,
  p_ejecuto_pad        boolean default null,
  p_motivo_fallo       text default null,
  p_ajuste_pad         text default null,
  p_contexto_ambiental text default null,
  p_contexto_emocional text default null)
returns jsonb language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
declare
  v_user          uuid := auth.uid();
  v_hoy           date;
  v_racha         reset_alfa.streaks%rowtype;
  v_checkin_id    uuid;
  v_longitud      integer := 0;
  v_detalle       boolean := false;
  v_estado_previo reset_alfa.checkin_estado;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  perform reset_alfa_priv.asegurar_perfil(v_user);

  v_hoy := reset_alfa_priv.today_for_user(v_user);

  select id, estado into v_checkin_id, v_estado_previo
  from reset_alfa.checkins where user_id = v_user and fecha = v_hoy;

  -- LA TRANSICION SE EJECUTA UNA SOLA VEZ POR DIA. Si hoy ya consta como
  -- recaida, la racha nueva ya empieza manana; repetirla intentaria cerrarla
  -- con fecha de fin anterior a su inicio. Pasa con una segunda recaida el
  -- mismo dia y al volver atras a completar el formulario.
  if v_estado_previo is distinct from 'recaida' then
    v_racha := reset_alfa_priv.racha_activa(v_user, v_hoy);

    if v_checkin_id is null then
      insert into reset_alfa.checkins (user_id, streak_id, fecha, estado)
      values (v_user, v_racha.id, v_hoy, 'recaida')
      returning id into v_checkin_id;
    else
      update reset_alfa.checkins set estado = 'recaida' where id = v_checkin_id;
    end if;

    -- Longitud final: hasta AYER. El dia de la recaida no cuenta como limpio.
    v_longitud := reset_alfa_priv.longitud_racha(v_racha.fecha_inicio, v_hoy - 1);

    update reset_alfa.streaks
       set activa = false, fecha_fin = v_hoy, dias_actuales = v_longitud
     where id = v_racha.id;

    insert into reset_alfa.streaks (user_id, fecha_inicio, dias_actuales, activa)
    values (v_user, v_hoy + 1, 0, true);

    perform reset_alfa_priv.recalcular_record(v_user, v_hoy);
  else
    select s.dias_actuales into v_longitud
    from reset_alfa.checkins c
    join reset_alfa.streaks s on s.id = c.streak_id
    where c.id = v_checkin_id;
  end if;

  -- Sin consentimiento del art. 9 el check-in se registra igual y el detalle se
  -- descarta: negarse a ceder esos datos no puede impedir usar la app
  -- (art. 7.4 RGPD), y fallar aqui dejaria al usuario sin poder registrar su
  -- recaida justo en el peor momento posible.
  if reset_alfa_priv.has_consent(v_user, 'datos_sensibles') then
    insert into reset_alfa.relapses (
      user_id, checkin_id, lugar, hora, trigger, accion_correctiva,
      ejecuto_pad, motivo_fallo, ajuste_pad, contexto_ambiental, contexto_emocional)
    values (
      v_user, v_checkin_id, p_lugar, p_hora, p_trigger, p_accion_correctiva,
      p_ejecuto_pad, p_motivo_fallo, p_ajuste_pad, p_contexto_ambiental, p_contexto_emocional)
    on conflict (checkin_id) do update set
      lugar = excluded.lugar, hora = excluded.hora, trigger = excluded.trigger,
      accion_correctiva = excluded.accion_correctiva, ejecuto_pad = excluded.ejecuto_pad,
      motivo_fallo = excluded.motivo_fallo, ajuste_pad = excluded.ajuste_pad,
      contexto_ambiental = excluded.contexto_ambiental,
      contexto_emocional = excluded.contexto_emocional;

    v_detalle := true;
  end if;

  return jsonb_build_object(
    'registrado', true, 'checkin_id', v_checkin_id,
    'racha_anterior', v_longitud, 'detalle_guardado', v_detalle)
    || reset_alfa.estado_diario();
end $$;


-- Devuelve solo los dias CON registro. La ausencia significa "sin registro",
-- que es un estado con entidad propia: no rompe la racha.
create or replace function reset_alfa.calendario_mes(p_anio integer, p_mes integer)
returns jsonb language plpgsql stable
security definer set search_path = reset_alfa, pg_catalog as $$
declare
  v_user  uuid := auth.uid();
  v_desde date;
  v_hasta date;
begin
  if v_user is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  v_desde := make_date(p_anio, p_mes, 1);
  v_hasta := (v_desde + interval '1 month')::date - 1;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'fecha', c.fecha, 'estado', c.estado, 'relapse_id', r.id) order by c.fecha)
    from reset_alfa.checkins c
    left join reset_alfa.relapses r on r.checkin_id = c.id
    where c.user_id = v_user and c.fecha between v_desde and v_hasta), '[]'::jsonb);
end $$;


-- =============================================================================
-- 13 · PATRONES DE RECAIDA
--
-- SECURITY INVOKER a proposito, no DEFINER: opera sobre datos del art. 9 y pasa
-- por la RLS, de modo que es imposible por construccion consultar los patrones
-- de otra persona.
--
-- MINIMO DE 3 REGISTROS: con uno o dos, cualquier coincidencia es ruido, y
-- presentar ruido como "tu patron" es peor que no decir nada.
-- =============================================================================

create or replace function reset_alfa.patrones_recaidas()
returns jsonb language plpgsql stable
security invoker set search_path = reset_alfa, pg_catalog as $$
declare v_total integer;
begin
  select count(*) into v_total from reset_alfa.relapses;

  if v_total < 3 then
    return jsonb_build_object('suficientes_datos', false, 'registros', v_total,
      'mensaje', 'Necesitas al menos 3 registros para que los patrones signifiquen algo.');
  end if;

  return jsonb_build_object(
    'suficientes_datos', true,
    'registros', v_total,

    'disparadores', coalesce((select jsonb_agg(x) from (
      select lower(trim(trigger)) as valor, count(*) as veces
      from reset_alfa.relapses where trigger is not null and trim(trigger) <> ''
      group by 1 order by 2 desc limit 5) x), '[]'::jsonb),

    'lugares', coalesce((select jsonb_agg(x) from (
      select lower(trim(lugar)) as valor, count(*) as veces
      from reset_alfa.relapses where lugar is not null and trim(lugar) <> ''
      group by 1 order by 2 desc limit 5) x), '[]'::jsonb),

    -- Franjas anchas: "por la noche" es accionable, "a las 23:41" no.
    'franjas', coalesce((select jsonb_agg(x) from (
      select case
        when extract(hour from hora) between 5  and 11 then 'manana'
        when extract(hour from hora) between 12 and 17 then 'tarde'
        when extract(hour from hora) between 18 and 22 then 'noche'
        else 'madrugada' end as valor, count(*) as veces
      from reset_alfa.relapses where hora is not null
      group by 1 order by 2 desc) x), '[]'::jsonb),

    -- Si el P.A.D no llega a ejecutarse, cambiar su contenido no arregla nada.
    'pad_no_ejecutado', (select count(*) from reset_alfa.relapses where ejecuto_pad = false));
end $$;


-- =============================================================================
-- 14 · DERECHOS DEL INTERESADO  ·  arts. 15, 17 y 20 RGPD
-- =============================================================================

create table reset_alfa.deletion_log (
  user_id    uuid        primary key,
  deleted_at timestamptz not null default now()
);

alter table reset_alfa.deletion_log enable row level security;
-- Sin politicas: inalcanzable salvo por service_role.


create or replace function reset_alfa.export_my_data()
returns jsonb language plpgsql stable
security definer set search_path = reset_alfa, auth, pg_catalog as $$
declare
  v_user_id uuid := auth.uid();
  v_result  jsonb;
begin
  if v_user_id is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'exportado_en', now(),
    'formato',      'reset-alfa/v1',
    'usuario', (select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at)
                from auth.users u where u.id = v_user_id),
    'perfil',          (select to_jsonb(p) from reset_alfa.profiles p where p.user_id = v_user_id),
    'consentimientos', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]'::jsonb)
                        from reset_alfa.consents c where c.user_id = v_user_id),
    'rachas',          (select coalesce(jsonb_agg(to_jsonb(s) order by s.fecha_inicio), '[]'::jsonb)
                        from reset_alfa.streaks s where s.user_id = v_user_id),
    'checkins',        (select coalesce(jsonb_agg(to_jsonb(ch) order by ch.fecha), '[]'::jsonb)
                        from reset_alfa.checkins ch where ch.user_id = v_user_id),
    'recaidas',        (select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at), '[]'::jsonb)
                        from reset_alfa.relapses r where r.user_id = v_user_id),
    'progreso',        (select coalesce(jsonb_agg(to_jsonb(pr)), '[]'::jsonb)
                        from reset_alfa.progress pr where pr.user_id = v_user_id),
    'permisos',        (select coalesce(jsonb_agg(to_jsonb(e)), '[]'::jsonb)
                        from reset_alfa.entitlements e where e.user_id = v_user_id),
    'notificaciones',  (select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at), '[]'::jsonb)
                        from reset_alfa.notifications n where n.user_id = v_user_id))
  into v_result;

  return v_result;
end $$;


-- -----------------------------------------------------------------------------
-- Art. 17 RGPD, ADAPTADO A UN PROYECTO COMPARTIDO
--
-- NO borra `auth.users`: eso expulsaria al usuario TAMBIEN de tu otra app.
-- Borra unicamente los datos de Reset Alfa. La identidad de acceso sobrevive.
--
-- CONSECUENCIA QUE DEBES REFLEJAR EN TU POLITICA DE PRIVACIDAD: aqui "eliminar
-- cuenta" significa "eliminar mis datos de Reset Alfa", no "eliminar mi cuenta
-- del sistema". Si necesitas el borrado total de la identidad, hace falta un
-- proyecto Supabase separado.
-- -----------------------------------------------------------------------------
create or replace function reset_alfa.borrar_mis_datos()
returns void language plpgsql
security definer set search_path = reset_alfa, pg_catalog as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Se requiere sesion iniciada' using errcode = '42501';
  end if;

  insert into reset_alfa.deletion_log (user_id) values (v_user_id)
  on conflict (user_id) do nothing;

  -- Orden explicito: las claves ajenas apuntan a profiles/checkins, no hay
  -- cascada desde ellas porque cuelgan de auth.users, que no se toca.
  delete from reset_alfa.relapses      where user_id = v_user_id;
  delete from reset_alfa.checkins      where user_id = v_user_id;
  delete from reset_alfa.streaks       where user_id = v_user_id;
  delete from reset_alfa.progress      where user_id = v_user_id;
  delete from reset_alfa.notifications where user_id = v_user_id;
  delete from reset_alfa.push_tokens   where user_id = v_user_id;
  delete from reset_alfa.entitlements  where user_id = v_user_id;
  delete from reset_alfa.consents      where user_id = v_user_id;
  delete from reset_alfa.profiles      where user_id = v_user_id;
end $$;


-- =============================================================================
-- 15 · PERMISOS DE EJECUCION
--
-- Se hace al final, cuando ya existen todas las funciones. `anon` no puede
-- ejecutar ninguna: todas exigen sesion.
-- =============================================================================

revoke all on function reset_alfa.estado_diario()                    from public, anon;
revoke all on function reset_alfa.registrar_checkin()                from public, anon;
revoke all on function reset_alfa.calendario_mes(integer, integer)   from public, anon;
revoke all on function reset_alfa.patrones_recaidas()                from public, anon;
revoke all on function reset_alfa.export_my_data()                   from public, anon;
revoke all on function reset_alfa.borrar_mis_datos()                 from public, anon;
revoke all on function reset_alfa.guardar_recaida(
  text, time, text, text, boolean, text, text, text, text)           from public, anon;

grant execute on function reset_alfa.estado_diario()                  to authenticated;
grant execute on function reset_alfa.registrar_checkin()              to authenticated;
grant execute on function reset_alfa.calendario_mes(integer, integer) to authenticated;
grant execute on function reset_alfa.patrones_recaidas()              to authenticated;
grant execute on function reset_alfa.export_my_data()                 to authenticated;
grant execute on function reset_alfa.borrar_mis_datos()               to authenticated;
grant execute on function reset_alfa.guardar_recaida(
  text, time, text, text, boolean, text, text, text, text)            to authenticated;

-- Las tablas creadas ANTES de que se aplicaran los privilegios por defecto no
-- los heredan. Esta linea las cubre todas de una vez.
grant all on all tables    in schema reset_alfa to anon, authenticated, service_role;
grant all on all sequences in schema reset_alfa to anon, authenticated, service_role;

-- Y se vuelven a aplicar las restricciones por columna, que el GRANT masivo
-- anterior acaba de deshacer.
revoke update on reset_alfa.profiles from authenticated;
grant update (nombre, avatar_url, timezone, onboarding_completado)
  on reset_alfa.profiles to authenticated;

revoke update on reset_alfa.notifications from authenticated;
grant update (leida) on reset_alfa.notifications to authenticated;

-- Y se retira la escritura que el GRANT masivo abrio en las tablas que solo
-- deben escribirse por RPC o por service_role.
revoke insert, update, delete on reset_alfa.streaks           from anon, authenticated;
revoke insert, update, delete on reset_alfa.checkins          from anon, authenticated;
revoke insert, update, delete on reset_alfa.entitlements      from anon, authenticated;
revoke insert, update, delete on reset_alfa.articles          from anon, authenticated;
revoke insert, update, delete on reset_alfa.categorias        from anon, authenticated;
revoke insert, update, delete on reset_alfa.autores           from anon, authenticated;
revoke insert, update, delete on reset_alfa.products          from anon, authenticated;
revoke insert, update, delete on reset_alfa.courses           from anon, authenticated;
revoke insert, update, delete on reset_alfa.lessons           from anon, authenticated;
revoke all                    on reset_alfa.topic_bank        from anon, authenticated;
revoke all                    on reset_alfa.email_subscribers from anon, authenticated;
revoke all                    on reset_alfa.deletion_log      from anon, authenticated;
revoke insert, update, delete on reset_alfa.consents          from anon;
revoke all                    on reset_alfa.relapses          from anon;
revoke all                    on reset_alfa.profiles          from anon;
revoke all                    on reset_alfa.progress          from anon;
revoke all                    on reset_alfa.notifications     from anon;
revoke all                    on reset_alfa.push_tokens       from anon;
revoke all                    on reset_alfa.consents          from anon;


-- =============================================================================
-- FIN. Recuerda los dos pasos posteriores:
--   a) Settings > API > Exposed schemas: anade `reset_alfa`
--   b) En el codigo: createClient(url, key, { db: { schema: 'reset_alfa' } })
-- =============================================================================
