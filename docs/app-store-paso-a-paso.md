# App Store, paso a paso

Guía concreta para publicar **Reset Alfa** en la App Store de Apple. Complementa
[`publicar-en-tiendas.md`](./publicar-en-tiendas.md) (la estrategia y los
riesgos) con el «qué pulso y en qué orden».

Está dividida en **lo que haces tú** (cuentas, pagos, ficha, revisión) y **lo
que hago yo** (código, assets, builds). Los pasos de ambos se cruzan: los tuyos
de la parte 1 pueden empezar hoy y no dependen de nada mío.

---

## Estado de la app nativa (actualizado)

La app nativa de `apps/mobile` **tiene ya todo lo de la web**: test de entrada,
contador con tope en gratis, check-in, Bitácora de NOFAP con consentimiento,
P.A.D, carta anti-recaída, logros, landings de hito con vídeo, Formación,
Tienda, Perfil con eliminación de cuenta. Tiene icono, pantalla de arranque y
la configuración de EAS preparada. Metro la empaqueta entera sin errores.

**Premium se vende también en la app**, con el sistema de compra de Apple y de
Google a través de RevenueCat (norma 3.1.1: contenido digital solo con su
sistema, comisión del 15 %). El paywall nativo enseña el precio que devuelve
la tienda, y una compra en la app desbloquea también la web, y al revés. La
configuración en RevenueCat, App Store Connect y Google Play está en
[`compras-en-la-app.md`](compras-en-la-app.md). Mientras no estén las claves
en el build, la app no enseña botón de compra: dice «Incluido en Reset Alfa
Premium. El acceso se gestiona desde tu cuenta en la web».

**La eliminación de cuenta** (norma 5.1.1(v)) borra datos e identidad por
defecto; ya no hay nada que decidir.

---

## Parte 1 — Lo que haces tú (puedes empezar hoy)

### 1.1 Apple ID con verificación en dos pasos

Necesitas un Apple ID **con verificación en dos pasos activada** (en el iPhone:
Ajustes → tu nombre → Inicio de sesión y seguridad). Apple no deja entrar en el
programa de desarrolladores sin ella.

Usa un Apple ID del **negocio**, no el personal: quedará ligado a la app para
siempre y es el que recibirá los correos de revisión.

### 1.2 Alta en el Apple Developer Program — 99 USD/año

1. Entra en <https://developer.apple.com/programs/enroll/> con ese Apple ID.
2. Elige el tipo de cuenta:

   | Tipo | Requiere | Plazo | En la App Store aparece |
   |---|---|---|---|
   | **Individual** | DNI y tarjeta | 24-48 h | Tu nombre y apellidos |
   | **Organización** | Empresa con **número D-U-N-S** | 1-3 semanas | El nombre de la empresa |

   Si Modo Guerrero es una empresa y quieres que salga «Modo Guerrero» como
   desarrollador, necesitas Organización. El D-U-N-S es gratis en
   <https://developer.apple.com/enroll/duns-lookup/> pero tarda 1-2 semanas en
   emitirse, y Apple tarda otra en verificar. **Si vas a ir por ahí, pídelo
   hoy.**

   Individual es más rápido y se puede migrar a Organización más adelante.

3. Paga los 99 USD. Es anual: si no se renueva, la app desaparece de la tienda.
4. Espera el correo de bienvenida. Hasta que llegue no puedes hacer nada más.

### 1.3 Cuenta en Expo (gratis) — HECHO

La app se compila en la nube de Expo (EAS Build) porque compilar para iPhone
exige un Mac, y tu trabajas en Windows. Yo tambien.

Ya esta todo: cuenta `antoniomaya`, sesion iniciada en tu equipo (el CLI la
aprueba desde el navegador, sin contrasena) y proyecto creado con `eas init`:

| Dato | Valor |
|---|---|
| Cuenta | `antoniomaya` (en minusculas; es el `owner` de `app.config.ts`) |
| Proyecto | `@antoniomaya/reset-alfa` |
| Project ID | `9e4f12ca-5d39-40be-a713-847ae3eb86da`, ya fijado en `app.config.ts` |

