import Link from 'next/link';
import { listarArticulos } from '@/lib/articulos';
import { TarjetaArticulo } from '@/components/TarjetaArticulo';
import { CapturaEmail } from '@/components/CapturaEmail';

/**
 * Portada.
 *
 * Se regenera cada hora: los artículos nuevos deben aparecer sin desplegar
 * nada, pero servir HTML ya construido es lo que mantiene el LCP bajo, y el
 * LCP es lo que sostiene el posicionamiento del que vive el negocio.
 */
export const revalidate = 3600;

const PILARES = [
  {
    numero: '01',
    titulo: 'Sistema, no motivación',
    texto:
      'La motivación se agota a los tres días. Lo que aguanta es un sistema que funciona también cuando no te apetece.',
  },
  {
    numero: '02',
    titulo: 'Registro, no culpa',
    texto:
      'Una recaída es información. Anotas dónde, cuándo y qué la disparó, ajustas el protocolo y sigues.',
  },
  {
    numero: '03',
    titulo: 'Constancia medida',
    texto:
      'Lo que no se mide se abandona. Tu racha, tus días totales y tus patrones, delante cada día.',
  },
] as const;

export default async function HomePage() {
  const { articulos } = await listarArticulos({ porPagina: 6 });

  return (
    <main>
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-14 sm:pt-24 sm:pb-20">
        <p className="mg-kicker">Modo Guerrero</p>

        <h1 className="mt-4 max-w-4xl text-5xl sm:text-7xl">
          Disciplina,
          <br />
          autocontrol
          <br />
          <span className="text-mg-rojo">y foco.</span>
        </h1>

        <p className="mt-7 max-w-xl text-lg text-mg-gris-texto">
          Hábitos, constancia y decisiones. Artículos nuevos cada día y una app para llevar la
          cuenta de lo único que importa: los días que sostienes.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/app"
            className="rounded-md bg-mg-rojo px-6 py-3 font-titular font-semibold tracking-wider text-mg-blanco-puro uppercase transition-colors hover:bg-mg-rojo-oscuro"
          >
            Empezar ahora
          </Link>
          <Link
            href="/articulos"
            className="rounded-md border border-mg-negro-borde px-6 py-3 font-titular font-semibold tracking-wider uppercase transition-colors hover:border-mg-gris-tenue"
          >
            Leer los artículos
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Los tres pilares                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-mg-negro-borde bg-mg-negro-elevado">
        <div className="mx-auto grid max-w-6xl gap-px bg-mg-negro-borde sm:grid-cols-3">
          {PILARES.map((p) => (
            <div key={p.numero} className="bg-mg-negro-elevado px-6 py-10">
              <span className="font-titular text-3xl text-mg-rojo">{p.numero}</span>
              <h2 className="mt-3 text-xl">{p.titulo}</h2>
              <p className="mt-3 text-sm text-mg-gris-texto">{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Últimos artículos                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="mg-rule text-2xl sm:text-3xl">Lo último</h2>
          <Link
            href="/articulos"
            className="shrink-0 text-sm text-mg-gris-texto hover:text-mg-blanco"
          >
            Ver todos →
          </Link>
        </div>

        {articulos.length === 0 ? (
          <p className="mt-10 text-mg-gris-tenue">
            Todavía no hay artículos publicados. Vuelve en unos días.
          </p>
        ) : (
          <div className="mg-escalonado mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articulos.map((a) => (
              <TarjetaArticulo key={a.slug} articulo={a} />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Captación de email                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-2xl px-5 pb-8">
        <CapturaEmail origen="portada" />
      </section>
    </main>
  );
}
