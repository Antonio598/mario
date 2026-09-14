'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ENLACE_LIBRO_ENERGIA,
  ENLACE_SESION_DIAGNOSTICA,
  HITOS,
  PRECIO_SESION_DIAGNOSTICA,
  type ClaveHito,
} from '@/lib/app/hitos';
import { PRECIO_PREMIUM_TEXTO } from '@/lib/app/enlaces';
import { IconoCandado } from './Bloqueado';

interface Props {
  clave: ClaveHito;
  esPremium: boolean;
  /**
   * Como interstitial (desde Inicio) se marca el hito como visto al salir y se
   * refresca; como página suelta solo se navega.
   */
  modo: 'interstitial' | 'pagina';
}

function IconoExterno() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

/**
 * Landing de hito: un vídeo y las llamadas a la acción de ese momento.
 *
 * Es una pantalla entera, sin barra ni contador: el usuario está en un momento
 * de máxima receptividad (acaba de llegar a una semana, a un mes, o acaba de
 * caer) y lo único que debe haber delante es el vídeo y lo que viene después.
 *
 * El vídeo va con `preload="metadata"` y controles nativos. Son ficheros de
 * 9-16 MB: con autoplay o precarga completa, abrir Inicio en el móvil costaría
 * datos antes de que el usuario decidiera nada.
 */
export function HitoLanding({ clave, esPremium, modo }: Props) {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);
  const def = HITOS[clave];

  async function continuar() {
    setSaliendo(true);
    // Los de racha se ven una vez; el de recaída se ve en cada recaída.
    if (modo === 'interstitial' && clave !== 'recaida') {
      const supabase = createClient();
      await supabase.rpc('marcar_hito', { p_hito: clave });
      router.refresh();
      return;
    }
    router.push('/app');
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
      <p className="ra-kicker">{def.kicker}</p>
      <h1 className="ra-titulo mt-3">{def.titulo}</h1>
      <p className="mt-3 text-sm leading-relaxed text-ra-texto-sec">{def.texto}</p>

      {/* Vídeo */}
      <div className="ra-card mt-6 overflow-hidden">
        <video
          src={def.video}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black"
        />
      </div>

      {/* Llamadas a la acción según el hito */}
      <div className="mt-6 grid gap-3">
        {clave === '30-dias' && (
          <section
            className="ra-card px-5 py-5"
            style={{ borderColor: 'color-mix(in srgb, var(--color-ra-rojo) 55%, transparent)' }}
          >
            <p className="ra-kicker">Sesión diagnóstica</p>
            <h2 className="mt-2 font-titular text-2xl leading-tight font-bold text-ra-texto uppercase">
              Una hora con Mario, a solas
            </h2>
            <p className="mt-2 text-sm text-ra-texto-sec">
              Revisáis tu caso, tus patrones y el plan para los siguientes 60 días. Con un mes de
              racha ya tienes datos que analizar.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-titular text-xl font-bold text-ra-texto">
                {PRECIO_SESION_DIAGNOSTICA}
              </span>
              <span className="text-xs text-ra-texto-tenue">Pago único · Stripe</span>
            </div>
            <a
              href={ENLACE_SESION_DIAGNOSTICA}
              target="_blank"
              rel="noopener noreferrer"
              className="ra-boton mt-4"
            >
              Reservar mi sesión
              <IconoExterno />
            </a>
          </section>
        )}

        {clave === 'recaida' && (
          <>
            {!esPremium && (
              <Link
                href="/app/premium?desde=recaida"
                className="ra-card ra-card-enlace mg-pulsable block px-5 py-5"
                style={{ borderColor: 'color-mix(in srgb, var(--color-ra-rojo) 55%, transparent)' }}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ra-rojo text-white">
                    <IconoCandado tamano={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="ra-kicker">Premium · {PRECIO_PREMIUM_TEXTO}</p>
                    <h2 className="mt-1.5 font-titular text-xl leading-tight font-bold text-ra-texto uppercase">
                      Que la próxima no te pille sin plan
                    </h2>
                    <p className="mt-1.5 text-sm text-ra-texto-sec">
                      Bitácora de NOFAP, P.A.D y carta anti-recaída: las tres herramientas
                      para el momento exacto en que aparece el deseo.
                    </p>
                  </div>
                </div>
                <span className="ra-boton mt-4">Ver Premium</span>
              </Link>
            )}

            <a
              href={ENLACE_LIBRO_ENERGIA}
              target="_blank"
              rel="noopener noreferrer"
              className="ra-card ra-card-enlace mg-pulsable flex gap-4 px-4 py-4"
            >
              <Image
                src="/libros/energia-sexual-masculina.jpg"
                alt="Portada de Energía Sexual Masculina"
                width={88}
                height={88}
                className="h-22 w-22 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="ra-kicker">El libro</p>
                <h2 className="mt-1.5 font-titular text-lg leading-tight font-bold text-ra-texto uppercase">
                  Energía Sexual Masculina
                </h2>
                <p className="mt-1 text-xs text-ra-texto-sec">
                  El poder de la retención seminal, explicado para transmutarlo en disciplina.
                </p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ra-rojo">
                  Conseguir el libro
                  <IconoExterno />
                </span>
              </div>
            </a>
          </>
        )}

        {clave === '7-dias' && !esPremium && (
          <Link
            href="/app/premium?desde=hito"
            className="ra-card ra-card-enlace mg-pulsable flex items-center gap-4 px-5 py-4"
            style={{ borderColor: 'color-mix(in srgb, var(--color-ra-rojo) 45%, transparent)' }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ra-rojo text-white">
              <IconoCandado tamano={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="ra-kicker">Premium · {PRECIO_PREMIUM_TEXTO}</span>
              <span className="mt-0.5 block text-sm text-ra-texto">
                La segunda semana es donde más se cae. Ten las herramientas antes.
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-ra-rojo">
              →
            </span>
          </Link>
        )}
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={() => void continuar()}
          disabled={saliendo}
          className={clave === '7-dias' ? 'ra-boton' : 'ra-boton-sec'}
        >
          {clave === '7-dias' ? 'Seguir con mi racha' : 'Volver a la app'}
        </button>
      </div>
    </div>
  );
}
