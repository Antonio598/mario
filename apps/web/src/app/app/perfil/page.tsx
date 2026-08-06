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
    <div className="mx-auto max-w-md px-5 py-6">
      <header>
        <p className="font-titular text-xs font-semibold tracking-[0.2em] text-ra-rojo uppercase">
          Cuenta
        </p>
        <h1 className="mt-2 font-titular text-3xl font-bold text-ra-negro uppercase">
          {perfil?.nombre ?? 'Perfil'}
        </h1>
        {user?.email !== undefined && (
          <p className="mt-1 text-sm text-ra-texto-tenue">{user.email}</p>
        )}
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="ra-card px-4 py-3.5 text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
            Récord
          </p>
          <p className="mt-1 font-titular text-2xl font-bold tabular-nums text-ra-negro">
            {perfil?.record_personal ?? 0}
          </p>
        </div>
        <div className="ra-card px-4 py-3.5 text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
            Días totales
          </p>
          <p className="mt-1 font-titular text-2xl font-bold tabular-nums text-ra-negro">
            {perfil?.dias_totales ?? 0}
          </p>
        </div>
      </div>

      <AccionesCuenta
        consienteSensibles={consienteSensibles}
        timezone={perfil?.timezone ?? 'Europe/Madrid'}
      />

      {/*
        Recursos de ayuda profesional. Requisito del proyecto: protege
        legalmente al cliente y es lo correcto. Discreto, no destacado.
      */}
      <section className="mt-10 border-t border-ra-borde pt-6">
        <h2 className="font-titular text-sm font-semibold tracking-widest text-ra-texto-sec uppercase">
          Ayuda profesional
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {RECURSOS_AYUDA.map((r) => (
            <li key={r.nombre}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ra-rojo underline underline-offset-2"
              >
                {r.nombre}
              </a>
              {r.telefono !== null && <span className="text-ra-texto-tenue"> · {r.telefono}</span>}
              <p className="text-xs text-ra-texto-tenue">{r.descripcion}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-ra-texto-tenue">
          {AVISO_NO_TERAPEUTICO}
        </p>
      </section>
    </div>
  );
}
