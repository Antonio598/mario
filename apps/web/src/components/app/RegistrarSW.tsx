'use client';

import { useEffect, useState } from 'react';

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Registra el service worker y ofrece instalar la app.
 *
 * Va montado dentro de /app y no en el layout raíz: quien está leyendo un
 * artículo no ha pedido instalar nada, y un aviso de instalación sobre un
 * artículo es exactamente el tipo de interrupción que hace que la gente cierre
 * la pestaña. Aquí, en cambio, el usuario ya ha entrado en su app.
 */
export function RegistrarSW() {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null);
  const [oculto, setOculto] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Tras la carga: registrarlo antes compite por ancho de banda con los
      // recursos que el usuario sí está esperando ver.
      const registrar = () => void navigator.serviceWorker.register('/sw.js');
      if (document.readyState === 'complete') registrar();
      else window.addEventListener('load', registrar, { once: true });
    }

    // Chrome y Edge disparan este evento cuando la app cumple los requisitos de
    // instalación. Safari no lo implementa: en iOS hay que usar Compartir >
    // Añadir a pantalla de inicio, y ahí no hay nada que podamos automatizar.
    const alPoderInstalar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalacion);
      // Respeta un rechazo anterior: insistir cada visita es molesto.
      setOculto(localStorage.getItem('mg-instalacion-rechazada') === '1');
    };

    window.addEventListener('beforeinstallprompt', alPoderInstalar);
    return () => window.removeEventListener('beforeinstallprompt', alPoderInstalar);
  }, []);

  if (evento === null || oculto) return null;

  return (
    <div className="fixed inset-x-0 bottom-[76px] z-40 mx-auto max-w-md px-5">
      <div className="mg-card flex items-center gap-4 px-4 py-3 shadow-lg">
        <div className="flex-1">
          <p className="text-sm text-mg-blanco">Instala Reset Alfa</p>
          <p className="text-xs text-mg-gris-tenue">Ábrela como una app, sin navegador.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            void evento.prompt();
            setOculto(true);
          }}
          className="rounded-md bg-mg-rojo px-4 py-2 font-titular text-xs font-semibold tracking-wider text-mg-blanco-puro uppercase"
        >
          Instalar
        </button>

        <button
          type="button"
          aria-label="Ahora no"
          onClick={() => {
            localStorage.setItem('mg-instalacion-rechazada', '1');
            setOculto(true);
          }}
          className="px-1 text-mg-gris-tenue"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
