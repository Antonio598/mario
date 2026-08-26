# Publicar en App Store y Google Play

Estado a día de hoy: la app móvil tiene las 13 pantallas escritas pero **nunca
se ha compilado**. No hay `assets/`, ni icono, ni splash, ni proyecto EAS.

---

## 0. Antes de nada: ¿hacen falta las apps nativas?

Ya tienes una PWA instalable que hace lo mismo. Merece la pena comparar antes de
invertir meses:

| | PWA (ya funciona) | Apps nativas |
|---|---|---|
| Coste anual | 0 € | 99 USD Apple + 25 USD Google |
| Tiempo hasta publicar | Ya está | 4-8 semanas |
| Comisión sobre ventas | **0 %** | 15-30 % si vendes dentro |
| Revisión | Ninguna | Cada versión |
| Notificaciones push | Sí en Android; en iOS solo si el usuario la instala | Sí |
| Aparecer buscando "nofap" en la store | No | Sí |

**Lo único que la PWA no te da es descubrimiento en las tiendas.** Si el tráfico
va a venir de Google y de tu audiencia, la PWA cubre el caso. Si quieres que la
gente te encuentre buscando en la App Store, hacen falta las nativas.

Decisión del cliente. El resto del documento asume que sí.

---

## 1. Cuentas y costes

| | Coste | Plazo de alta |
|---|---|---|
| Apple Developer Program | 99 USD/año | 24-48 h; con empresa, hasta 2 semanas (requiere D-U-N-S) |
| Google Play Console | 25 USD una vez | 24-48 h |

### El requisito de Google que descoloca a todo el mundo

Si te das de alta como **particular** (no como empresa), Google exige antes de
publicar en producción:

- Una prueba cerrada con **al menos 12 probadores**
- Que sigan apuntados **14 días seguidos**

Son 14 días de calendario que no se pueden acelerar. Si vas a necesitar 12
personas, empieza a reunirlas ya.

Las cuentas de **organización** están exentas, pero requieren número D-U-N-S,
que tarda otras 1-2 semanas en conseguirse.

---

## 2. Lo que falta en el código

```
apps/mobile/assets/
├── icon.png              1024x1024, sin transparencia, sin esquinas redondeadas
├── adaptive-icon.png     1024x1024, el logo al 60 % centrado (Android recorta)
├── splash.png            1284x2778, fondo #0A0A0A
└── notification-icon.png 96x96, blanco sobre transparente (Android lo tiñe)
```

De tu `logos/app.png` (1080x1080) sale el `icon.png` sin problema. El
`adaptive-icon.png` necesita una versión con el logo más pequeño: Android lo
recorta a círculo o cuadrado redondeado según el fabricante y se come hasta el
20 % del borde.

Luego, en `app.config.ts`, declarar las rutas y crear el proyecto:

```sh
cd apps/mobile
npx eas-cli login
npx eas init          # crea el projectId
npx eas build --platform all --profile production
```

---

## 3. Ficha de la tienda

| Campo | Qué poner |
|---|---|
| Nombre | Reset Alfa |
| Subtítulo | Seguimiento de hábitos y disciplina |
| Categoría | Salud y forma física, o Estilo de vida |
| **Clasificación por edad** | **17+ / 18+** |
| Capturas | iPhone 6.7" y 6.5"; Android teléfono y tablet |
| Gráfico destacado (solo Play) | 1024x500 |
| Política de privacidad | https://modoguerrero.es/privacidad |
| Cuenta de prueba | Correo y contraseña reales para el revisor |

**Sin cuenta de prueba, Apple rechaza en el primer intento.** Toda la app está
detrás del login: el revisor no puede ver nada sin credenciales.

### Cómo describirla — esto decide si la aprueban

Descríbela como **app de seguimiento de hábitos y disciplina**.

- **Sin lenguaje sexual explícito.** Ni en el texto ni en las capturas.
- **Sin afirmaciones de salud.** Nada de testosterona, hormonas, efectos sobre
  el cuerpo o "recuperación". Ambas tiendas lo tratan como afirmación médica y
  piden documentación que no existe.
- Marco: hábitos, autocontrol, foco, constancia.

---

## 4. Los tres puntos que pueden hacer que te rechacen

### 4.1 Compras fuera de la app (Apple 3.1.1)

La app enlaza a Stripe para comprar Reset Alfa. Apple ha rechazado
históricamente los enlaces a pago externo para contenido digital.

Desde la DMA europea y los cambios en EE. UU. está permitido, pero **requiere
solicitar la autorización correspondiente** en App Store Connect y no es
automático.

**La vía segura:** en la app nativa, no mostrar precio ni botón de compra. Solo
"este contenido requiere acceso" y abrir el navegador. Es como está construido
ahora — asegúrate de que sigue así antes de enviar.

### 4.2 Borrado de cuenta (Apple 5.1.1(v) y Play)

Ambas exigen que el usuario pueda **borrar su cuenta desde dentro de la app**,
no solo sus datos.

**Aquí tienes un problema real.** Con la instalación de esquema compartido,
`borrar_mis_datos()` NO elimina `auth.users`: borrarlo expulsaría al usuario
también de tu CRM. Eso puede considerarse incumplimiento.

Opciones:
1. Proyecto Supabase separado para Reset Alfa. Resuelve esto y el punto RGPD.
2. Borrado real de `auth.users` desde un endpoint con la service_role, asumiendo
   que el usuario también desaparece del CRM.

Hay que resolverlo **antes** de enviar.

### 4.3 Declaración de privacidad

Ambas tiendas piden declarar qué datos recoges. Hay que marcar la categoría de
**información sensible** por los registros de recaída. Ocultarlo es motivo de
retirada.

Apple: App Privacy en App Store Connect.
Google: formulario de Seguridad de los Datos en Play Console.

---

## 5. Orden recomendado

1. Decidir si de verdad hacen falta las nativas (sección 0)
2. Alta en Apple y Google — empieza ya, el alta tarda
3. Si es cuenta de particular en Google: reunir los 12 probadores
4. Resolver el borrado de cuenta (4.2)
5. Generar los assets desde el logo
6. `eas init` y primer build de prueba en dispositivo real
7. Capturas y textos de la ficha
8. Envío. Apple revisa en 24-48 h; Google, entre horas y 7 días

**Plazo realista hasta estar publicado: 4-6 semanas** con cuenta de empresa;
6-8 si es de particular en Google por los 14 días de prueba cerrada.
