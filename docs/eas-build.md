# Compilación y publicación de la app móvil (EAS)

La app **no se despliega en EasyPanel**. Se compila con EAS Build y se publica en App Store
y Google Play. EasyPanel solo sirve el backend y la web que la app consume.

---

## Preparación

```sh
npm install -g eas-cli
eas login
cd apps/mobile
eas init
```

Las variables públicas se registran como variables de entorno de EAS, no en el repositorio:

```sh
eas env:create --name EXPO_PUBLIC_SUPABASE_URL      --value "https://xxxx.supabase.co" --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGci..."              --environment production
```

## Perfiles de compilación

| Perfil | Uso | Salida |
|---|---|---|
| `development` | Cliente de desarrollo con recarga en caliente | Build interna |
| `preview` | Pruebas antes de publicar | APK / TestFlight |
| `production` | Envío a las tiendas | AAB / IPA |

```sh
eas build --platform all --profile production
eas submit --platform all --profile production
```

---

## Reglas de plataforma que condicionan el producto

### Premium se vende con el sistema de la tienda

Apple (guideline 3.1.1) y Google exigen su sistema de compra integrada —comisión del
15-30 %— para contenido digital vendido dentro de la app. Por eso la suscripción Premium
se compra **dentro** de la app con StoreKit y Google Play Billing, a través de RevenueCat
(`src/features/premium/compras.ts`), y el precio que se muestra es el que devuelve la
tienda. Nunca hay enlace a un pago externo.

Consecuencia práctica: en la ficha **sí** hay que declarar compras integradas y añadir la
suscripción a la versión antes de enviarla a revisión. Guía completa:
[`compras-en-la-app.md`](compras-en-la-app.md).

Sin las claves de RevenueCat en el build no hay botón de compra: la app dice «Incluido en
Reset Alfa Premium. El acceso se gestiona desde tu cuenta en la web», sin precio ni enlace.

El **libro** y la **sesión diagnóstica** siguen abriéndose en el navegador externo con
`expo-web-browser`: son un bien físico y un servicio presencial, que la norma 3.1.3(e)
deja fuera del sistema de compra de la tienda.

> Lo que provoca rechazo es una llamada a la acción del tipo «más barato en nuestra web»
> dentro de la app, o enlazar a un pago externo para contenido digital.

### Sign in with Apple

Obligatorio en iOS si se ofrece cualquier otro inicio de sesión social. Ya está
implementado en `src/features/auth/BotonesSociales.tsx` y solo aparece en iOS.

Apple devuelve el nombre **únicamente en el primer inicio de sesión** y suele entregar un
correo de retransmisión privada. El trigger `app.handle_new_user` degrada al local-part del
correo cuando no hay nombre; el onboarding debe pedirlo.

### Ficha de la tienda

- Clasificación por edad **17+ / 18+**.
- Describir la app como **herramienta de seguimiento de hábitos y disciplina**.
- **Sin** lenguaje sexual explícito y **sin** afirmaciones de salud (nada de testosterona,
  efectos hormonales o beneficios fisiológicos). Ambas cosas provocan rechazo en la
  revisión, y las afirmaciones de salud pueden además exigir documentación que no existe.
- Capturas sin contenido sugerente.

### Declaración de privacidad

Ambas tiendas exigen declarar qué datos se recogen. Hay que marcar la categoría
**"Información sensible"** por los registros de recaída. Ocultarlo es motivo de retirada de
la app.

Enlazar la política de privacidad publicada en `https://app.modoguerrero.es/privacidad`.

---

## Notas del monorepo

`.npmrc` fija `node-linker=hoisted`. Metro, el bundler de React Native, no resuelve de
forma fiable los enlaces simbólicos anidados que pnpm crea por defecto; sin esa opción el
bundle falla con errores de módulo no encontrado difíciles de diagnosticar.

Al añadir dependencias nativas hay que regenerar la compilación: las actualizaciones OTA
solo cubren cambios de JavaScript.
