import Link from 'next/link';

/**
 * Portada provisional de la Fase 1.
 *
 * La portada real, el indice de articulos y las paginas de categoria llegan en
 * la Fase 3, que es la que construye el motor de trafico.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-4 text-sm tracking-[0.2em] text-mg-rojo uppercase">Modo Guerrero</p>

      <h1 className="text-4xl sm:text-6xl">
        Disciplina, autocontrol
        <br />y foco
      </h1>

      <p className="mt-6 max-w-xl text-lg text-mg-gris-texto">
        Habitos, constancia y decisiones. Sin atajos y sin promesas.
      </p>

      <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-sm text-mg-gris-tenue">
        <Link href="/acerca-de" className="hover:text-mg-blanco">
          Acerca de
        </Link>
        <Link href="/contacto" className="hover:text-mg-blanco">
          Contacto
        </Link>
        <Link href="/privacidad" className="hover:text-mg-blanco">
          Privacidad
        </Link>
      </nav>
    </main>
  );
}
