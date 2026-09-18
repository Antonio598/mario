# App Store, paso a paso

Guía concreta para publicar **Reset Alfa** en la App Store de Apple. Complementa
[`publicar-en-tiendas.md`](./publicar-en-tiendas.md) (la estrategia y los
riesgos) con el «qué pulso y en qué orden».

Está dividida en **lo que haces tú** (cuentas, pagos, ficha, revisión) y **lo
que hago yo** (código, assets, builds). Los pasos de ambos se cruzan: los tuyos
de la parte 1 pueden empezar hoy y no dependen de nada mío.

---

## Antes de nada: en qué estado está la app nativa

Hay que decirlo claro para que el plazo no sorprenda.

La app que se publica en la App Store **no es la web** que llevas semanas
viendo. Es la app nativa de la carpeta `apps/mobile`, hecha con Expo. Y esa
app:

- Tiene las **13 pantallas originales** (contador, check-in, calendario,
  formación, perfil, recaída).
- **No tiene nada de lo construido después**: ni P.A.D, ni carta anti-recaída,
  ni logros, ni Premium, ni el test de entrada, ni los vídeos de hito, ni el
  nombre «Bitácora de NOFAP».
- **Nunca se ha compilado.** No tiene icono, ni pantalla de arranque, ni
  proyecto en EAS.

Publicarla tal cual sería publicar una fracción del producto. Antes de enviarla
a revisión hay que ponerla al día. Es trabajo mío y está en la parte 2.

**La alternativa ya funciona:** `app.modoguerrero.es` se instala en el iPhone
desde Safari («Compartir → Añadir a pantalla de inicio») con icono propio y sin
barra de navegador. Lo único que no da es aparecer buscando «nofap» en la App
Store. Si el tráfico va a venir de Google y de tu audiencia, esa es la vía
rápida. Lo que sigue asume que quieres la App Store de todos modos.

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

## Parte 2 — Lo que hago yo (código)

En este orden, con un commit por bloque como siempre:

1. **Poner la app nativa al día** con la web: P.A.D, carta, logros, Bitácora de
   NOFAP, test de entrada, vídeos de hito. Sin precios ni botones de compra —
   Apple 3.1.1: la app nativa solo puede decir «esto requiere acceso» y abrir
   el navegador. Es la parte larga.
2. **Borrado de cuenta desde la app** (Apple 5.1.1(v)). Hoy `borrar_mis_datos`
   no elimina la identidad porque la base es compartida con tu CRM. Hay que
   decidir: un endpoint con `service_role` que borre `auth.users` (el usuario
   desaparece también del CRM) o un proyecto Supabase separado. **Sin esto,
   rechazo seguro.** Decisión tuya; te lo pregunto cuando llegue.
3. **Assets**: icono 1024×1024 desde `logos/app.png`, pantalla de arranque
   negra, icono adaptativo.
4. **`eas init`** enlazado a tu cuenta de Expo, y `EXPO_PUBLIC_SITE_URL` a
   `https://app.modoguerrero.es`.
5. **Primer build de prueba** (`eas build --platform ios --profile preview`) y
   te lo instalo en tu iPhone por TestFlight.

Plazo realista de la parte 2: **3-4 semanas** de trabajo.

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
     > La cuenta de demostración tiene el nivel Premium activado para que
     > puedan revisar todas las funciones. Todo el contenido de pago se
     > adquiere fuera de la app, en nuestra web; la app no contiene compras
     > integradas. La cuenta se puede eliminar desde Perfil → Eliminar mis
     > datos.

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
8. **Selecciona el build** subido en 3.3.
9. **Lanzamiento**: «Publicar manualmente esta versión». Así, cuando la
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
| App nativa al día + borrado de cuenta + assets + build | Yo | 3-4 semanas |
| TestFlight, capturas, ficha | Juntos | 2-3 días |
| Revisión de Apple | Apple | 1-2 días (más si rechazan) |

**Total realista: 4-6 semanas** desde hoy si la cuenta es individual.
