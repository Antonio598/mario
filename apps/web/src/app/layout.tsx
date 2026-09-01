import type { Metadata, Viewport } from 'next';
import { Oswald, Inter } from 'next/font/google';
import { ConsentBanner } from '@/components/ConsentBanner';
import { publicEnv } from '@/lib/env';
import { SCRIPT_TEMA } from '@/components/app/InterruptorTema';
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
    default: 'Reset Alfa · Disciplina, autocontrol y foco',
    template: '%s · Reset Alfa',
  },
  description:
    'Habitos, disciplina y autocontrol. Articulos y formacion para construir constancia real y sostenerla.',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Reset Alfa',
  },
  /**
   * Staging nunca debe indexarse: competiria con produccion por las mismas
   * palabras clave y partiria en dos el trafico que sostiene la publicidad.
   */
  robots:
    publicEnv.environment === 'production'
      ? { index: true, follow: true }
      : { index: false, follow: false },
  /**
   * `apple` es obligatorio aparte del manifiesto: Safari no lee los iconos del
   * manifest. Sin esta linea, "Anadir a pantalla de inicio" guarda una captura
   * de la pagina en vez del logotipo.
   */
  icons: {
    icon: [{ url: '/icono.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/logos/app.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Reset Alfa',
    // `black-translucent` deja que el contenido suba bajo la barra de estado.
    // Es lo que hace falta para que el degradado de la cabecera llegue arriba
    // del todo en modo app; el hueco lo reserva el safe-area del header.
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  /**
   * `viewportFit: 'cover'` es lo que hace que `env(safe-area-inset-*)` devuelva
   * algo distinto de cero en un iPhone. Sin el, el hueco que la barra inferior
   * reserva para la barra de gestos vale 0 y la ultima fila de botones queda
   * debajo, donde no se puede pulsar.
   */
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
  /*
   * Sin `maximumScale` ni `userScalable: false`: bloquear el zoom es un fallo
   * de accesibilidad, e iOS lo ignora desde hace varias versiones de todos
   * modos.
   */
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F5F5' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
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
        {/*
          Fija el tema antes del primer pintado. Un componente de React se
          hidrata despues, y para entonces el usuario ya habria visto un
          fogonazo blanco. En una app que se abre de noche, ese fogonazo es lo
          que hace que se cierre.
        */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-screen bg-mg-negro text-mg-blanco antialiased">
        {children}
        <ConsentBanner />
      </body>
    </html>
  );
}
