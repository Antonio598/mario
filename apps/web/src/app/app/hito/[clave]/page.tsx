import { notFound } from 'next/navigation';
import { obtenerAcceso } from '@/lib/app/acceso';
import { esClaveHito } from '@/lib/app/hitos';
import { HitoLanding } from '@/components/app/HitoLanding';

export const dynamic = 'force-dynamic';

/**
 * Landing de un hito, accesible por URL.
 *
 * Inicio la muestra sola como interstitial cuando toca; esta ruta existe
 * para volver a ella despues (desde Calendario, desde un enlace) sin que
 * vuelva a contar como "no vista".
 */
export default async function HitoPage({ params }: { params: Promise<{ clave: string }> }) {
  const { clave } = await params;
  if (!esClaveHito(clave)) notFound();

  const acceso = await obtenerAcceso();
  return <HitoLanding clave={clave} esPremium={acceso.esPremium} modo="pagina" />;
}
