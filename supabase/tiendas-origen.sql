-- =============================================================================
-- RESET ALFA - COMPRAS EN LA APP (APP STORE Y GOOGLE PLAY)
--
-- PEGAR ESTE FICHERO SOLO, EN SU PROPIA EJECUCION.
--
-- Anade dos origenes al enum de `entitlements.origen`: la suscripcion Premium
-- puede venir ahora de Stripe (web), de la App Store o de Google Play (app).
-- El servidor web los escribe al recibir el webhook de RevenueCat, que es
-- quien valida los recibos de las dos tiendas.
--
-- Va en su propio fichero por la misma razon que premium-1-tipo.sql:
-- PostgreSQL no permite usar un valor nuevo de un enum en la transaccion que
-- lo crea, y el SQL Editor ejecuta cada pegado como una transaccion.
--
-- Idempotente: `if not exists`.
-- =============================================================================

alter type reset_alfa.entitlement_origen add value if not exists 'apple';
alter type reset_alfa.entitlement_origen add value if not exists 'google';


-- COMPROBACION. Debe salir 4 (stripe, manual, apple, google).
select count(*) as origenes
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
  join pg_namespace n on n.oid = t.typnamespace
 where n.nspname = 'reset_alfa' and t.typname = 'entitlement_origen';
