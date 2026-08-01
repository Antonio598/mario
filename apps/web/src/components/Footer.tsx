import Link from 'next/link';

/**
 * Pie del sitio público.
 *
 * Las páginas de Acerca de, Contacto y Privacidad enlazadas desde todas las
 * páginas no son un detalle de cortesía: AdSense rechaza los sitios que no las
 * tienen accesibles, y sin AdSense no hay ingreso publicitario.
 *
 * El aviso de que la app no es un tratamiento médico va aquí y no solo en
 * Acerca de: protege legalmente al cliente y es lo correcto.
 */
export function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-mg-negro-borde bg-mg-negro-elevado">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <span className="font-titular text-lg font-bold tracking-[0.2em] uppercase">
              Modo<span className="text-mg-rojo">Guerrero</span>
            </span>
            <p className="mt-3 max-w-xs text-sm text-mg-gris-tenue">
              Disciplina, autocontrol y foco. Sin atajos y sin promesas.
            </p>
          </div>

          <div>
            <h2 className="font-titular text-sm tracking-widest text-mg-blanco uppercase">
              Secciones
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-mg-gris-texto">
              <li>
                <Link href="/articulos" className="hover:text-mg-blanco">
                  Todos los artículos
                </Link>
              </li>
              <li>
                <Link href="/categoria/disciplina" className="hover:text-mg-blanco">
                  Disciplina
                </Link>
              </li>
              <li>
                <Link href="/categoria/autocontrol" className="hover:text-mg-blanco">
                  Autocontrol
                </Link>
              </li>
              <li>
                <Link href="/app" className="hover:text-mg-blanco">
                  Abrir la app
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-titular text-sm tracking-widest text-mg-blanco uppercase">
              Legal
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-mg-gris-texto">
              <li>
                <Link href="/acerca-de" className="hover:text-mg-blanco">
                  Acerca de
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-mg-blanco">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-mg-blanco">
                  Privacidad y cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-mg-negro-borde pt-6">
          <p className="text-xs leading-relaxed text-mg-gris-apagado">
            Modo Guerrero es un proyecto de hábitos y disciplina. No es un tratamiento médico ni
            psicológico y no sustituye la atención de un profesional. Si estás pasando un mal
            momento, el{' '}
            <a
              href="https://telefonodelaesperanza.org"
              rel="noopener noreferrer"
              target="_blank"
              className="underline hover:text-mg-gris-texto"
            >
              Teléfono de la Esperanza
            </a>{' '}
            atiende gratis las 24 horas.
          </p>
          <p className="mt-4 text-xs text-mg-gris-apagado">© {anio} Modo Guerrero</p>
        </div>
      </div>
    </footer>
  );
}
