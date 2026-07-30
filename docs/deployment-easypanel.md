# Despliegue en EasyPanel

Todo el lado servidor se autoaloja en un VPS gestionado con EasyPanel (Docker + Traefik).
La app móvil **no** se despliega aquí: ver [eas-build.md](./eas-build.md).

---

## 1. VPS

| | |
|---|---|
| Recursos | 4 vCPU / 8 GB RAM / 80 GB SSD |
| Ubicación | **Unión Europea** — Alemania o España |
| SO | Debian 12 o Ubuntu 24.04 |

La ubicación no es una preferencia. El sistema trata datos de categoría especial del
art. 9 RGPD (registros de recaída) de usuarios españoles. Mantener el dato dentro de la UE
elimina la necesidad de cláusulas contractuales tipo y evaluaciones de transferencia
internacional, que es exactamente el tipo de papeleo que hunde un proyecto pequeño.

Instalación de EasyPanel:

```sh
curl -sSL https://get.easypanel.io | sh
```

---

## 2. Base de datos: por qué Supabase Cloud y no autoalojado

Se arranca con **Supabase Cloud en región EU (Frankfurt)**. EasyPanel aloja únicamente la
web y n8n.

El motivo es de riesgo, no de coste. Autoalojar Supabase significa hacerse responsable de
la autenticación y de los datos más sensibles del sistema desde el primer día, sin backups
automáticos ni recuperación a un punto en el tiempo. Si el VPS falla, no se pierde una
web: se pierden las cuentas y el historial de todos los usuarios. La versión gestionada da
auth, backups diarios y PITR sin mantenimiento.

La migración a self-hosted tiene sentido más adelante, cuando haya volumen que lo
justifique y una rutina de operación probada. Hacerlo en ese orden es reversible; al revés,
no.

---

## 3. Servicios

| Servicio | Tipo | Dominio | Notas |
|---|---|---|---|
| `web` | App (GitHub) | `modoguerrero.es` | Rama `main` |
| `web-staging` | App (GitHub) | `staging.modoguerrero.es` | Rama `develop`, con `noindex` |
| `n8n` | Plantilla oficial | `n8n.modoguerrero.es` | Volumen persistente |
| `postgres-n8n` | Base de datos | — | Solo n8n, aislada de la app |
| `uptime-kuma` | Plantilla | `estado.modoguerrero.es` | Monitorización |

### Servicio `web`

**Source**
- Provider: GitHub → repositorio del proyecto, rama `main`
- Build Method: **Dockerfile**
- Build Context: `/` (la raíz — el Dockerfile es de monorepo y necesita `packages/`)
- Dockerfile Path: `infra/docker/web.Dockerfile`

**Build Arguments** — este es el punto que más despliegues rompe:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_SITE_URL=https://modoguerrero.es
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_PRIVACY_POLICY_VERSION=2026-07-30
```

> Next.js sustituye las `NEXT_PUBLIC_*` **en tiempo de compilación**. Si solo se declaran
> como variables de entorno del servicio, `next build` se ejecuta sin ellas: el despliegue
> termina en verde y la web falla en el navegador con las claves vacías. Deben estar en
> **Build Arguments**, y repetirse abajo como variables de entorno solo si el servidor las
> necesita en ejecución.

**Environment** (solo servidor, nunca en el repositorio):

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
CONSENT_IP_SALT=<openssl rand -hex 32>
REVALIDATE_SECRET=<openssl rand -hex 32>
```

La `SUPABASE_SERVICE_ROLE_KEY` salta toda la RLS. Filtrarla equivale a entregar la base de
datos completa, incluidos los datos del art. 9.

**Domains**: `modoguerrero.es`, puerto interno `3000`, HTTPS activado. Traefik emite y
renueva el certificado Let's Encrypt automáticamente.

**Mounts** — volumen persistente:

| Tipo | Nombre | Ruta de montaje |
|---|---|---|
| Volume | `web-next-cache` | `/app/.next/cache` |

Sin esto, cada reinicio vacía la caché de ISR y todos los artículos se regeneran a la vez,
con el pico de CPU y la latencia que eso implica justo cuando el servicio acaba de volver.

> **Límite conocido:** esta caché es local al contenedor. Si algún día se escala a varias
> réplicas, cada una tendrá la suya y servirán versiones distintas del mismo artículo. En
> ese momento hay que pasar a un *cache handler* compartido en Redis
> (`cacheHandler` en `next.config.ts`). Anotado también en el README.

**Resources** — límites por servicio:

| Servicio | Memoria | CPU |
|---|---|---|
| `web` | 2 GB | 2 |
| `n8n` | 2 GB | 1 |
| `postgres-n8n` | 1 GB | 1 |
| `web-staging` | 1 GB | 0.5 |

Sin límites, una ejecución pesada de n8n puede consumir la memoria del host y provocar que
el kernel mate el proceso de la web. Lo que se cae entonces es la fuente de ingresos.

**Deployments**: activar *Auto Deploy*. Copiar el webhook y añadirlo en GitHub →
Settings → Webhooks. Repetir para `web-staging` con la rama `develop`.

### Servicio `n8n`

Plantilla oficial de EasyPanel. Crear **antes** el servicio `postgres-n8n` y apuntar n8n a
él. Base separada de la de la aplicación a propósito: n8n almacena credenciales de
terceros y un historial de ejecuciones que crece sin parar; no tiene nada que hacer en la
misma base que los datos de los usuarios.

Volumen persistente en `/home/node/.n8n`.

---

## 4. Copias de seguridad

| Qué | Cómo | Frecuencia | Retención |
|---|---|---|---|
| Base de n8n | `infra/backups/pg_dump-n8n.sh` → S3/Backblaze | Diaria | 30 días |
| Workflows de n8n | Exportación al repositorio | Semanal | Historial de Git |
| Base de la app | Backups automáticos de Supabase Cloud + PITR | Continuo | Según plan |
| VPS completo | Snapshot programado en el proveedor | Semanal | 4 semanas |

El script avisa por Telegram tanto si termina bien como si falla. Una copia que falla en
silencio es peor que no tenerla: da una falsa sensación de protección hasta el día en que
hace falta.

**Restaurar la base de n8n:**

```sh
gunzip -c n8n-2026-07-30.sql.gz | psql "$DATABASE_URL"
```

Conviene probar una restauración real al menos una vez. Una copia nunca verificada es una
hipótesis, no un respaldo.

---

## 5. Observabilidad

Uptime Kuma como servicio adicional, vigilando:

| Monitor | URL | Intervalo |
|---|---|---|
| Web | `https://modoguerrero.es/api/health` | 60 s |
| n8n | `https://n8n.modoguerrero.es/healthz` | 300 s |
| Certificado | Aviso a 14 días de la caducidad | — |

Alertas al mismo canal de Telegram que usa la aprobación de artículos: un único sitio que
mirar.

---

## 6. Comprobación tras el primer despliegue

1. `https://modoguerrero.es/api/health` devuelve `200` con `{"status":"ok"}`.
2. El certificado es válido y `http://` redirige a `https://`.
3. `curl -I https://modoguerrero.es` incluye `strict-transport-security`.
4. `https://staging.modoguerrero.es` devuelve la cabecera `x-robots-tag: noindex`.
5. Un push a `main` dispara el redespliegue y **no** toca staging.
6. Reiniciar el servicio `web` y confirmar que `/app/.next/cache` conserva su contenido.
