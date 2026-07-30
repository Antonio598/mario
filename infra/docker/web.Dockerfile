# =============================================================================
# Imagen de produccion de la web (Next.js 15, monorepo pnpm)
#
# Construir DESDE LA RAIZ DEL REPOSITORIO, no desde apps/web:
#   docker build -f infra/docker/web.Dockerfile .
#
# En EasyPanel: Build Method = Dockerfile, Build Context = / (raiz),
# Dockerfile Path = infra/docker/web.Dockerfile
# =============================================================================


# -----------------------------------------------------------------------------
# 1 · base
# -----------------------------------------------------------------------------
FROM node:22-alpine AS base

# libc6-compat lo necesita el binario nativo de SWC, el compilador de Next.
RUN apk add --no-cache libc6-compat
RUN corepack enable

WORKDIR /app


# -----------------------------------------------------------------------------
# 2 · deps — solo manifiestos, para que la capa se cachee
#
# Copiar unicamente los package.json antes que el codigo hace que Docker
# reutilice la instalacion mientras las dependencias no cambien. Sin esto, cada
# cambio de una linea de codigo reinstalaria el arbol entero.
# -----------------------------------------------------------------------------
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json                 apps/web/
COPY packages/shared/package.json          packages/shared/
COPY packages/tokens/package.json          packages/tokens/
COPY packages/tsconfig/package.json        packages/tsconfig/

# La app movil no participa en esta imagen: sus dependencias pesan cientos de
# megas y no aportan nada al servidor web.
RUN pnpm install --frozen-lockfile --filter @reset-alfa/web...


# -----------------------------------------------------------------------------
# 3 · builder
# -----------------------------------------------------------------------------
FROM base AS builder

# ---------------------------------------------------------------------------
# ESTO ES LO QUE MAS SE OLVIDA Y LO QUE MAS ROMPE
#
# Next incrusta las variables NEXT_PUBLIC_* en el bundle en tiempo de
# COMPILACION, no de ejecucion. Si en EasyPanel solo se declaran como variables
# de entorno del servicio, el `next build` se ejecuta sin ellas y la web se
# despliega con las claves vacias: compila sin errores y falla en el navegador.
#
# Por eso se reciben como ARG y se promueven a ENV para el build.
# En EasyPanel hay que declararlas ademas en la seccion Build Arguments.
# ---------------------------------------------------------------------------
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_PRIVACY_POLICY_VERSION
ARG NEXT_PUBLIC_ENVIRONMENT=production
ARG NEXT_PUBLIC_GA4_MEASUREMENT_ID
ARG NEXT_PUBLIC_ADSENSE_CLIENT_ID

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_PRIVACY_POLICY_VERSION=$NEXT_PUBLIC_PRIVACY_POLICY_VERSION \
    NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT \
    NEXT_PUBLIC_GA4_MEASUREMENT_ID=$NEXT_PUBLIC_GA4_MEASUREMENT_ID \
    NEXT_PUBLIC_ADSENSE_CLIENT_ID=$NEXT_PUBLIC_ADSENSE_CLIENT_ID \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN cd apps/web && pnpm build


# -----------------------------------------------------------------------------
# 4 · runner
# -----------------------------------------------------------------------------
FROM base AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Usuario sin privilegios. Si alguien logra ejecutar codigo a traves de la
# aplicacion, no lo hara como root dentro del contenedor.
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# El volumen persistente de EasyPanel se monta aqui. Debe existir y pertenecer
# al usuario nextjs ANTES de montar, o el proceso no podra escribir la cache de
# ISR y cada reinicio regeneraria todos los articulos.
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app/.next

# `standalone` trae su propio node_modules minimo y un server.js autocontenido.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

# Sin curl ni wget en la imagen: se usa el propio Node, que ya esta.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
