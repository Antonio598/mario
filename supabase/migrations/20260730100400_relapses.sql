-- =============================================================================
-- 0005 · REGISTROS DE RECAIDA  ·  DATOS DE CATEGORIA ESPECIAL (art. 9 RGPD)
--
-- Esta es la tabla mas sensible del sistema. Su contenido describe la vida
-- sexual del usuario. Tratamiento aplicado:
--
--   MINIMIZACION   Todos los campos del formulario son NULL-ables. El usuario
--                  puede saltarse cualquier pregunta sin bloquear el registro.
--   BASE LICITA    Un trigger impide la insercion sin consentimiento explicito
--                  vigente para 'datos_sensibles'. No es un chequeo de UI.
--   CONFIDENCIALIDAD  RLS estricta: ni siquiera otro usuario autenticado puede
--                  llegar a una fila ajena. `anon` no tiene ninguna politica.
--   CIFRADO        Cifrado de disco AES-256 de la plataforma. Ver
--                  docs/gdpr-registro-tratamiento.md para por que no se usa
--                  cifrado de columna.
-- =============================================================================

create table public.relapses (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users (id) on delete cascade,

  -- Un unico registro de detalle por check-in de recaida.
  checkin_id          uuid        not null unique
                                  references public.checkins (id) on delete cascade,

  -- Campos en el mismo orden que las pantallas del formulario Typeform.
  -- "trigger" no es palabra reservada en PostgreSQL: se conserva el nombre
  -- del modelo de datos original.
  lugar               text,
  hora                time,
  trigger             text,
  accion_correctiva   text,
  ejecuto_pad         boolean,
  motivo_fallo        text,
  ajuste_pad          text,
  contexto_ambiental  text,
  contexto_emocional  text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.relapses is
  'Datos de categoria especial (art. 9 RGPD). Insercion bloqueada sin '
  'consentimiento explicito vigente. Todos los campos opcionales por '
  'minimizacion.';
comment on column public.relapses.trigger is
  'Disparador identificado por el usuario. Base del analisis de patrones de la Fase 5.';
comment on column public.relapses.ejecuto_pad is
  'Si el usuario ejecuto su Protocolo Anti-Deseo.';

create index relapses_user_created_idx
  on public.relapses (user_id, created_at desc);

create trigger relapses_set_updated_at
  before update on public.relapses
  for each row execute function app.set_updated_at();


-- -----------------------------------------------------------------------------
-- Base licita del tratamiento, impuesta por el motor
--
-- Sin consentimiento explicito vigente, la insercion falla. Que este control
-- viva en la base de datos y no en la app significa que ningun bug de interfaz,
-- ningun cliente antiguo y ninguna llamada directa a la API puede saltarselo.
-- -----------------------------------------------------------------------------

create or replace function app.require_sensitive_consent()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if not app.has_consent(new.user_id, 'datos_sensibles') then
    raise exception
      'Falta consentimiento explicito para el tratamiento de datos de categoria especial'
      using errcode = '42501',
            hint = 'Registra el consentimiento en public.consents antes de guardar la recaida';
  end if;
  return new;
end;
$$;

create trigger relapses_require_consent
  before insert on public.relapses
  for each row execute function app.require_sensitive_consent();


-- -----------------------------------------------------------------------------
-- RLS
--
-- A diferencia de `checkins`, aqui el cliente si escribe directamente: el
-- detalle de la recaida no participa en ninguna transicion de estado, y el
-- usuario debe poder corregirlo o borrarlo (derecho de rectificacion y
-- supresion, arts. 16 y 17 RGPD).
--
-- El WITH CHECK verifica ademas que el check-in referenciado sea suyo y sea
-- realmente una recaida: impide colgar detalle sensible de un dia ajeno.
-- -----------------------------------------------------------------------------

alter table public.relapses enable row level security;

create policy "relapses_select_own"
  on public.relapses for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "relapses_insert_own"
  on public.relapses for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.checkins c
      where c.id = relapses.checkin_id
        and c.user_id = (select auth.uid())
        and c.estado = 'recaida'
    )
  );

create policy "relapses_update_own"
  on public.relapses for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "relapses_delete_own"
  on public.relapses for delete
  to authenticated
  using ((select auth.uid()) = user_id);
