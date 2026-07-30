import type { Metadata, Viewport } from 'next';
import { Oswald, Inter } from 'next/font/google';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${oswald.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-mg-negro text-mg-blanco antialiased">{children}</body>
    </html>
  );
}
