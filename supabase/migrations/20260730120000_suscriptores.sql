-- =============================================================================
-- 0012 · SUSCRIPTORES DE CORREO  (Fase 3)
--
-- La lista de correo es el unico activo de audiencia que no depende de Google.
-- Si manana cambia un algoritmo y el trafico organico cae, la lista sigue ahi.
--
-- DOBLE CONFIRMACION (double opt-in). No es opcional:
--   · El consentimiento debe ser demostrable (art. 7.1 RGPD) y una direccion
--     escrita en un formulario no prueba que sea de quien la escribio.
--   · Enviar a direcciones no confirmadas dispara las quejas por spam y arruina
--     la reputacion del dominio, con lo que dejan de llegar TAMBIEN los correos
--     legitimos, incluidos los de compra.
-- =============================================================================

create type public.suscriptor_estado as enum ('pendiente', 'confirmado', 'baja');

create table public.email_subscribers (
  id                uuid                       primary key default gen_random_uuid(),

  -- Se guarda siempre en minusculas (lo impone un trigger): sin ello,
  -- Correo@ejemplo.com y correo@ejemplo.com serian dos suscriptores.
  email             text                       not null unique
                                               check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),

  estado            public.suscriptor_estado   not null default 'pendiente',

  -- De donde vino. Permite saber que articulo capta y cual no.
  origen            text,

  -- Token de un solo uso para confirmar y para darse de baja.
  token             uuid                       not null default gen_random_uuid(),

  version_politica  text,
  ip_hash           text                       check (ip_hash is null or ip_hash ~ '^[a-f0-9]{64}$'),

  created_at        timestamptz                not null default now(),
  confirmado_at     timestamptz,
  baja_at           timestamptz,

  constraint suscriptor_confirmado_coherente check (
    estado <> 'confirmado' or confirmado_at is not null
  )
);

comment on table public.email_subscribers is
  'Lista de correo con doble confirmacion. Escritura reservada a service_role: '
  'el alta pasa por /api/suscribir, que hashea la IP y limita la frecuencia.';

create index email_subscribers_estado_idx on public.email_subscribers (estado);
create index email_subscribers_token_idx  on public.email_subscribers (token);

create or replace function app.normalizar_email()
returns trigger
language plpgsql
as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

create trigger email_subscribers_normalizar
  before insert or update of email on public.email_subscribers
  for each row execute function app.normalizar_email();


-- -----------------------------------------------------------------------------
-- RLS
--
-- Sin ninguna politica: la tabla es inalcanzable salvo para service_role.
--
-- Es deliberado y es importante. Si `anon` pudiera leerla, cualquiera se
-- descargaria la lista de correos completa desde el navegador. Y si pudiera
-- escribir, se podria inundar de altas falsas. El alta pasa por un endpoint de
-- servidor que controla la frecuencia y hashea la IP.
-- -----------------------------------------------------------------------------

alter table public.email_subscribers enable row level security;
