import type { EsquemaSupabase } from '@reset-alfa/shared';

/**
 * Validacion de variables de entorno.
 *
 * Se comprueban al arrancar y no en el momento de usarlas. La diferencia
 * importa: un despliegue al que le falta una clave debe fallar de inmediato y
 * de forma visible, no servir paginas rotas a los usuarios y a Googlebot
 * durante horas.
 *
 * AVISO SOBRE NEXT_PUBLIC_*: Next las sustituye literalmente en tiempo de
 * COMPILACION. Por eso hay que escribirlas completas —process.env.NOMBRE— y no
 * accediendo dinamicamente: con acceso dinamico la sustitucion no ocurre y el
 * valor llega vacio al navegador. Ese es tambien el motivo de que deban
 * declararse como Build Arguments en EasyPanel, no solo como variables de
 * entorno del contenedor.
 */

function requerida(valor: string | undefined, nombre: string): string {
  if (valor === undefined || valor === '') {
    throw new Error(
      `Falta la variable de entorno ${nombre}. ` +
        `Revisa .env.example; en produccion se define en el panel de EasyPanel.`,
    );
  }
  return valor;
}

/**
 * Esquema Postgres donde vive Reset Alfa.
 *
 *   `public`      Proyecto Supabase dedicado (instalacion normal).
 *   `reset_alfa`  Proyecto compartido con otra app, instalado con
 *                 supabase/instalacion-esquema-aislado.sql
 *
 * Si esto no coincide con lo que hay realmente en la base, la API devuelve 404
 * en todas las tablas. En Supabase self-hosted hay que anadir ademas el esquema
 * a PGRST_DB_SCHEMAS del servicio `rest`, o PostgREST no lo expondra.
 */
function esquemaValido(valor: string | undefined): EsquemaSupabase {
  if (valor === undefined || valor === '' || valor === 'public') return 'public';
  if (valor === 'reset_alfa') return 'reset_alfa';
  throw new Error(
    `NEXT_PUBLIC_SUPABASE_SCHEMA no valido: "${valor}". Solo se admite public o reset_alfa.`,
  );
}

/** Seguro para el navegador. */
export const publicEnv = {
  supabaseUrl: requerida(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requerida(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ),
  supabaseSchema: esquemaValido(process.env.NEXT_PUBLIC_SUPABASE_SCHEMA),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  privacyPolicyVersion: process.env.NEXT_PUBLIC_PRIVACY_POLICY_VERSION ?? '2026-07-30',
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'development',
} as const;
