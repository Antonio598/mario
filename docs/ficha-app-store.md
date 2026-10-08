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

## Capturas: la regla 2.3.8, que no es la que parece

**Las capturas tienen que ser aptas para 4+, aunque la app este clasificada
18+.** Apple lo dice expresamente: "Even when purchasing is restricted by the
app's rating, this content must meet the requirements for a 4+ rating". Los
metadatos publicos -icono, capturas, subtitulo, descripcion- los ve cualquiera
navegando por la tienda, sin haber descargado nada.

Esto costo un rechazo (2.3.8, 7 oct 2026). Las dos capturas que lo provocaron:

| Pantalla | Que se leia |
|---|---|
| Inicio | "Sin porno", debajo del contador |
| Tienda | "ENERGIA SEXUAL MASCULINA", "retencion seminal", "Transmutacion Sexual" |

**Palabras que no pueden aparecer en una captura**: porno, pornografia, sexual,
sexo, seminal, masturbacion. Y por prudencia tampoco NOFAP, que significa
literalmente lo que significa.

Las tres que si valen y estan en `Capturas/app-store/`: Calendario con logros,
P.A.D, y la pantalla de planes. La descripcion ya esta escrita sin ninguna de
esas palabras; las palabras clave si pueden llevar "nofap" porque no se
muestran al publico.

La pantalla de Inicio es la que mejor explica la app y seria la mejor primera
captura. Para poder usarla hay que cambiar en el codigo el subtitulo del
contador ("Sin porno"), y eso exige un build nuevo.

## Clasificacion por edad (obligatoria antes de enviar)

Apple retiro las escalas 12+ y 17+: ahora son **4+, 9+, 13+, 16+ y 18+**. No se
elige el resultado, se contesta un cuestionario y Apple lo calcula. Respondiendo
con honestidad, esta app sale en **16+ o 18+**, que es donde debe estar.

| Bloque | Respuesta |
|---|---|
| In-App Controls (controles parentales, verificacion de edad) | Ninguno |
| Capabilities (web sin restriccion, contenido de usuarios, redes, mensajeria, publicidad) | Ninguno en todo |
| Mature Themes (lenguaje, terror, alcohol/tabaco/drogas) | Ninguno en todo |
| Medical or Wellness -> **Medical or Treatment Information** | **Ninguno** |
| Medical or Wellness -> Health or Wellness Topics | Poco frecuente / leve |
| Sexuality or Nudity -> **Mature or Suggestive Themes** | **Frecuente / intenso** (*Frequent/Intense*) |
| Sexuality or Nudity -> Sexual Content or Nudity / Graphic | Ninguno |
| Violence (todo) | Ninguno |
| Chance-Based Activities (apuestas, concursos, cajas) | Ninguno en todo |

Las dos filas en negrita son las que importan:

- **Mature or Suggestive Themes: FRECUENTE.** No "poco frecuente": Apple
  rechazo la app por esto (2.3.6, 7 oct 2026) y pidio expresamente "Frequent".
  El criterio no es cuantas pantallas lo mencionan, sino que el tema central de
  la app ES ese; cuando vertebra el producto entero, es frecuente. Da 18+, que
  es donde debe estar.
- **Medical or Treatment Information: ninguno.** La app no da informacion
  medica ni de tratamiento, y lo dice expresamente en su propio texto. Marcar
  "frecuente" aqui obliga ademas a presentar la declaracion de producto
  sanitario regulado.

Por que "Capabilities" va todo a ninguno: lo que el usuario escribe en la
bitacora o en la carta es privado y nunca lo ve nadie mas, asi que no es
contenido generado por usuarios en el sentido de Apple; y la app abre enlaces
concretos en el navegador del sistema, no tiene navegador propio con barra de
direcciones.

### Las otras casillas de esa pantalla

- **App Encryption Documentation**: no subas nada. La app solo usa HTTPS
  estandar, que esta exento, y ya va declarado en el binario.
- **Digital Services Act**: ya figura como comerciante. Hecho.
- **Labels and Markings** y **Vietnam Game License**: no aplican.
- **Regulated Medical Devices**: solo hay que declararlo si la categoria es
  Medicina o Salud y forma fisica. Si eliges **Salud y forma fisica**, entra y
  declara que **no** es un producto sanitario regulado. Con la categoria
  **Estilo de vida** esa declaracion no aparece.

## Privacidad de la app (App Privacy) — casilla por casilla

En **App Privacy -> Recopilacion de datos**, marca estas ocho y NADA mas:

| Seccion | Casilla | De donde sale |
|---|---|---|
| Informacion de contacto | Nombre | `profiles.nombre` |
| Informacion de contacto | Direccion de correo electronico | La cuenta |
| Datos confidenciales | **Informacion confidencial** | Los registros de recaida |
| Contenido del usuario | Otro contenido de usuario | P.A.D, carta y respuestas de la bitacora |
| Identificadores | ID de usuario | El id de Supabase |
| Identificadores | ID del dispositivo | Lo recoge el SDK de RevenueCat |
| Compras | Compras | El estado de la suscripcion |
| Datos de uso | Interaccion del producto | RevenueCat registra cuando se abre la app |

Para las ocho, las tres preguntas siguientes se responden igual:

- Finalidad: **Funcionalidad de la app**, y ninguna mas.
- Vinculado a la identidad del usuario: **Si**.
- Usado para seguimiento (tracking): **NO**. Decir que si obliga a pedir el
  permiso de seguimiento de Apple, que esta app no implementa: seria rechazo.

### Lo que NO se marca

**Salud** es la importante: marcarla mete la app en datos medicos, activa la
declaracion de producto sanitario regulado y abre la puerta a que pidan
documentacion clinica. La app dice expresamente que no es un tratamiento.

Tampoco: Aptitud fisica, Informacion financiera (la de pago la gestiona Apple
y el propio formulario dice que no hay que declararla), Ubicacion, Contactos,
Fotos, Audio, Correos, Historial de navegacion o busqueda, Diagnostico,
Alrededores, Cuerpo.

### Dos criterios, por si se revisan en el futuro

- **Informacion confidencial**: la lista de Apple menciona orientacion sexual,
  no conducta sexual, asi que seria discutible. Se marca igual porque el RGPD
  si considera los datos sobre la vida sexual de categoria especial, y
  declarar de mas nunca provoca rechazo mientras que declarar de menos provoca
  retiradas.
- **Interaccion del producto**: la app no lleva analitica propia, pero el panel
  de RevenueCat muestra "Last opened the app". Es interaccion y hay que
  declararla aunque no sea codigo nuestro.

## Cifrado

"¿Usa cifrado?" -> **No**. La app solo usa HTTPS estandar, que esta exento, y
ya viene declarado en el codigo (`usesNonExemptEncryption: false`).
