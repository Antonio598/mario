-- =============================================================================
-- 0004 · RACHAS Y CHECK-INS
--
-- Reglas de negocio (se implementan en el RPC de la Fase 2, pero las
-- restricciones que las hacen imposibles de violar viven aqui):
--
--   · Un check-in por usuario y dia natural, en la zona horaria del usuario.
--   · estado = 'recaida' cierra la racha activa, actualiza record_personal si
--     procede y abre una racha nueva a cero al dia siguiente.
--   · Los dias sin check-in NO rompen la racha: quedan como "sin registro".
--   · dias_totales acumula todos los dias marcados 'en_racha' del historico.
-- =============================================================================

create table public.streaks (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,

  fecha_inicio  date        not null,
  fecha_fin     date,

  -- Longitud de la racha: dias acumulados si esta activa, longitud final si ya
  -- se cerro. Los agregados de usuario (record, total) viven en `profiles`.
  dias_actuales integer     not null default 0 check (dias_actuales >= 0),

  activa        boolean     not null default true,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Una racha activa no tiene fin; una cerrada siempre lo tiene.
  constraint streaks_fin_coherente check (
    (activa and fecha_fin is null) or (not activa and fecha_fin is not null)
  ),
  constraint streaks_rango_valido check (
    fecha_fin is null or fecha_fin >= fecha_inicio
  )
);

comment on table public.streaks is
  'Rachas del usuario. Como maximo una activa, garantizado por indice unico '
  'parcial.';

-- El motor garantiza la invariante: jamas dos rachas activas para el mismo
-- usuario, ni siquiera ante dos peticiones simultaneas.
create unique index streaks_una_activa_por_usuario
  on public.streaks (user_id)
  where activa;

create index streaks_user_inicio_idx
  on public.streaks (user_id, fecha_inicio desc);

create trigger streaks_set_updated_at
  before update on public.streaks
  for each row execute function app.set_updated_at();


create table public.checkins (
  id         uuid                   primary key default gen_random_uuid(),
  user_id    uuid                   not null references auth.users (id) on delete cascade,

  -- Racha a la que pertenece. ON DELETE SET NULL para que depurar rachas nunca
  -- destruya el historico del calendario.
  streak_id  uuid                   references public.streaks (id) on delete set null,

  fecha      date                   not null,
  estado     public.checkin_estado  not null,

  created_at timestamptz            not null default now(),

  -- La regla "un check-in por dia natural" la impone el motor, no la app.
  constraint checkins_user_fecha_unique unique (user_id, fecha)
);

comment on table public.checkins is
  'Un registro por usuario y dia natural. La ausencia de fila significa "sin '
  'registro" y NO rompe la racha.';

create index checkins_user_fecha_idx
  on public.checkins (user_id, fecha desc);


-- -----------------------------------------------------------------------------
-- Un check-in nunca puede ser futuro
--
-- Se compara contra el dia natural del propio usuario, no contra UTC ni contra
-- la fecha del dispositivo. Sin esto, adelantar el reloj del movil bastaria
-- para inflar la racha.
-- -----------------------------------------------------------------------------

create or replace function app.validate_checkin_fecha()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if new.fecha > app.today_for_user(new.user_id) then
    raise exception 'No se puede registrar un check-in en el futuro (%)', new.fecha
      using errcode = '22007';
  end if;
  return new;
end;
$$;

create trigger checkins_validate_fecha
  before insert or update of fecha on public.checkins
  for each row execute function app.validate_checkin_fecha();


-- -----------------------------------------------------------------------------
-- RLS
--
-- Solo lectura para el cliente. Deliberadamente NO hay politicas de escritura.
--
-- Registrar un check-in implica una transicion con varios pasos (cerrar racha,
-- actualizar record_personal, acumular dias_totales, abrir racha nueva). Si el
-- cliente pudiera hacer INSERT directo, podria ejecutar la mitad de esa
-- transicion, o falsear una racha de 500 dias. En la Fase 2 se anade un RPC
-- `security definer` que la ejecuta entera y de forma atomica.
-- -----------------------------------------------------------------------------

alter table public.streaks enable row level security;

create policy "streaks_select_own"
  on public.streaks for select
  to authenticated
  using ((select auth.uid()) = user_id);


alter table public.checkins enable row level security;

create policy "checkins_select_own"
  on public.checkins for select
  to authenticated
  using ((select auth.uid()) = user_id);
