import { createClient } from '@/lib/supabase/server';
import { AccionesCuenta } from '@/components/app/AccionesCuenta';
import { AVISO_NO_TERAPEUTICO, RECURSOS_AYUDA } from '@reset-alfa/shared';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfil }, { data: consentimientos }] = await Promise.all([
    supabase.from('profiles').select('*').maybeSingle(),
    supabase
      .from('consents')
      .select('tipo, concedido, created_at')
      .eq('tipo', 'datos_sensibles')
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const consienteSensibles = consentimientos?.[0]?.concedido ?? false;

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <header>
        <p className="mg-kicker">Cuenta</p>
        <h1 className="mt-2 text-3xl">{perfil?.nombre ?? 'Perfil'}</h1>
        {user?.email !== undefined && (
          <p className="mt-1 text-sm text-mg-gris-tenue">{user.email}</p>
        )}
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-mg-negro-borde bg-mg-negro-borde">
        <div className="bg-mg-negro-elevado px-4 py-4 text-center">
          <dt className="text-[11px] tracking-widest text-mg-gris-tenue uppercase">Récord</dt>
          <dd className="mt-1 font-titular text-2xl tabular-nums">
            {perfil?.record_personal ?? 0}
          </dd>
        </div>
        <div className="bg-mg-negro-elevado px-4 py-4 text-center">
          <dt className="text-[11px] tracking-widest text-mg-gris-tenue uppercase">
            Días totales
          </dt>
          <dd className="mt-1 font-titular text-2xl tabular-nums">{perfil?.dias_totales ?? 0}</dd>
        </div>
      </dl>

      <AccionesCuenta
        consienteSensibles={consienteSensibles}
        timezone={perfil?.timezone ?? 'Europe/Madrid'}
      />

      {/*
        Recursos de ayuda profesional. Requisito del proyecto: protege
        legalmente al cliente y es lo correcto. Discreto, no destacado.
      */}
      <section className="mt-12 border-t border-mg-negro-borde pt-6">
        <h2 className="font-titular text-sm tracking-widest text-mg-gris-texto uppercase">
          Ayuda profesional
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {RECURSOS_AYUDA.map((r) => (
            <li key={r.nombre}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-mg-rojo-claro underline underline-offset-2"
              >
                {r.nombre}
              </a>
              {r.telefono !== null && <span className="text-mg-gris-tenue"> · {r.telefono}</span>}
              <p className="text-xs text-mg-gris-tenue">{r.descripcion}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-mg-gris-apagado">
          {AVISO_NO_TERAPEUTICO}
        </p>
      </section>
    </div>
  );
}
