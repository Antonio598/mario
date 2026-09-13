-- =============================================================================
-- RESET ALFA - PREMIUM, PASO 1 DE 2: EL TIPO DE PRODUCTO
--
-- PEGAR ESTE FICHERO SOLO, EN SU PROPIA EJECUCION.
--
-- PostgreSQL no permite USAR un valor nuevo de un enum dentro de la misma
-- transaccion en que se anade, y el SQL Editor ejecuta cada pegado como una
-- transaccion. Si esto fuera en el mismo fichero que la fila del producto,
-- fallaria con "unsafe use of new value". Por eso son dos ficheros.
--
-- Idempotente: `if not exists`.
-- =============================================================================

alter type reset_alfa.product_tipo add value if not exists 'suscripcion';


-- COMPROBACION. Debe salir true.
select exists (
  select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
   where n.nspname = 'reset_alfa' and t.typname = 'product_tipo'
     and e.enumlabel = 'suscripcion') as tipo_creado;
