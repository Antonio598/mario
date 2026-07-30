import type { Metadata, Viewport } from 'next';
import { Oswald, Inter } from 'next/font/google';
import { ConsentBanner } from '@/components/ConsentBanner';
import { publicEnv } from '@/lib/env';
import './globals.css';

/**
 * Las fuentes se descargan en tiempo de compilacion y se sirven desde nuestro
 * propio dominio. Evita una conexion a fonts.gstatic.com en la ruta critica
 * —mejor LCP— y ademas quita de en medio una transferencia de datos a un
 * tercero que habria que declarar en la politica de privacidad.
 *
 * `display: swap` muestra el texto con la fuente de sistema mientras carga la
 * definitiva, en lugar de dejar el articulo en blanco.
 */
const oswald = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: 'Modo Guerrero · Disciplina, autocontrol y foco',
    template: '%s · Modo Guerrero',
  },
  description:
    'Habitos, disciplina y autocontrol. Articulos y formacion para construir constancia real y sostenerla.',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Modo Guerrero',
  },
  /**
   * Staging nunca debe indexarse: competiria con produccion por las mismas
   * palabras clave y partiria en dos el trafico que sostiene la publicidad.
   */
  robots:
    publicEnv.environment === 'production'
      ? { index: true, follow: true }
      : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Valores por defecto del Modo de Consentimiento v2.
 *
 * Este script debe ejecutarse ANTES que cualquier script de Google. Ese orden
 * es lo que hace valida la implementacion: declarar todo como denegado de
 * partida y actualizarlo solo si el usuario acepta. Si el script de Google se
 * cargara primero y se denegara despues, los datos ya habrian salido.
 *
 * Va en `beforeInteractive` mediante una etiqueta en el propio head, no como
 * componente cliente: un componente se hidrata tarde, y para entonces el
 * momento util ya paso.
 */
const CONSENT_DEFAULTS = `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{
  ad_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  analytics_storage:'denied',
  wait_for_update: 500
});
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${oswald.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULTS }} />
      </head>
      <body className="min-h-screen bg-mg-negro text-mg-blanco antialiased">
        {children}
        <ConsentBanner />
      </body>
    </html>
  );
}
