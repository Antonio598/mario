-- =============================================================================
-- 0003 · CONSENTIMIENTOS  ·  arts. 7 y 9 RGPD
--
-- Los registros de recaida describen la vida sexual del usuario: son datos de
-- categoria especial (art. 9.1). Su tratamiento solo es licito con
-- consentimiento EXPLICITO (art. 9.2.a), y el responsable debe poder DEMOSTRAR
-- que se obtuvo (art. 7.1).
--
-- Por eso esta tabla es un libro de registro de solo insercion. Revocar un
-- consentimiento no borra ni modifica nada: inserta una fila nueva con
-- concedido = false. Asi queda el historico completo de que se consintio,
-- cuando, desde donde y contra que version de la politica de privacidad.
-- =============================================================================

create table public.consents (
  id               uuid                 primary key default gen_random_uuid(),
  user_id          uuid                 not null
                                        references auth.users (id) on delete cascade,

  tipo             public.consent_tipo  not null,
  concedido        boolean              not null,

  -- Version del texto legal que el usuario acepto. Sin esto no se puede probar
  -- QUE acepto exactamente cuando la politica cambie.
  version_politica text                 not null check (char_length(version_politica) > 0),

  origen           text                 not null default 'app'
                                        check (origen in ('app', 'web')),

  -- SHA-256 con sal de servidor (CONSENT_IP_SALT). Nunca la IP en claro: sirve
  -- como prueba de origen sin conservar un dato personal innecesario.
  ip_hash          text                 check (ip_hash is null or ip_hash ~ '^[a-f0-9]{64}$'),
  user_agent       text,

  created_at       timestamptz          not null default now()
);

comment on table public.consents is
  'Libro de registro de consentimientos, solo insercion. Prueba documental '
  'exigida por el art. 7.1 RGPD. Revocar = insertar fila con concedido=false.';

create index consents_user_tipo_idx
  on public.consents (user_id, tipo, created_at desc);


-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.consents enable row level security;

create policy "consents_select_own"
  on public.consents for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "consents_insert_own"
  on public.consents for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Sin UPDATE ni DELETE por diseno. Un registro que se puede alterar no sirve
-- como prueba: dejaria de acreditar nada ante una inspeccion.


-- -----------------------------------------------------------------------------
-- Estado vigente de un consentimiento
--
-- Devuelve la ultima decision del usuario para esa finalidad. Ausencia de
-- registro = false: el consentimiento nunca se presume (art. 4.11 RGPD, el
-- silencio no es consentimiento).
-- -----------------------------------------------------------------------------

create or replace function app.has_consent(p_user_id uuid, p_tipo public.consent_tipo)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    (
      select c.concedido
      from public.consents c
      where c.user_id = p_user_id
        and c.tipo = p_tipo
      order by c.created_at desc
      limit 1
    ),
    false
  );
$$;

comment on function app.has_consent(uuid, public.consent_tipo) is
  'Ultima decision del usuario para esa finalidad. Sin registro devuelve false: '
  'el consentimiento no se presume.';
