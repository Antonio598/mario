import Link from 'next/link';
import { obtenerAcceso } from '@/lib/app/acceso';
import { PRECIO_PREMIUM_TEXTO } from '@/lib/app/enlaces';
import { IconoCandado, enlacePremium, type OrigenPremium } from './Bloqueado';

/* -------------------------------------------------------------------------- */
/* Banner: una línea de beneficio + CTA. Nada si ya es Premium.                */
/* -------------------------------------------------------------------------- */

const BENEFICIO: Record<OrigenPremium, string> = {
  inicio: 'Protocolo post-recaída, P.A.D, carta y racha sin límite.',
  formacion: 'Las herramientas del método, no solo las masterclasses.',
  calendario: 'Cada recaída con su protocolo, y tu racha entera.',
  tienda: 'La app completa por menos que un libro.',
  perfil: 'Desbloquea todas las herramientas.',
  protocolo: 'El protocolo de 9 preguntas es Premium.',
  pad: 'Crear tu P.A.D es Premium.',
  carta: 'La carta anti-recaída es Premium.',
  racha: 'Ve tu racha entera, sin tope de 30 días.',
  logros: 'Las medallas de 90, 180 y 365 días son Premium.',
};

export async function BannerPremium({ desde }: { desde: OrigenPremium }) {
  const acceso = await obtenerAcceso();
  if (acceso.esPremium) return null;

  return (
    <Link
      href={enlacePremium(desde)}
      className="ra-card ra-card-enlace mg-pulsable flex items-center gap-4 px-5 py-4"
      style={{ borderColor: 'color-mix(in srgb, var(--color-ra-rojo) 45%, transparent)' }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ra-rojo text-white">
        <IconoCandado tamano={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="ra-kicker">Premium · {PRECIO_PREMIUM_TEXTO}</span>
        <span className="mt-0.5 block text-sm text-ra-texto">{BENEFICIO[desde]}</span>
      </span>
      <span aria-hidden="true" className="shrink-0 text-ra-rojo">
        →
      </span>
    </Link>
  );
}
