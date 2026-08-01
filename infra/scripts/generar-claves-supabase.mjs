#!/usr/bin/env node
/**
 * Genera un JWT_SECRET nuevo y las claves `anon` y `service_role` firmadas con
 * el, para una instalacion de Supabase self-hosted.
 *
 *   node infra/scripts/generar-claves-supabase.mjs
 *
 *
 * POR QUE ESTE SCRIPT EXISTE
 *
 * El docker-compose de Supabase self-hosting trae unas claves de ejemplo con
 * `"iss": "supabase-demo"`, firmadas con el secreto
 * `super-secret-jwt-token-with-at-least-32-characters-long`. Estan publicadas
 * en GitHub y en la documentacion.
 *
 * Si una instancia accesible desde internet conserva ese secreto, cualquiera
 * puede firmarse un token `service_role` y leer y escribir la base de datos
 * entera saltandose TODAS las politicas RLS. Es el fallo mas comun al
 * autoalojar Supabase, y el mas silencioso: nada deja de funcionar.
 *
 * Comprueba si es tu caso:
 *   node -e "console.log(JSON.parse(Buffer.from(process.argv[1].split('.')[1],'base64url')))" TU_CLAVE
 * Si sale `iss: supabase-demo`, estas expuesto.
 *
 *
 * ESTE SCRIPT NO GUARDA NADA EN DISCO. Imprime por pantalla y termina. Copia
 * los valores al .env de tu servidor y no los pegues en ningun chat, ticket ni
 * repositorio.
 */

import { createHmac, randomBytes } from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

function firmarJWT(payload, secreto) {
  const cabecera = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const cuerpo = b64url(JSON.stringify(payload));
  const firma = createHmac('sha256', secreto).update(`${cabecera}.${cuerpo}`).digest('base64url');
  return `${cabecera}.${cuerpo}.${firma}`;
}

// 64 bytes en hexadecimal. El minimo de HS256 son 32 caracteres; esto da 128 y
// no cuesta nada.
const jwtSecret = randomBytes(64).toString('hex');

const ahora = Math.floor(Date.now() / 1000);
const diezAnios = ahora + 60 * 60 * 24 * 365 * 10;

const base = { iss: 'supabase', iat: ahora, exp: diezAnios };

const anonKey = firmarJWT({ ...base, role: 'anon' }, jwtSecret);
const serviceRoleKey = firmarJWT({ ...base, role: 'service_role' }, jwtSecret);

// Contrasenas sin caracteres que rompan una cadena de conexion de Postgres:
// una `@`, `:` o `/` sin escapar en DATABASE_URL provoca un error de conexion
// que no dice en ningun momento que la culpa es de la contrasena.
const contrasena = (bytes) =>
  randomBytes(bytes).toString('base64').replace(/[+/=]/g, '').slice(0, 32);

console.log(`
=============================================================================
 CLAVES NUEVAS PARA SUPABASE SELF-HOSTED
 Generadas: ${new Date().toISOString()}
=============================================================================

Pega esto en el .env de tu servidor Supabase y reinicia la pila:

    docker compose down && docker compose up -d

-----------------------------------------------------------------------------
JWT_SECRET=${jwtSecret}

ANON_KEY=${anonKey}

SERVICE_ROLE_KEY=${serviceRoleKey}

POSTGRES_PASSWORD=${contrasena(24)}

DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=${contrasena(24)}
-----------------------------------------------------------------------------


DESPUES, SIN OLVIDAR NINGUNO:

  1. La contrasena de Postgres cambia -> actualiza DATABASE_URL en TODAS las
     apps que usen esta base, incluida la que ya tenias. Si no, dejan de
     conectar.

  2. En EasyPanel, servicio de la web de Reset Alfa:
       Build Arguments -> NEXT_PUBLIC_SUPABASE_ANON_KEY = el ANON_KEY de arriba
       Environment     -> SUPABASE_SERVICE_ROLE_KEY     = el SERVICE_ROLE_KEY

  3. En la app movil: EXPO_PUBLIC_SUPABASE_ANON_KEY = el ANON_KEY.
     Hace falta recompilar con EAS: Expo incrusta esa variable en el bundle.

  4. Comprueba que el secreto viejo ya no vale. Con la clave ANTIGUA:
       curl -o /dev/null -w '%{http_code}\\n' \\
         -H "apikey: CLAVE_ANTIGUA" https://TU-SUPABASE/rest/v1/
     Debe devolver 401. Si devuelve otra cosa, el secreto no se ha aplicado.


LA ANON KEY ES PUBLICA POR DISENO: va en el bundle del navegador y de la app, y
no concede nada por si misma. Lo que puede leerse con ella lo deciden las
politicas RLS.

LA SERVICE_ROLE KEY SE SALTA TODA LA RLS. Solo en el servidor, jamas en codigo
cliente. En este proyecto se importa unicamente desde
apps/web/src/lib/supabase/admin.ts, que lleva la directiva \`import 'server-only'\`
para que un import accidental desde cliente rompa el build en lugar de
filtrarla.
`);
