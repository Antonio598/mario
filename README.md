# Reset Alfa

Ecosistema web + app móvil para la marca **Modo Guerrero**.

- **Web pública** — artículos diarios monetizados con publicidad. Es el motor de tráfico y
  la fuente principal de ingresos: el rendimiento y el SEO técnico se priorizan aquí.
- **App móvil** — seguimiento de rachas y formación. Retiene al usuario que la web capta.

Ambas comparten backend (Supabase) y contenido.

---

## Regla de plataforma que condiciona toda la arquitectura

**La app móvil nunca muestra precios ni botones de compra.**

Apple y Google exigen su sistema de compra integrada —comisión del 15-30 %— para contenido
digital vendido *dentro* de la app. La app se limita a **leer** los permisos ya adquiridos
(`entitlements`); toda la venta ocurre en la web, y las fichas de producto se abren en el
navegador externo mediante `products.url_web`.

Si en algún momento se añade un precio o un botón de compra a una pantalla de la app, se
entra de lleno en el ámbito de la comisión. No es un detalle de diseño.

---

## Puesta en marcha

Requisitos: Node 22+, pnpm 10+, Docker (solo para Supabase en local).

```sh
pnpm install
cp .env.example .env
```

### Base de datos

```sh
pnpm db:start     # levanta Supabase en local (necesita Docker)
pnpm db:reset     # aplica migraciones + datos de prueba
pnpm db:types     # regenera packages/shared/src/types/database.ts
```

### Pruebas de aislamiento RLS

**Es la verificación más importante del repositorio.** Detrás de esas políticas hay datos
de categoría especial del art. 9 RGPD.

```sh
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 -f supabase/tests/rls.test.sql
```

Comprueba, entre otras cosas, que un usuario no alcanza los registros de recaída de otro,
que no puede inflar su racha ni regalarse permisos, que las lecciones premium son
invisibles sin `entitlement`, y que eliminar la cuenta borra de verdad.

### Desarrollo

```sh
pnpm dev                          # todo
pnpm --filter @reset-alfa/web dev
pnpm --filter @reset-alfa/mobile start
```

---

## Estructura

```
apps/web        Next.js 15 · App Router · Tailwind v4
apps/mobile     Expo · expo-router · TypeScript
packages/shared Tipos, lógica de permisos y constantes (TS puro)
packages/tokens Color, tipografía y espaciado de marca
supabase/       Migraciones, seed y pruebas de RLS
infra/          Dockerfile, EasyPanel y copias de seguridad
docs/           Despliegue, EAS y registro de tratamiento RGPD
```

**No hay `packages/ui` compartido a propósito.** Compartir componentes entre Next y React
Native exige `react-native-web`, que penaliza el bundle y el LCP de la web publicitaria —
justo donde está el negocio. Se comparten tokens y lógica pura; los componentes se escriben
dos veces.

---

## Puntos que conviene conocer antes de tocar el código

### Las `NEXT_PUBLIC_*` se incrustan al compilar

Next las sustituye en tiempo de compilación, no de ejecución. En EasyPanel deben declararse
como **Build Arguments** del Dockerfile. Si solo se ponen como variables de entorno del
servicio, el despliegue termina en verde y la web arranca con las claves vacías.

### La caché de ISR no sobrevive al escalado horizontal

El volumen montado en `/app/.next/cache` conserva la caché entre reinicios, pero es local
al contenedor. Con varias réplicas, cada una tendría la suya y servirían versiones distintas
del mismo artículo. Antes de escalar hay que pasar a un *cache handler* compartido en Redis
(`cacheHandler` en `next.config.ts`).

### La escritura de rachas no pasa por el cliente

`streaks` y `checkins` solo tienen políticas de `SELECT`. Registrar un check-in implica una
transición de varios pasos (cerrar racha, actualizar récord, acumular total, abrir racha
nueva) que debe ser atómica y no manipulable desde el dispositivo. Se hará mediante un RPC
`security definer` en la Fase 2.

### El paywall vive en la base de datos

La política RLS de `lessons` comprueba el `entitlement`. Si el bloqueo estuviera solo en la
interfaz, el contenido premium seguiría siendo accesible con una petición directa a la API
usando la anon key, que es pública por diseño.

### El consentimiento del art. 9 lo impone Postgres

Un trigger bloquea la inserción en `relapses` sin consentimiento explícito vigente. Ningún
fallo de interfaz ni cliente antiguo puede saltárselo. Ver
[docs/gdpr-registro-tratamiento.md](docs/gdpr-registro-tratamiento.md).

### Reglas de contenido de la web

La cuenta de AdSense depende de ello: registro clínico y de disciplina, sin lenguaje
explícito y **sin ninguna afirmación médica o fisiológica** (nada de testosterona, hormonas
o efectos sobre el cuerpo). El temario se amplía deliberadamente más allá de la abstinencia
—disciplina, productividad, entrenamiento, finanzas, mentalidad, relaciones— porque
multiplica las páginas indexables y sube el CPC.

---

## Estado por fases

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Monorepo, esquema con RLS, autenticación, navegación, Docker y despliegue | **Completada** |
| 2 | Modal diario, lógica de rachas, formulario post-recaída, calendario | Pendiente |
| 3 | Web de artículos, SEO, anuncios, cookies, pipeline n8n | Pendiente |
| 4 | Stripe, webhooks, paywall en la app, tienda | Pendiente |
| 5 | Push, insignias, estadísticas, patrones de disparadores | Pendiente |

## Documentación

- [Despliegue en EasyPanel](docs/deployment-easypanel.md)
- [Compilación y publicación móvil (EAS)](docs/eas-build.md)
- [Registro de tratamiento RGPD](docs/gdpr-registro-tratamiento.md)
