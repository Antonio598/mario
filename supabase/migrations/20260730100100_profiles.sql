-- =============================================================================
-- 0002 · PERFILES
--
-- Un perfil por usuario de auth. Se crea automaticamente al registrarse y se
-- borra en cascada al eliminar la cuenta.
--
-- NOTA DE DISENO: `record_personal` y `dias_totales` viven aqui, no en
-- `streaks`. Son agregados a nivel de usuario; en `streaks` se duplicarian en
-- cada fila historica y toda escritura tendria que actualizar N filas, lo que
-- garantiza divergencia con el tiempo. Aqui hay una unica fuente de verdad.
-- =============================================================================

create table public.profiles (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null unique
                                    references auth.users (id) on delete cascade,

  nombre                text        not null
                                    check (char_length(nombre) between 1 and 80),
  avatar_url            text        check (avatar_url is null or avatar_url ~ '^https?://'),

  -- Zona horaria IANA. Determina cuando empieza el "dia natural" de este
  -- usuario y por tanto cuando puede hacer su check-in. Validada por trigger.
  timezone              text        not null default 'Europe/Madrid',

  -- Agregados historicos. Los mantiene el RPC de check-in (Fase 2), nunca el
  -- cliente: no hay politica de UPDATE que permita tocarlos desde el device.
  record_personal       integer     not null default 0 check (record_personal >= 0),
  dias_totales          integer     not null default 0 check (dias_totales >= 0),

  onboarding_completado boolean     not null default false,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil de usuario. Fuente unica de verdad de los agregados de racha '
  '(record_personal, dias_totales).';
comment on column public.profiles.timezone is
  'Identificador IANA. Base del calculo del dia natural del usuario.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function app.set_updated_at();

create trigger profiles_validate_timezone
  before insert or update of timezone on public.profiles
  for each row execute function app.validate_timezone();


-- -----------------------------------------------------------------------------
-- Dia natural del usuario
--
-- Se define aqui y no en 0001 porque depende de `profiles`: las funciones SQL
-- validan su cuerpo al crearse y fallarian si la tabla aun no existe.
--
-- Toda la logica de rachas de la Fase 2 se apoya en esta funcion. El servidor
-- nunca confia en la fecha que envie el dispositivo.
-- -----------------------------------------------------------------------------

create or replace function app.today_for_user(p_user_id uuid)
returns date
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select (
    now() at time zone coalesce(
      (select p.timezone from public.profiles p where p.user_id = p_user_id),
      'Europe/Madrid'
    )
  )::date;
$$;

comment on function app.today_for_user(uuid) is
  'Fecha natural actual en la zona horaria del usuario. Nunca se usa la fecha '
  'del dispositivo: seria manipulable.';


-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;

-- `(select auth.uid())` en vez de `auth.uid()` a proposito: envuelto en
-- subconsulta, Postgres lo evalua una sola vez como InitPlan en lugar de una
-- vez por fila. Es la diferencia entre un seq scan barato y uno caro.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Sin politicas de INSERT ni DELETE de forma deliberada:
--   · el alta la hace el trigger on_auth_user_created
--   · la baja la hace el ON DELETE CASCADE al eliminar auth.users
-- Asi es imposible tener un usuario sin perfil o un perfil huerfano.

-- Blindaje por columna: aunque la politica de UPDATE le deje escribir su fila,
-- el usuario no puede tocar sus propias estadisticas. Solo las mueve el RPC de
-- check-in de la Fase 2. Sin esto, falsear una racha de 500 dias seria un
-- PATCH desde la consola del navegador.
--
-- El orden importa: en PostgreSQL no se puede revocar el privilegio de una
-- columna suelta si existe un GRANT a nivel de tabla; ese GRANT seguiria
-- autorizando la escritura. Hay que retirar primero el de tabla y volver a
-- conceder solo las columnas permitidas.
revoke update on public.profiles from authenticated;
grant update (nombre, avatar_url, timezone, onboarding_completado)
  on public.profiles to authenticated;


-- -----------------------------------------------------------------------------
-- Alta automatica de perfil
--
-- Cubre los tres proveedores: email, Google y Apple.
--
-- Apple solo devuelve el nombre en el PRIMER inicio de sesion y suele entregar
-- un email de relay privado. Por eso el coalesce degrada hasta el local-part
-- del correo: es un marcador de posicion razonable que el onboarding sustituye.
-- -----------------------------------------------------------------------------

create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.profiles (user_id, nombre, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Guerrero'
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();
