import Link from 'next/link';
import { obtenerAcceso } from '@/lib/app/acceso';
import { GRACIA_HORAS, PRECIO_PREMIUM_TEXTO } from '@/lib/app/enlaces';
import { BotonPortal } from './BotonesPremium';
import { IconoCandado, enlacePremium } from './Bloqueado';

/** `expires_at` incluye la gracia; la fecha que entiende el usuario es la del cobro. */
function fechaCorta(iso: string): string {
  const sinGracia = new Date(new Date(iso).getTime() - GRACIA_HORAS * 3_600_000);
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(sinGracia);
}

/**
 * Estado de la suscripción en Perfil.
 *
 * Es la única pantalla desde la que se gestiona: el resto de la app vende, aquí
 * se administra. Por eso va separada de AccionesCuenta, que es solo RGPD.
 */
export async function SeccionPremium() {
  const acceso = await obtenerAcceso();

  if (!acceso.esPremium) {
    return (
      <section
        className="ra-card px-5 py-5"
        style={{ borderColor: 'color-mix(in srgb, var(--color-ra-rojo) 45%, transparent)' }}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ra-rojo text-white">
            <IconoCandado tamano={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="ra-kicker">Plan gratuito</p>
            <h2 className="mt-1.5 font-titular text-xl font-bold text-ra-texto uppercase">
              Hazte Premium
            </h2>
            <p className="mt-1.5 text-sm text-ra-texto-sec">
              Bitácora de NOFAP, P.A.D, carta anti-recaída y racha sin límite.{' '}
              {PRECIO_PREMIUM_TEXTO}. Cancela cuando quieras.
            </p>
          </div>
        </div>
        <Link href={enlacePremium('perfil')} className="ra-boton mt-5">
          Ver Premium
        </Link>
      </section>
    );
  }

  return (
    <section className="ra-card px-5 py-5">
      <p className="ra-kicker">Premium activo</p>
      <p className="mt-2 text-sm text-ra-texto-sec">
        {acceso.expiraEn === null
          ? 'Acceso sin fecha de fin.'
          : acceso.cancelaAlFinal
            ? `Cancelado. Conservas el acceso hasta el ${fechaCorta(acceso.expiraEn)}.`
            : `Se renueva el ${fechaCorta(acceso.expiraEn)}.`}
      </p>
      {acceso.tieneCliente && (
        <div className="mt-4">
          <BotonPortal />
        </div>
      )}
    </section>
  );
}
