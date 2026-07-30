import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Como ponerse en contacto con Modo Guerrero.',
};

/**
 * Pagina obligatoria para AdSense y, en Espana, tambien para la LSSI-CE, que
 * exige datos identificativos accesibles del prestador del servicio.
 *
 * PENDIENTE: el cliente debe aportar razon social o nombre completo, NIF y
 * domicilio antes de publicar. Sin ellos la pagina no cumple.
 */
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
          {/* PENDIENTE: sustituir por la direccion real. */}
          <a href="mailto:hola@modoguerrero.es" className="text-mg-rojo hover:underline">
            hola@modoguerrero.es
          </a>
        </p>

        <div className="border-t border-mg-negro-borde pt-5 text-sm text-mg-gris-tenue">
          <p className="font-semibold text-mg-gris-texto">Datos identificativos</p>
          <p className="mt-2">
            {/* PENDIENTE: obligatorio por LSSI-CE art. 10. */}
            Titular, NIF y domicilio pendientes de completar.
          </p>
        </div>
      </div>
    </main>
  );
}
