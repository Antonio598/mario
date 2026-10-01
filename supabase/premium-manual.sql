-- =============================================================================
-- RESET ALFA - DAR PREMIUM A MANO
--
-- Para la cuenta de prueba del revisor de Apple y Google, y para cualquier
-- acceso de cortesia. No pasa por Stripe ni por la tienda: la fila queda con
-- origen 'manual', que ni el webhook de Stripe ni el de RevenueCat tocan.
--
-- ANTES DE EJECUTARLO: la cuenta tiene que existir y haber entrado en la app
-- al menos una vez. El perfil se crea en la primera entrada.
--
-- Cambia el correo de la linea de abajo. Es lo UNICO que hay que cambiar.
--
-- Idempotente: reejecutarlo renueva la fecha, no duplica nada.
-- =============================================================================

do $$
declare
  -- >>>  CAMBIA ESTO  <<<
  v_email    text := 'CAMBIA-ESTO@tu-correo.com';
  -- Cuanto dura el acceso. null = para siempre.
  v_duracion interval := null;

  v_user_id  uuid;
begin
  select id into v_user_id from auth.users where lower(email) = lower(v_email);

  if v_user_id is null then
    raise exception 'No existe ninguna cuenta con el correo %. Creala en la app primero.', v_email;
  end if;

  -- Premium
  insert into reset_alfa.entitlements (user_id, product_id, origen, activo, expires_at)
  values (v_user_id, 'b0000000-0000-4000-8000-000000000010', 'manual', true,
          case when v_duracion is null then null else now() + v_duracion end)
  on conflict (user_id, product_id) do update
     set origen = 'manual', activo = true, expires_at = excluded.expires_at,
         cancel_at_period_end = false;

  -- El test de entrada, por si la cuenta se creo sin hacerlo: sin esto la app
  -- manda al embudo en cada arranque y el revisor no ve nada mas.
  update reset_alfa.profiles
     set onboarding_completado = true
   where user_id = v_user_id and not onboarding_completado;

  raise notice 'Premium concedido a % (%).', v_email, v_user_id;
end $$;


-- -----------------------------------------------------------------------------
-- COMPROBACION. Debe salir una fila con premium = true.
-- -----------------------------------------------------------------------------
select u.email,
       e.origen,
       e.activo,
       e.expires_at,
       p.onboarding_completado,
       (e.activo and (e.expires_at is null or e.expires_at > now())) as premium
  from reset_alfa.entitlements e
  join auth.users u on u.id = e.user_id
  left join reset_alfa.profiles p on p.user_id = e.user_id
 where e.product_id = 'b0000000-0000-4000-8000-000000000010'
   and e.origen = 'manual';
