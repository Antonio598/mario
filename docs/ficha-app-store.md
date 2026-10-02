# Ficha de App Store, lista para pegar

Todos los textos estan dentro de los limites de Apple (comprobados). Copia y
pega tal cual en App Store Connect -> tu app -> **1.0 Preparar para el envio**.

**Idioma principal:** Espanol (Espana).

---

## Nombre (max. 30)

```
Reset Alfa
```

## Subtitulo (max. 30)

```
Disciplina, enfoque, libertad
```

## Palabras clave (max. 100, separadas por comas)

Sin espacios despues de las comas: cada espacio gasta un caracter y Apple no
los necesita. No repitas el nombre de la app: ya se indexa solo.

```
nofap,disciplina,habitos,autocontrol,racha,enfoque,constancia,reto,progreso,rutina
```

## URL de soporte

```
https://app.modoguerrero.es/contacto
```

**No uses `modoguerrero.es/contacto`: da 404**, y Apple comprueba ese enlace.

## URL de politica de privacidad

```
https://app.modoguerrero.es/privacidad
```

## Novedades de esta version (max. 4 000)

```
Primera version.
```

---

## Descripcion (max. 4 000)

Lo que NO puede aparecer aqui, porque provoca rechazo o retirada:

- Afirmaciones de salud: testosterona, hormonas, energia, "recuperacion",
  "curar", beneficios fisiologicos. Exigen documentacion clinica que no existe.
- Lenguaje sexual explicito.
- Comparaciones con otras apps o menciones a otras plataformas.

El bloque final de la suscripcion **no es opcional**: la norma 3.1.2 de Apple
obliga a declarar en la ficha el precio, la duracion y los enlaces legales.

```
Dejar un habito no se gana con fuerza de voluntad. Se gana con un sistema.

Reset Alfa es una herramienta de disciplina y autocontrol: cuentas los dias,
registras lo que ocurre y aprendes de tus propios patrones hasta que la
decision deja de negociarse cada manana.

CONTADOR DE RACHA
Los dias que llevas, tu record personal y el total acumulado. Un solo numero,
visible al abrir la app.

CHECK-IN DIARIO
Una pregunta al dia, treinta segundos. Es lo que convierte una intencion en un
registro y lo que sostiene la racha.

BITACORA
Cuando hay una caida, no se tacha el dia y se olvida: se registra que paso,
donde, con que animo y a que hora. Con tres o cuatro entradas tus patrones
dejan de ser una sensacion y se vuelven datos.

P.A.D - PROTOCOLO ANTI-DESEO
Una accion concreta, decidida en frio, para ejecutar cuando aparece el impulso.
No "aguantar": hacer algo distinto.

CARTA ANTI-RECAIDA
Un mensaje que te escribes a ti mismo y que la app te devuelve en el momento en
que mas falta hace.

CALENDARIO Y LOGROS
Tu historial completo mes a mes, y medallas a los 7, 30, 90, 180 y 365 dias.

FORMACION
Masterclasses y protocolos en PDF sobre habitos, foco y constancia.

PRIVACIDAD
Tus registros son tuyos. Puedes exportarlos cuando quieras y eliminar tu cuenta
y todos tus datos desde la propia app, sin escribir a nadie. El detalle de cada
caida solo se guarda si lo autorizas expresamente, y puedes retirar ese permiso
en cualquier momento.

Reset Alfa no es un tratamiento ni sustituye a un profesional sanitario. Es una
herramienta de seguimiento y disciplina.

RESET ALFA PREMIUM
Suscripcion opcional de 9,99 USD al mes que desbloquea la bitacora completa, el
P.A.D, la carta anti-recaida, las medallas y el contador sin limite de dias. La
version gratuita incluye el contador hasta 30 dias, el check-in diario, el
registro de caidas y la formacion.

La suscripcion se renueva automaticamente cada mes salvo que la canceles al
menos 24 horas antes del final del periodo. El cargo se realiza en tu cuenta de
Apple al confirmar la compra. Puedes gestionarla o cancelarla desde los ajustes
de suscripciones de tu cuenta.

Politica de privacidad: https://app.modoguerrero.es/privacidad
Condiciones de uso: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
```

---

## Notas para el revisor (Informacion de revision de la app)

```
Reset Alfa es una herramienta de seguimiento de habitos y disciplina.

La suscripcion Premium se compra con compras integradas de Apple, en
Perfil -> Ver Premium.

La cuenta de demostracion tiene Premium activado para que puedan revisar todas
las funciones sin comprar.

Los unicos enlaces externos abren un libro fisico y la reserva de una sesion de
consultoria presencial, ambos fuera del ambito de las compras integradas
(norma 3.1.3(e)).

La cuenta se puede eliminar por completo desde Perfil -> Eliminar mi cuenta.
```

## Clasificacion por edad

Responde el cuestionario de forma que el resultado sea **17+**. En "Temas
sexuales o desnudos" marca **poco frecuentes / moderados**. Marcarla apta para
todos los publicos es motivo de rechazo y de retirada posterior.

## Privacidad de la app (App Privacy)

Hay que declarar, todo vinculado al usuario y con finalidad "Funcionalidad de
la app":

- **Informacion de contacto** -> correo electronico
- **Informacion confidencial** (*Sensitive Info*) -> si, por el detalle de las
  caidas. **Ocultarlo es motivo de retirada.**
- **Identificadores** -> ID de usuario

No marques publicidad ni seguimiento: la app nativa no tiene anuncios ni
analitica.

## Cifrado

"¿Usa cifrado?" -> **No**. La app solo usa HTTPS estandar, que esta exento, y
ya viene declarado en el codigo (`usesNonExemptEncryption: false`).
