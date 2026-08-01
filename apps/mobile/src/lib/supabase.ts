import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
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

function leerExtra(clave: 'supabaseUrl' | 'supabaseAnonKey' | 'siteUrl'): string {
  const valor = Constants.expoConfig?.extra?.[clave];
  if (typeof valor !== 'string' || valor === '') {
    throw new Error(
      `Falta ${clave} en la configuracion. Define las variables EXPO_PUBLIC_* antes de compilar.`,
    );
  }
  return valor;
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

/** Solo iOS ofrece Sign in with Apple; en Android el boton no debe aparecer. */
export const soportaAppleSignIn = Platform.OS === 'ios';
