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

### 1.3 Cuenta en Expo (gratis)

La app se compila en la nube de Expo (EAS Build) porque compilar para iPhone
exige un Mac, y tú trabajas en Windows. Yo también.

1. Crea una cuenta en <https://expo.dev/signup>.
2. Pásame el **nombre de usuario** (no la contraseña). Yo enlazo el proyecto a
   esa cuenta; el proyecto quedará a tu nombre.

El plan gratuito da ~30 builds al mes, de sobra.

### 1.4 Cuenta de prueba para el revisor

Apple entra en la app con un usuario real para revisarla. **Sin cuenta de
prueba te rechazan al primer intento**, porque toda la app está detrás del
inicio de sesión.

Crea un usuario en la app (`app.modoguerrero.es`) con un correo tipo
`revisor@modoguerrero.es` y una contraseña que puedas dar. Yo le pongo Premium
a mano desde la base para que el revisor vea todo desbloqueado.

### 1.5 Capturas de pantalla

Apple exige capturas de **iPhone 6,7"** (1290 × 2796 px). Se hacen desde
TestFlight en tu iPhone (parte 3) o te las genero yo desde un simulador.
Necesitas entre 3 y 10. Las buenas: contador, calendario con la bitácora,
formación, P.A.D.

**Sin lenguaje sexual explícito en las capturas.** Es motivo de rechazo.

### 1.6 Textos de la ficha

Prepáralos en un documento; se pegan en App Store Connect (parte 3):

| Campo | Límite | Notas |
|---|---|---|
| Nombre | 30 caracteres | `Reset Alfa` |
| Subtítulo | 30 | `Disciplina, enfoque, libertad` |
| Descripción | 4 000 | Hábitos, autocontrol, constancia. **Sin afirmaciones de salud** (nada de testosterona, hormonas, «recuperación») |
| Palabras clave | 100, separadas por comas | `nofap, disciplina, hábitos, autocontrol, racha, enfoque` |
| URL de soporte | — | `https://modoguerrero.es/contacto` |
| URL de privacidad | — | `https://app.modoguerrero.es/privacidad` |
| Novedades | 4 000 | «Primera versión» |

---

## Parte 2 — Lo que queda en código

Hecho: paridad de funciones, assets, `app.config.ts`, `eas.json`, compra de
Premium en la app (RevenueCat), eliminación de cuenta. Quedan tres cosas que
dependen de ti:

1. **`eas init`** con tu cuenta de Expo (paso 1.3). Genera el `projectId`; se
   pone en la variable `EAS_PROJECT_ID` al compilar.
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
   **17+**. Marcarla apta para todos es motivo de rechazo y de retirada
   posterior.
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
| `eas init` + primer build | Juntos | 1-2 días |
| TestFlight, capturas, ficha | Juntos | 2-3 días |
| Revisión de Apple | Apple | 1-2 días (más si rechazan) |

**Total realista: 1-2 semanas** desde hoy si la cuenta es individual, contando la revisión.
