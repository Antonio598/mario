import { createClient } from '@/lib/supabase/server';
import { AccionesCuenta } from '@/components/app/AccionesCuenta';
import { InterruptorTema } from '@/components/app/InterruptorTema';

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
        <p className="ra-kicker">Cuenta</p>
        <h1 className="ra-titulo mt-2">{perfil?.nombre ?? 'Perfil'}</h1>
        {user?.email !== undefined && <p className="ra-entradilla">{user.email}</p>}
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { t: 'Récord', v: perfil?.record_personal ?? 0 },
          { t: 'Días totales', v: perfil?.dias_totales ?? 0 },
        ].map((c) => (
          <div key={c.t} className="ra-card px-4 py-4 text-center">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-ra-texto-tenue uppercase">
              {c.t}
            </p>
            <p className="mt-1.5 font-titular text-3xl font-bold tabular-nums text-ra-texto">
              {c.v}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <InterruptorTema />
      </div>

      <AccionesCuenta
        consienteSensibles={consienteSensibles}
        timezone={perfil?.timezone ?? 'Europe/Madrid'}
      />


    </div>
  );
}
