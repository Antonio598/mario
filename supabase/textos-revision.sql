-- =============================================================================
-- RESET ALFA - AJUSTE DE TEXTOS PARA LA REVISION DE LAS TIENDAS
--
-- Apple rechaza, y puede retirar despues de aprobar, las apps que hacen
-- AFIRMACIONES DE SALUD sin documentacion clinica. No es el tema lo que da
-- problemas -hay muchas apps de habitos sobre esto-, son tres cosas concretas:
--
--   1. Prometer un efecto clinico: "revertir los danos".
--   2. Nombrar una condicion medica: "disfunciones sexuales", "adiccion".
--   3. Afirmar eficacia probada: "el sistema probado".
--
-- El revisor entra con la cuenta de prueba y ve estos textos dentro de la app,
-- asi que no basta con cuidarlos en la ficha.
--
-- Lo que NO se toca: la palabra "pornografia" ni "porno". Describir de que va
-- la app es legitimo y necesario; ocultarlo seria peor, porque la ficha dice
-- una cosa y la app otra. Lo que se quita es la promesa medica.
--
-- Idempotente: son UPDATE por slug, se puede reejecutar.
-- =============================================================================

-- 1. "Como revertir los danos de la pornografia" -> promesa clinica.
update reset_alfa.courses
   set descripcion = 'El papel del consumo de pornografia en el deseo, y como recuperar el control.'
 where slug = 'masterclass-potencia-sexual';

-- 2. "Disfunciones sexuales" es el nombre de una condicion medica.
update reset_alfa.courses
   set titulo      = 'Masterclass: cuando el habito pasa factura',
       descripcion = 'Que ocurre, por que ocurre y como se aborda desde el habito.'
 where slug = 'masterclass-disfunciones-sexuales';

-- 3. "El sistema probado" afirma eficacia demostrada.
update reset_alfa.courses
   set descripcion = 'El sistema para dejar el porno y construir tu linea base.'
 where slug = 'masterclass-reset';

-- 4. "Adiccion" es un diagnostico.
update reset_alfa.courses
   set descripcion = 'Un programa para dejar atras el consumo de pornografia.'
 where slug = 'desencadenado';


-- -----------------------------------------------------------------------------
-- COMPROBACION. Las cuatro filas deben salir con los textos nuevos, y la
-- columna `quedan_promesas` en false.
-- -----------------------------------------------------------------------------
select slug,
       titulo,
       descripcion,
       (descripcion ilike '%revertir%'
        or descripcion ilike '%adicc%'
        or descripcion ilike '%probado%'
        or titulo      ilike '%disfuncion%') as quedan_promesas
  from reset_alfa.courses
 where slug in ('masterclass-potencia-sexual', 'masterclass-disfunciones-sexuales',
                'masterclass-reset', 'desencadenado')
 order by slug;
