-- =============================================================================
-- 0008 · FORMACION
--
-- El paywall vive en la politica RLS de `lessons`, no en la interfaz.
--
-- Esto importa: si el bloqueo solo estuviera en la pantalla de la app, el
-- contenido premium seguiria siendo accesible con una peticion directa a la
-- API usando la anon key, que es publica por diseno. Con la comprobacion en la
-- base de datos, la fila sencillamente no existe para quien no ha pagado.
-- =============================================================================

create table public.courses (
  id          uuid              primary key default gen_random_uuid(),
  slug        text              not null unique
                                check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),

  titulo      text              not null,
  descripcion text,
  tipo        public.course_tipo not null default 'gratis',

  -- Producto que desbloquea el curso. NULL = acceso libre.
  -- Sin esta columna el paywall de la Fase 4 no tendria como resolver permisos.
  product_id  uuid              references public.products (id) on delete restrict,

  imagen_url  text,
  orden       integer           not null default 0,
  publicado   boolean           not null default true,

  created_at  timestamptz       not null default now(),
  updated_at  timestamptz       not null default now(),

  -- Un curso premium sin producto asociado seria inalcanzable para todos.
  constraint courses_premium_requiere_producto check (
    tipo <> 'premium' or product_id is not null
  )
);

comment on table public.courses is
  'Cursos. tipo=gratis o product_id nulo implican acceso libre; premium exige '
  'entitlement activo sobre product_id.';

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function app.set_updated_at();


create table public.lessons (
  id           uuid        primary key default gen_random_uuid(),
  course_id    uuid        not null references public.courses (id) on delete cascade,

  titulo       text        not null,
  video_url    text,
  contenido_md text,
  orden        integer     not null default 0,

  -- Duracion en segundos. Segundos y no minutos para que el progreso de
  -- reproduccion (`progress.ultima_posicion`) use la misma unidad.
  duracion     integer     check (duracion is null or duracion > 0),

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint lessons_course_orden_unique unique (course_id, orden)
);

comment on column public.lessons.duracion is
  'Duracion en SEGUNDOS, misma unidad que progress.ultima_posicion.';

create index lessons_course_orden_idx on public.lessons (course_id, orden);

create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function app.set_updated_at();


create table public.progress (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users (id) on delete cascade,
  lesson_id        uuid        not null references public.lessons (id) on delete cascade,

  completada       boolean     not null default false,

  -- Posicion de reproduccion en segundos.
  ultima_posicion  integer     not null default 0 check (ultima_posicion >= 0),

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint progress_user_lesson_unique unique (user_id, lesson_id)
);

create index progress_user_idx on public.progress (user_id);

create trigger progress_set_updated_at
  before update on public.progress
  for each row execute function app.set_updated_at();


-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.courses  enable row level security;
alter table public.lessons  enable row level security;
alter table public.progress enable row level security;

-- El catalogo de cursos SI es visible para todos: la pestana Formacion tiene
-- que poder mostrar los titulos premium bloqueados. Lo que no se ve sin pagar
-- son las lecciones.
create policy "courses_public_read"
  on public.courses for select
  to anon, authenticated
  using (publicado);


-- EL PAYWALL.
create policy "lessons_read_si_gratis_o_con_permiso"
  on public.lessons for select
  to authenticated
  using (
    exists (
      select 1
      from public.courses c
      where c.id = lessons.course_id
        and c.publicado
        and (
          c.tipo = 'gratis'
          or c.product_id is null
          or app.has_entitlement((select auth.uid()), c.product_id)
        )
    )
  );

-- `anon` no tiene ninguna politica sobre `lessons`: el contenido formativo
-- exige cuenta, tambien el gratuito.


create policy "progress_select_own"
  on public.progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- El usuario si escribe su propio progreso: es un dato suyo y no desbloquea
-- nada. El WITH CHECK del INSERT ademas exige que la leccion le sea visible,
-- para que no se pueda usar esta tabla como oraculo de IDs de contenido premium.
create policy "progress_insert_own"
  on public.progress for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.lessons l where l.id = progress.lesson_id)
  );

create policy "progress_update_own"
  on public.progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