El plan gratuito da ~30 builds al mes, de sobra. Si algun dia pierdes la
sesion, se recupera con `npx eas-cli@latest login` en `apps/mobile`: abre el
navegador para aprobarla y no pide contrasena en la terminal.

### 1.4 Cuenta de prueba para el revisor

Apple entra en la app con un usuario real para revisarla. **Sin cuenta de
prueba te rechazan al primer intento**, porque toda la app esta detras del
inicio de sesion. Google pide lo mismo.

**1. El correo.** Usa `israelmayalara+revisor@gmail.com`. El `+algo` es un
alias de Gmail: llega a tu bandeja de siempre, asi que puedes confirmar el
registro sin crear ningun buzon nuevo. Apple acepta cualquier direccion.

**2. La contrasena.** Inventa una **solo para esto** y apuntala. Vas a
entregarsela a Apple y queda guardada en App Store Connect: no puede ser la
que usas en ningun otro sitio.

**3. Crea la cuenta** en <https://app.modoguerrero.es>: haz el test de entrada
y registrate con ese correo y esa contrasena. Te llegara un correo de
confirmacion; pulsa el enlace.

**4. Entra una vez en la app.** Es imprescindible: el perfil no existe hasta la
primera entrada, y sin perfil el paso 5 falla. Aprovecha para hacer el
check-in del dia.

**5. Dale Premium.** Abre `supabase/premium-manual.sql`, cambia el correo de la
linea marcada `>>> CAMBIA ESTO <<<` por el del alias, y pegalo en el SQL Editor
de Supabase. Al final sale una fila de comprobacion con `premium = true`. La
fila queda con origen `manual`, asi que ni Stripe ni la tienda la tocan, y no
caduca.

**6. No borres esa cuenta.** Apple la usa en cada actualizacion que envies.

Cuando llegues al paso 3.5 (rellenar la ficha), ese correo y esa contrasena van
en **Informacion de revision de la app -> Se requiere iniciar sesion**.

### 1.5 Capturas de pantalla

Apple exige capturas de **iPhone 6,7"** (1290 × 2796 px). Se hacen desde
TestFlight en tu iPhone (parte 3) o te las genero yo desde un simulador.
Necesitas entre 3 y 10. Las buenas: contador, calendario con la bitácora,
formación, P.A.D.

**Sin lenguaje sexual explícito en las capturas.** Es motivo de rechazo.

### 1.6 Textos de la ficha — YA ESCRITOS

Estan listos y medidos en [`ficha-app-store.md`](ficha-app-store.md): nombre,
subtitulo, palabras clave, descripcion, novedades, notas para el revisor y las
respuestas del cuestionario de privacidad. Se copian y se pegan.

Dos cosas que ya estan resueltas ahi y conviene no tocar:

- La **URL de soporte** es `https://app.modoguerrero.es/contacto`.
  `modoguerrero.es/contacto` da **404**, y Apple comprueba ese enlace: un 404
  es rechazo.
- La descripcion acaba con el **bloque de la suscripcion** (precio, duracion,
  renovacion automatica y los dos enlaces legales). No es relleno: lo exige la
  norma 3.1.2 en la ficha, no solo en la app.

Lo que falta son las **capturas** (1.5), que salen del build de TestFlight.

---

## Parte 2 — Lo que queda en código

Hecho: paridad de funciones, assets, `app.config.ts`, `eas.json`, compra de
Premium en la app (RevenueCat), eliminación de cuenta. Quedan tres cosas que
dependen de ti:

1. ~~**El Project ID de EAS**~~ ✅ Hecho (paso 1.3): cuenta `antoniomaya`,
   proyecto `@antoniomaya/reset-alfa`, ID ya en `app.config.ts`.
2. **RevenueCat + producto de suscripción en App Store Connect**: guía
   [`compras-en-la-app.md`](compras-en-la-app.md), partes 1 y 2. Necesita el
   acuerdo de apps de pago firmado (datos bancarios y fiscales), que tarda
   1-2 días en activarse: **fírmalo el mismo día que te den de alta.**
