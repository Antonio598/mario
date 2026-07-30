'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const CLAVE = 'mg-consent-v1';

type Decision = 'aceptado' | 'rechazado';

/**
 * Banner de consentimiento compatible con el Marco de Consentimiento de Google.
 *
 * SIN ESTO NO HAY NEGOCIO EN LA UE. Desde 2024 Google exige una plataforma de
 * consentimiento certificada para servir anuncios personalizados en el Espacio
 * Economico Europeo; sin senal de consentimiento, deja de servir anuncios o
 * sirve solo los no personalizados, que pagan mucho menos.
 *
 * COMO FUNCIONA EL MODO DE CONSENTIMIENTO v2:
 * Los valores por defecto se declaran ANTES de cargar ningun script de Google
 * —todo denegado— y solo se actualizan si el usuario acepta. Ese orden es lo
 * que hace que el modo de consentimiento sea valido: si el script se carga
 * primero y se deniega despues, ya se han enviado datos.
 *
 * IMPORTANTE PARA LA CERTIFICACION: para produccion en la UE hay que sustituir
 * esta implementacion por una plataforma certificada del Marco de
 * Transparencia y Consentimiento (Cookiebot, Didomi, Osano...). Este componente
 * emite las senales correctas y bloquea la carga, pero no esta certificado.
 * Ver docs/adsense-checklist.md.
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const guardado = window.localStorage.getItem(CLAVE);

    if (guardado === 'aceptado') {
      activarMedicion();
      return;
    }
    if (guardado === 'rechazado') return;

    setVisible(true);
  }, []);

  function decidir(decision: Decision) {
    window.localStorage.setItem(CLAVE, decision);
    setVisible(false);
    if (decision === 'aceptado') activarMedicion();
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimiento de cookies"
      aria-modal="false"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-mg-negro-borde bg-mg-negro-elevado p-4 sm:p-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-mg-gris-texto">
          Usamos cookies propias y de terceros para medir el uso del sitio y mostrar publicidad.
          Puedes aceptarlas o rechazarlas: en ambos casos el contenido es el mismo.{' '}
          <Link href="/privacidad" className="text-mg-rojo underline">
            Mas informacion
          </Link>
        </p>

        <div className="flex shrink-0 gap-3">
          {/* Rechazar es tan visible y tan facil como aceptar. Es requisito del
              RGPD (art. 7.3) y lo que evita una sancion de la AEPD, que ya ha
              multado por banners con el rechazo escondido. */}
          <button
            type="button"
            onClick={() => decidir('rechazado')}
            className="min-h-11 flex-1 border border-mg-negro-borde px-5 text-sm font-semibold text-mg-blanco hover:bg-mg-negro sm:flex-none"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => decidir('aceptado')}
            className="min-h-11 flex-1 bg-mg-rojo px-5 text-sm font-semibold text-mg-blanco hover:bg-mg-rojo-oscuro sm:flex-none"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Carga los scripts de medicion y publicidad, solo tras el consentimiento.
 *
 * Se inyectan aqui y no en el layout precisamente para que no existan antes de
 * la decision del usuario.
 */
function activarMedicion() {
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };

  w.dataLayer = w.dataLayer ?? [];
  const gtag = (...args: unknown[]) => {
    w.dataLayer?.push(args);
  };

  gtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  });

  const ga = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  if (ga !== undefined && ga !== '' && document.getElementById('ga4') === null) {
    const s = document.createElement('script');
    s.id = 'ga4';
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', ga);
  }

  const ads = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (ads !== undefined && ads !== '' && document.getElementById('adsense') === null) {
    const s = document.createElement('script');
    s.id = 'adsense';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads}`;
    document.head.appendChild(s);
  }
}
