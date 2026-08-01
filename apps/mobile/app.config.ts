import type { ExpoConfig } from 'expo/config';

/**
 * Configuracion de la app movil.
 *
 * FICHA EN LAS TIENDAS — decisiones deliberadas, no cosmeticas:
 *
 *  · La app se describe como herramienta de SEGUIMIENTO DE HABITOS Y
 *    DISCIPLINA. Nada de lenguaje sexual explicito ni afirmaciones de salud:
 *    ambas cosas provocan rechazo en la revision de App Store y Google Play.
 *  · Clasificacion por edad 17+/18+, por la naturaleza del tema tratado.
 *  · La app NO contiene compras integradas y no debe declararlas. Todo el
 *    comercio ocurre en la web, en navegador externo. Declarar compras
 *    integradas obligaria a usar el sistema de pago de la tienda y su comision
 *    del 15-30 %.
 */
const config: ExpoConfig = {
  name: 'Reset Alfa',
  slug: 'reset-alfa',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'resetalfa',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,

  splash: {
    resizeMode: 'contain',
    backgroundColor: '#0A0A0A',
  },

  ios: {
    supportsTablet: false,
    bundleIdentifier: 'es.modoguerrero.resetalfa',
    config: {
      usesNonExemptEncryption: false,
    },
  },

  android: {
    package: 'es.modoguerrero.resetalfa',
    adaptiveIcon: {
      backgroundColor: '#0A0A0A',
    },
    /**
     * Sin permiso de INTERNET no hay nada; el resto se omite a proposito.
     * Cada permiso extra es una pregunta mas en la revision de la tienda y una
     * casilla mas en la declaracion de privacidad.
     */
    permissions: ['INTERNET'],
  },

  plugins: ['expo-router', 'expo-secure-store', 'expo-web-browser'],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    supabaseUrl: process.env['EXPO_PUBLIC_SUPABASE_URL'],
    supabaseAnonKey: process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'],
    // 'public' o 'reset_alfa'. Ver supabase/instalacion-esquema-aislado.sql
    supabaseSchema: process.env['EXPO_PUBLIC_SUPABASE_SCHEMA'] ?? 'public',
    siteUrl: process.env['EXPO_PUBLIC_SITE_URL'] ?? 'https://modoguerrero.es',
  },
};

export default config;