3. **Primer build de prueba** (`eas build --platform ios --profile preview`),
   que te instalo en el iPhone por TestFlight. Lo lanzo yo en cuanto tenga el
   `projectId` y las claves públicas de RevenueCat.

**Eliminación de cuenta**: el botón «Eliminar mi cuenta» de Perfil llama a
`/api/cuenta/eliminar`, que borra los datos de Reset Alfa **y** la identidad
(`auth.users`), cancela la suscripción de Stripe si la hay y borra la ficha en
RevenueCat. Como la base está compartida con tu CRM, el usuario desaparece
también de allí; es lo que exige Apple. Requiere `SUPABASE_SERVICE_ROLE_KEY`
en Environment (ya la tienes). Si algún día quisieras conservar la identidad,
`BORRAR_IDENTIDAD_AL_ELIMINAR=false`, pero con eso no pasa la revisión.

---

## Parte 3 — Publicar (juntos)

Cuando tengas la cuenta de Apple y yo el build:

### 3.1 Certificados — EAS los hace solo

Al lanzar el primer build de producción, EAS pide entrar con tu Apple ID y
**genera él los certificados y perfiles de distribución**. No hay que tocar
nada en el portal de Apple. Es el paso que en otras guías ocupa diez páginas;
aquí es responder «sí» dos veces.

Lo hago yo, pero **necesito que tú metas tu Apple ID y el código de dos pasos
en ese momento**. Lo coordinamos en una llamada de 10 minutos.

### 3.2 Crear la app en App Store Connect

Datos del proyecto, para no volver a buscarlos:

| Dato | Valor |
|---|---|
| Team ID | `JBRSKY3H5L` |
| Bundle ID / App ID | `es.modoguerrero.resetalfa` (Explicit) |
| Capacidades del App ID | In-App Purchase, Sign In with Apple (como *primary*), Push Notifications |
| SKU sugerido | `resetalfa-ios-001` |
| Suscripcion | `es.modoguerrero.resetalfa.premium.mensual`, 9,99 USD/mes |


Tú, en <https://appstoreconnect.apple.com>:

1. **Mis apps → +  → Nueva app**.
2. Plataforma: iOS. Nombre: `Reset Alfa`. Idioma principal: Español (España).
3. **ID del paquete**: `es.modoguerrero.resetalfa` — aparece en la lista
   porque EAS lo registró en el paso 3.1. Si no aparece, es que el 3.1 no ha
   terminado.
4. **SKU**: `resetalfa-ios` (es un identificador interno, no lo ve nadie).
5. Crear.

### 3.3 Subir el build

Yo: `eas submit --platform ios`. El build aparece en App Store Connect →
**TestFlight** en 10-30 minutos, mientras Apple lo procesa.

### 3.4 Probarlo en tu iPhone con TestFlight

1. Instala la app **TestFlight** desde la App Store en tu iPhone.
2. En App Store Connect → TestFlight → **Probadores internos** → añade tu
   Apple ID.
3. Te llega un correo; ábrelo en el iPhone y acepta. La app se instala como
   una app normal con un punto naranja.
4. Pruébala entera: test de entrada, cuenta nueva, check-in, recaída,
   calendario, formación, borrar cuenta. **Aquí es donde hacemos las
   capturas.**

Si algo falla, me lo dices, corrijo, y subo otro build. Cada build nuevo
aparece solo en TestFlight.

### 3.5 Rellenar la ficha

App Store Connect → tu app → **1.0 Preparar para el envío**:

1. **Capturas** de iPhone 6,7" (arrastrar).
2. **Descripción, palabras clave, URL de soporte, URL de privacidad** (de 1.6).
3. **Categoría**: Salud y forma física; secundaria: Estilo de vida.
4. **Clasificación por edad**: responde el cuestionario. Marca **«Temas
   sexuales o desnudos: poco frecuentes/moderados»** y que el resultado sea
   **16+ o 18+** (Apple retiro la escala 17+). El detalle de cada respuesta
   esta en [`ficha-app-store.md`](ficha-app-store.md). Marcarla apta para todos
   es motivo de rechazo y de retirada posterior.
