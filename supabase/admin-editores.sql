-- =============================================================================
-- PERMISOS DE EDITOR  ·  panel de administracion
--
-- Pega este fichero en el SQL Editor DESPUES de instalacion-esquema-aislado.sql.
-- Es aditivo: no borra ni modifica nada de lo que ya existe.
--
-- Si instalaste el esquema NORMAL (proyecto dedicado), sustituye `reset_alfa.`
-- por `public.` y `reset_alfa_priv.` por `app.` antes de ejecutarlo.
--
--
-- POR QUE UNA COLUMNA Y NO UNA LISTA DE CORREOS EN EL CODIGO
--
-- Un correo en una variable de entorno se comprueba en la aplicacion, y todo
-- lo que se comprueba en la aplicacion se puede saltar llamando a la API
-- directamente con la anon key, que es publica. El rol vive en la base de
-- datos y lo comprueban las politicas RLS: no hay forma de rodearlo.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1 - Rol de usuario
-- -----------------------------------------------------------------------------

do $$
begin
  create type reset_alfa.usuario_rol as enum ('usuario', 'editor', 'admin');
exception
  when duplicate_object then null;
end $$;

alter table reset_alfa.profiles
  add column if not exists rol reset_alfa.usuario_rol not null default 'usuario';

comment on column reset_alfa.profiles.rol is
  'usuario = solo su propia racha. editor = ademas publica articulos. '
  'admin = ademas gestiona productos y cursos.';


-- El usuario NO puede escribir su propio rol. Sin esta linea, un PATCH desde la
-- consola del navegador bastaria para autoconcederse permisos de editor.
--
-- El orden importa: en PostgreSQL no se puede revocar una columna suelta si
-- existe un GRANT a nivel de tabla; hay que retirar el de tabla y volver a
-- conceder solo lo permitido.
revoke update on reset_alfa.profiles from authenticated;
grant update (nombre, avatar_url, timezone, onboarding_completado)
  on reset_alfa.profiles to authenticated;


-- -----------------------------------------------------------------------------
-- 2 - Comprobacion de rol
--
-- SECURITY DEFINER porque necesita leer `profiles` sin que la RLS de esa tabla
-- interfiera: se llama DESDE las politicas de otras tablas.
-- -----------------------------------------------------------------------------

create or replace function reset_alfa_priv.es_editor(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = reset_alfa, pg_catalog
as $$
  select exists (
    select 1 from reset_alfa.profiles p
    where p.user_id = p_user_id and p.rol in ('editor', 'admin')
  );
$$;

create or replace function reset_alfa_priv.es_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = reset_alfa, pg_catalog
as $$
  select exists (
    select 1 from reset_alfa.profiles p
    where p.user_id = p_user_id and p.rol = 'admin'
  );
$$;


-- Version publica, para que la interfaz sepa si debe pintar el enlace al panel.
-- Que devuelva true no concede nada: el permiso real lo aplican las politicas.
create or replace function reset_alfa.mi_rol()
returns text
language sql
stable
security definer
set search_path = reset_alfa, pg_catalog
as $$
  select coalesce(
    (select p.rol::text from reset_alfa.profiles p where p.user_id = auth.uid()),
    'usuario');
$$;

revoke all on function reset_alfa.mi_rol() from public, anon;
grant execute on function reset_alfa.mi_rol() to authenticated;


-- -----------------------------------------------------------------------------
-- 3 - Politicas de escritura para editores
--
-- Hasta ahora `articles` solo tenia lectura publica de lo publicado; escribir
-- exigia la service_role. Estas politicas permiten que un editor autenticado
-- gestione articulos desde el panel, sin que su navegador toque jamas una clave
-- privilegiada.
-- -----------------------------------------------------------------------------

-- Un editor ve TODOS los articulos, incluidos los borradores. La politica de
-- lectura publica sigue existiendo y sigue limitada a los publicados: PostgreSQL
-- combina varias politicas SELECT con OR, asi que ninguna resta permisos a la
-- otra.
drop policy if exists "articles_editor_read" on reset_alfa.articles;
create policy "articles_editor_read" on reset_alfa.articles
  for select to authenticated
  using (reset_alfa_priv.es_editor((select auth.uid())));

drop policy if exists "articles_editor_insert" on reset_alfa.articles;
create policy "articles_editor_insert" on reset_alfa.articles
  for insert to authenticated
  with check (reset_alfa_priv.es_editor((select auth.uid())));

drop policy if exists "articles_editor_update" on reset_alfa.articles;
create policy "articles_editor_update" on reset_alfa.articles
  for update to authenticated
  using (reset_alfa_priv.es_editor((select auth.uid())))
  with check (reset_alfa_priv.es_editor((select auth.uid())));

drop policy if exists "articles_editor_delete" on reset_alfa.articles;
create policy "articles_editor_delete" on reset_alfa.articles
  for delete to authenticated
  using (reset_alfa_priv.es_editor((select auth.uid())));

-- La instalacion revoco la escritura a `authenticated` sobre estas tablas. Hay
-- que devolverla para que las politicas de arriba puedan aplicarse: sin el
-- GRANT, la politica nunca llega a evaluarse.
grant insert, update, delete on reset_alfa.articles   to authenticated;
grant insert, update, delete on reset_alfa.categorias to authenticated;
grant insert, update, delete on reset_alfa.autores    to authenticated;

-- Categorias y autores: lectura ya es publica; la escritura, solo editores.
drop policy if exists "categorias_editor_write" on reset_alfa.categorias;
create policy "categorias_editor_write" on reset_alfa.categorias
  for all to authenticated
  using (reset_alfa_priv.es_editor((select auth.uid())))
  with check (reset_alfa_priv.es_editor((select auth.uid())));

drop policy if exists "autores_editor_write" on reset_alfa.autores;
create policy "autores_editor_write" on reset_alfa.autores
  for all to authenticated
  using (reset_alfa_priv.es_editor((select auth.uid())))
  with check (reset_alfa_priv.es_editor((select auth.uid())));


-- Banco de temas: sigue sin lectura publica, pero el editor debe poder verlo y
-- gestionarlo desde el panel.
grant select, insert, update, delete on reset_alfa.topic_bank to authenticated;

drop policy if exists "topic_bank_editor" on reset_alfa.topic_bank;
create policy "topic_bank_editor" on reset_alfa.topic_bank
  for all to authenticated
  using (reset_alfa_priv.es_editor((select auth.uid())))
  with check (reset_alfa_priv.es_editor((select auth.uid())));


-- -----------------------------------------------------------------------------
-- 4 - HAZTE ADMINISTRADOR
--
-- Sustituye el correo por el tuyo y ejecuta. Tienes que haber creado la cuenta
-- en la app ANTES: el perfil se crea la primera vez que entras.
-- -----------------------------------------------------------------------------

update reset_alfa.profiles
   set rol = 'admin'
 where user_id = (
   select id from auth.users where email = 'CAMBIA-ESTO@tu-correo.com'
 );


-- -----------------------------------------------------------------------------
-- Comprobacion
-- -----------------------------------------------------------------------------

do $$
declare v_admins int;
begin
  select count(*) into v_admins from reset_alfa.profiles where rol in ('editor','admin');

  if v_admins = 0 then
    raise warning 'No hay ningun editor. Revisa el correo del paso 4: debe coincidir '
                  'exactamente con el de tu cuenta, y tienes que haber entrado en la '
                  'app al menos una vez para que exista tu perfil.';
  else
    raise notice 'Editores y administradores: %', v_admins;
  end if;
end $$;
