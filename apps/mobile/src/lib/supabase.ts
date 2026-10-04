import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { proveedoresSociales } from '@reset-alfa/shared';
import type { Database, EsquemaSupabase } from '@reset-alfa/shared';

/**
 * ALMACENAMIENTO DE TOKENS.
 *
 * SecureStore, nunca AsyncStorage. AsyncStorage guarda en texto plano en el
 * sistema de ficheros de la app: en un dispositivo con root o jailbreak, y en
 * cualquier copia de seguridad sin cifrar, el token de sesion queda a la vista.
 * Ese token da acceso a los registros de recaida del usuario, que son datos de
 * categoria especial del art. 9 RGPD.
 *
 * SecureStore usa el Llavero de iOS y el Keystore de Android.
 *
 * LIMITE CONOCIDO: SecureStore no admite valores de mas de 2048 bytes. Un JWT
 * de Supabase con claims personalizados abundantes puede superarlo, asi que el
 * valor se parte en fragmentos.
 */
const TAMANO_FRAGMENTO = 2000;

const secureStorage: SupportedStorage = {
  async getItem(key) {
    const primero = await SecureStore.getItemAsync(`${key}_0`);
    if (primero === null) return null;

    let valor = primero;
    for (let i = 1; ; i += 1) {
      const fragmento = await SecureStore.getItemAsync(`${key}_${i}`);
      if (fragmento === null) break;
      valor += fragmento;
    }
    return valor;
  },

  async setItem(key, value) {
    // Se limpia antes de escribir: si el valor nuevo tiene menos fragmentos que
    // el anterior, los sobrantes corromperian la lectura siguiente.
    await this.removeItem?.(key);

    const total = Math.ceil(value.length / TAMANO_FRAGMENTO);
    for (let i = 0; i < total; i += 1) {
      await SecureStore.setItemAsync(
        `${key}_${i}`,
        value.slice(i * TAMANO_FRAGMENTO, (i + 1) * TAMANO_FRAGMENTO),
      );
    }
  },

  async removeItem(key) {
    for (let i = 0; ; i += 1) {
      const fragmento = await SecureStore.getItemAsync(`${key}_${i}`);
      if (fragmento === null) break;
      await SecureStore.deleteItemAsync(`${key}_${i}`);
    }
  },
};

type ClaveExtra = 'supabaseUrl' | 'supabaseAnonKey' | 'siteUrl';

const VARIABLE_DE: Record<ClaveExtra, string> = {
  supabaseUrl: 'EXPO_PUBLIC_SUPABASE_URL',
  supabaseAnonKey: 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  siteUrl: 'EXPO_PUBLIC_SITE_URL',
};

const ausentes: string[] = [];

/**
 * Lee un valor de la configuracion del build.
 *
 * NO LANZA. Antes si lo hacia, y como este modulo se importa al arrancar, el
 * resultado era que la app se cerraba sola sin decir nada: pantalla negra y
 * fuera. Eso ya paso una vez con un build de TestFlight compilado sin las
 * variables de Supabase, y es ademas motivo de rechazo en la revision.
 *
 * Ahora anota lo que falta y devuelve un valor inerte. El layout raiz lee
 * `faltaConfiguracion` y ensena que variable falta, que es lo que permite
 * arreglarlo en un minuto en vez de adivinar.
 */
function leerExtra(clave: ClaveExtra): string {
  const valor = Constants.expoConfig?.extra?.[clave];
  if (typeof valor !== 'string' || valor.trim() === '') {
    ausentes.push(VARIABLE_DE[clave]);
    // Dominio reservado por la IETF (RFC 2606): nunca resuelve, asi que una
    // peticion accidental falla limpio en lugar de salir a un host ajeno.
    return clave === 'supabaseAnonKey' ? 'sin-configurar' : 'https://sin-configurar.invalid';
  }
  return valor.trim();
}

export const siteUrl = leerExtra('siteUrl');

/**
 * Esquema Postgres donde vive Reset Alfa.
 *
 *   `public`      Proyecto Supabase dedicado (instalacion normal).
 *   `reset_alfa`  Proyecto compartido con otra app, instalado con
 *                 supabase/instalacion-esquema-aislado.sql
 *
 * Debe coincidir con lo instalado en la base y, en self-hosted, con
 * PGRST_DB_SCHEMAS del servicio `rest`. Si no coincide, la API responde 404 en
 * todas las tablas.
 */
const esquema: EsquemaSupabase =
  Constants.expoConfig?.extra?.['supabaseSchema'] === 'reset_alfa' ? 'reset_alfa' : 'public';

export const supabase = createClient<Database, EsquemaSupabase>(
  leerExtra('supabaseUrl'),
  leerExtra('supabaseAnonKey'),
  {
    db: { schema: esquema },
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      /**
       * En movil no hay URL de navegador donde Supabase pueda leer el token: el
       * retorno de OAuth se maneja explicitamente con expo-auth-session.
       */
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  },
);

/**
 * Proveedores de acceso social configurados en GoTrue. Vacio por defecto: ver
 * packages/shared/src/dominio/acceso-social.ts. Que un proveedor este aqui no
 * lo configura; solo declara que YA lo esta.
 */
/**
 * Variables que faltaban en el build. Vacio = configuracion completa.
 * El layout raiz lo comprueba antes de montar la app.
 */
export const faltaConfiguracion: readonly string[] = ausentes;

export const proveedoresLoginSocial = proveedoresSociales(
  typeof Constants.expoConfig?.extra?.['loginSocial'] === 'string'
    ? (Constants.expoConfig.extra['loginSocial'] as string)
    : '',
);
