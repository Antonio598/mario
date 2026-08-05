'use client';

import { useEffect, useState } from 'react';

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Registra el service worker y ofrece instalar la app.
 *
 * ACTUALIZACION AUTOMATICA — esto es lo importante de este fichero.
 *
 * Un service worker registrado sigue controlando la pagina indefinidamente
 * aunque se despliegue una version nueva. El sintoma es desconcertante: los
 * cambios se ven en un navegador donde nunca se ha entrado, y no en el propio,
 * que parece "haberse quedado pegado".
 *
 * Tres piezas lo resuelven:
 *
 *   1. `update()` en cada carga fuerza a comprobar si hay un sw.js nuevo.
 *   2. `skipWaiting` en el sw.js hace que el nuevo tome el control sin esperar
 *      a que se cierren todas las pestanas.
 *   3. `controllerchange` recarga la pagina en cuanto ese relevo ocurre.
 *
 * Sin la tercera, el service worker nuevo manda pero la pagina que el usuario
 * esta viendo sigue siendo la vieja hasta que navegue.
 */
export function RegistrarSW() {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null);
  const [oculto, setOculto] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registrar = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js');
          // Comprueba si hay version nueva en cada carga.
          void reg.update();
        } catch {
          // Sin service worker la app funciona igual: solo se pierde el aviso
          // de instalacion y la pantalla de sin conexion.
        }
      };

      // Tras la carga: registrarlo antes competiria por ancho de banda con los
      // recursos que el usuario si esta esperando ver.
      if (document.readyState === 'complete') void registrar();
      else window.addEventListener('load', () => void registrar(), { once: true });

      // El relevo de service worker recarga la pagina una sola vez. El
      // pestillo evita el bucle de recargas si el navegador dispara el evento
      // mas de una vez.
      let recargando = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (recargando) return;
        recargando = true;
        window.location.reload();
      });
    }

    // Chrome y Edge disparan este evento cuando la app cumple los requisitos de
    // instalacion. Safari no lo implementa: en iOS hay que usar Compartir >
    // Anadir a pantalla de inicio, y ahi no hay nada que podamos automatizar.
    const alPoderInstalar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalacion);
      // Respeta un rechazo anterior: insistir en cada visita es molesto.
      setOculto(localStorage.getItem('mg-instalacion-rechazada') === '1');
    };

    window.addEventListener('beforeinstallprompt', alPoderInstalar);
    return () => window.removeEventListener('beforeinstallprompt', alPoderInstalar);
  }, []);

  if (evento === null || oculto) return null;

  return (
    <div className="fixed inset-x-0 bottom-[76px] z-40 mx-auto max-w-md px-5">
      <div className="mg-card mg-subir flex items-center gap-4 px-4 py-3 shadow-lg">
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
          className="mg-pulsable rounded-md bg-mg-rojo px-4 py-2 font-titular text-xs font-semibold tracking-wider text-mg-blanco-puro uppercase"
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
