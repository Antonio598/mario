import type { Metadata } from 'next';
import { titular, titularCompleto } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Como ponerse en contacto con Modo Guerrero.',
};

/**
 * Pagina obligatoria para AdSense y, en Espana, tambien para la LSSI-CE, que
 * exige datos identificativos accesibles del prestador del servicio.
 *
 * Los datos del titular llegan del entorno (ver lib/legal.ts), no del codigo:
 * son publicos en la pagina, pero no deben quedar en un repositorio publico.
 */

export const dynamic = 'force-dynamic';
export default function ContactoPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl sm:text-4xl">Contacto</h1>

      <div className="mt-8 space-y-5 text-mg-gris-texto">
        <p>
          Para cualquier consulta sobre los contenidos, los programas o el tratamiento de tus
          datos:
        </p>

        <p>
          <a href={`mailto:${titular.correo}`} className="text-mg-rojo hover:underline">
            {titular.correo}
          </a>
        </p>

        <div className="border-t border-mg-negro-borde pt-5 text-sm text-mg-gris-tenue">
          <p className="font-semibold text-mg-gris-texto">Datos identificativos</p>
          {titularCompleto ? (
            <div className="mt-2 space-y-1">
              <p>{titular.nombre}</p>
              <p>{titular.domicilio}</p>
              {titular.identificacion !== null && <p>RFC: {titular.identificacion}</p>}
            </div>
          ) : (
            <p className="mt-2">Titular y domicilio pendientes de completar.</p>
          )}
        </div>
      </div>
    </main>
  );
}
