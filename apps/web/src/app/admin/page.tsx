import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ESTILO_ESTADO = {
  publicado: 'border-mg-exito/40 bg-mg-exito/10 text-mg-exito',
  aprobado: 'border-mg-aviso/40 bg-mg-aviso/10 text-mg-aviso',
  draft: 'border-mg-negro-borde bg-mg-negro-alto text-mg-gris-tenue',
} as const;

export default async function AdminArticulosPage() {
  const supabase = await createClient();

  // Un editor ve TODOS los articulos, borradores incluidos. Lo permite la
  // politica `articles_editor_read`; para el resto del mundo siguen invisibles.
  const { data: articulos } = await supabase
    .from('articles')
    .select('id, slug, titulo, estado, fecha_publicacion, categoria, updated_at')
    .order('updated_at', { ascending: false });

  const lista = articulos ?? [];
  const publicados = lista.filter((a) => a.estado === 'publicado').length;
  const borradores = lista.filter((a) => a.estado === 'draft').length;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mg-kicker">Contenido</p>
          <h1 className="mg-rule mt-2 text-3xl">Artículos</h1>
        </div>

        <Link
          href="/admin/nuevo"
          className="rounded-md bg-mg-rojo px-5 py-2.5 font-titular text-sm font-semibold tracking-wider text-mg-blanco-puro uppercase transition-colors hover:bg-mg-rojo-oscuro"
        >
          Escribir uno nuevo
        </Link>
      </header>

      <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-mg-negro-borde bg-mg-negro-borde">
        {[
          { t: 'Publicados', v: publicados },
          { t: 'Borradores', v: borradores },
          { t: 'Total', v: lista.length },
        ].map((s) => (
          <div key={s.t} className="bg-mg-negro-elevado px-4 py-4 text-center">
            <dt className="text-[11px] tracking-widest text-mg-gris-tenue uppercase">{s.t}</dt>
            <dd className="mt-1 font-titular text-2xl tabular-nums">{s.v}</dd>
          </div>
        ))}
      </dl>

      {lista.length === 0 ? (
        <p className="mt-12 text-mg-gris-tenue">
          Todavía no hay artículos. Empieza por el primero.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-mg-negro-borde overflow-hidden rounded-lg border border-mg-negro-borde">
          {lista.map((a) => (
            <li key={a.id} className="relative">
              <Link
                href={`/admin/${a.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-mg-negro-elevado px-5 py-4 transition-colors hover:bg-mg-negro-alto"
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-mg-blanco">
                    {a.titulo}
                  </span>
                  <p className="mt-1 truncate text-xs text-mg-gris-tenue">
                    /{a.slug} · {a.categoria}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded border px-2 py-0.5 text-[10px] tracking-widest uppercase ${
                    ESTILO_ESTADO[a.estado]
                  }`}
                >
                  {a.estado}
                </span>
              </Link>

              {a.estado === 'publicado' && (
                <a
                  href={`/articulos/${a.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-5 top-1/2 z-10 -translate-y-1/2 shrink-0 text-xs text-mg-gris-tenue hover:text-mg-blanco"
                >
                  Ver ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