5. **Información de revisión de la app**:
   - **Cuenta de demostración**: el correo y contraseña de 1.4. ✅ Obligatorio.
   - **Notas**: pega esto:

     > Reset Alfa es una herramienta de seguimiento de hábitos y disciplina.
     > La suscripción Premium se compra con compras integradas de Apple
     > (Perfil → Ver Premium). La cuenta de demostración tiene Premium
     > activado para que puedan revisar todas las funciones. Los enlaces
     > externos son a un libro físico y a una sesión de consultoría
     > presencial. La cuenta se puede eliminar desde Perfil → Eliminar mi
     > cuenta.

   - **Contacto**: tu nombre, teléfono y correo. Apple llama si tiene dudas.
6. **Privacidad de la app** (menú lateral → *App Privacy*): responde el
   cuestionario. Hay que marcar:
   - **Información de contacto** → correo electrónico (vinculado al usuario)
   - **Información confidencial** (*Sensitive Info*) → sí, vinculada al usuario
     (por los registros de recaída). **Ocultarlo es motivo de retirada.**
   - **Identificadores** → ID de usuario
   - Finalidad: «Funcionalidad de la app». No marques publicidad ni
     seguimiento: en la app nativa no hay anuncios ni analítica.
7. **Cifrado**: pregunta «¿Usa cifrado?» → **No** (la app usa solo HTTPS
   estándar, que está exento; ya está declarado en el código con
   `usesNonExemptEncryption: false`).
8. **Compras integradas y suscripciones**: añade la suscripción «Premium
   mensual» creada en `compras-en-la-app.md` (2.2). Se revisa junto con la
   app; si no la añades, la app puede aprobarse sin poder vender.
9. **Selecciona el build** subido en 3.3.
10. **Lanzamiento**: «Publicar manualmente esta versión». Así, cuando la
   aprueben, decides tú el día.

### 3.6 Enviar a revisión

Botón **Añadir para revisión** → **Enviar**.

- Apple responde en **24-48 h** normalmente.
- Estados: *Esperando revisión → En revisión → Listo para distribución* (o
  *Rechazada*).
- Si rechazan, llega un mensaje en **Resolution Center** con el motivo y la
  norma. Me lo pasas tal cual: casi siempre se resuelve con una respuesta o un
  cambio pequeño y se reenvía. No cuenta como «strike».

### 3.7 Publicar

Con «Listo para distribución», pulsa **Publicar esta versión**. Tarda unas horas
en aparecer en todas las tiendas del mundo.

---

## Después de publicar

- **Version 1.1: notificaciones push.** Decidido no meterlas en la 1.0. El plan
  y las piezas que faltan estan en [`notificaciones.md`](notificaciones.md). La
  capacidad *Push Notifications* ya esta marcada en el App ID a proposito:
  activarla despues obligaria a regenerar los perfiles de firma.
- **Cada actualización** repite 3.3 → 3.5 (solo capturas y novedades) → 3.6.
  Revisión de 24 h en la mayoría de los casos.
- **La suscripción anual** de Apple se renueva sola si dejas la tarjeta; si
  caduca, la app se retira de la tienda hasta que pagues.
- **Google Play** es un proceso distinto con su propia guía; está resumido en
  `publicar-en-tiendas.md`. Recuerda los 12 probadores durante 14 días si la
  cuenta es de particular.

---

## Resumen de plazos

| Bloque | Quién | Cuándo |
|---|---|---|
| Alta en Apple (individual) | Tú | 1-2 días, **empieza hoy** |
| Alta en Apple (organización) | Tú | 2-4 semanas, **pide el D-U-N-S hoy** |
| Cuenta Expo + usuario de prueba | Tú | 15 minutos |
| App nativa al día + assets | Yo | **Hecho** |
| RevenueCat + suscripción en App Store Connect | Tú (con la guía) | 1 h, más 1-2 días del acuerdo de pago |
| `eas init` | Hecho | ✅ |
| Primer build + TestFlight | Juntos | 1-2 días |
| TestFlight, capturas, ficha | Juntos | 2-3 días |
| Revisión de Apple | Apple | 1-2 días (más si rechazan) |

**Total realista: 1-2 semanas** desde hoy si la cuenta es individual, contando la revisión.
