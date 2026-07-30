-- =============================================================================
-- 0001 · FUNDACION
--
-- Esquema auxiliar, tipos enumerados y funciones compartidas por el resto de
-- migraciones. No crea ninguna tabla.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Esquema `app`
--
-- PostgREST solo expone el esquema `public`. Todo lo que vive en `app` es
-- inalcanzable desde la API REST: son piezas internas que solo pueden invocarse
-- desde politicas RLS, triggers y funciones del propio servidor.
-- -----------------------------------------------------------------------------

create schema if not exists app;

comment on schema app is
  'Funciones auxiliares internas. No expuesto por PostgREST: nada de aqui es '
  'invocable directamente por un cliente.';

revoke all on schema app from public;
revoke all on schema app from anon;

-- `authenticated` necesita USAGE porque las expresiones de las politicas RLS se
-- evaluan con los privilegios de quien consulta, y algunas llaman a app.*
grant usage on schema app to authenticated, service_role;


-- -----------------------------------------------------------------------------
-- Tipos enumerados
--
-- Se usan enums en vez de CHECK sobre texto para que un valor invalido sea
-- imposible de insertar y para que los tipos TypeScript se generen como uniones
-- literales en vez de `string`.
-- -----------------------------------------------------------------------------

create type public.checkin_estado     as enum ('en_racha', 'recaida');
create type public.article_estado     as enum ('draft', 'aprobado', 'publicado');
create type public.course_tipo        as enum ('gratis', 'premium');
create type public.product_tipo       as enum ('libro', 'reto', 'programa', 'mastermind');
create type public.entitlement_origen as enum ('stripe', 'manual');

create type public.notification_tipo as enum (
  'articulo_diario',
  'recordatorio_checkin',
  'hito',
  'sistema'
);

-- Granularidad del consentimiento (art. 7.2 RGPD: cada finalidad se consiente
-- por separado). `datos_sensibles` cubre el tratamiento de los registros de
-- recaida, que son datos de categoria especial del art. 9.
create type public.consent_tipo as enum (
  'datos_sensibles',
  'marketing_email',
  'push',
  'analitica'
);


-- -----------------------------------------------------------------------------
-- Funciones compartidas
-- -----------------------------------------------------------------------------

-- Mantiene `updated_at` sin depender de que el cliente lo envie.
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function app.set_updated_at() is
  'Trigger BEFORE UPDATE: fija updated_at = now() en el servidor.';


-- Valida que una cadena sea un identificador IANA real.
--
-- Esto no puede ser un CHECK: un CHECK no admite subconsultas, y la lista de
-- zonas horarias vive en el catalogo pg_timezone_names. Una zona invalida en
-- `profiles.timezone` romperia el calculo del dia natural del usuario, que es
-- la base de toda la logica de rachas.
create or replace function app.validate_timezone()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then
    raise exception 'Zona horaria no valida: %', new.timezone
      using errcode = '22023', hint = 'Usa un identificador IANA, p.ej. Europe/Madrid';
  end if;
  return new;
end;
$$;

comment on function app.validate_timezone() is
  'Trigger BEFORE INSERT OR UPDATE OF timezone: rechaza zonas horarias que no '
  'existan en pg_timezone_names.';
