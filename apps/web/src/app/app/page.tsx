import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ContadorRacha } from '@/components/app/ContadorRacha';
import { CheckinDiario } from '@/components/app/CheckinDiario';
import type { EstadoDiario } from '@/lib/app/tipos';

/**
 * Inicio de la app web.
 *
 * Dinámica a propósito: muestra el estado de HOY del usuario, así que no puede
 * cachearse ni prerenderizarse. Es lo contrario de las páginas de artículo, que
 * son estáticas precisamente porque son iguales para todos.
 */
export const dynamic = 'force-dynamic';

export default async function AppInicioPage() {
  const supabase = await createClient();

  // El servidor calcula la fecha local del usuario a partir de la zona horaria
  // de su perfil. Nunca se usa la del navegador: cambiar el reloj del
  // dispositivo bastaría para inflar la racha.
  const { data, error } = await supabase.rpc('estado_diario');

  if (error) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-2xl">No hemos podido cargar tu racha</h1>
        <p className="mt-3 text-sm text-mg-gris-texto">
          Revisa tu conexión y vuelve a intentarlo.
        </p>
      </div>
    );
  }

  const estado = data as unknown as EstadoDiario;

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <header className="mb-8">
        <p className="mg-kicker">Tu racha</p>
        <h1 className="mt-2 text-3xl">Modo Guerrero</h1>
      </header>

      <ContadorRacha
        dias={estado.racha_actual}
        record={estado.record_personal}
        diasTotales={estado.dias_totales}
      />

      <div className="mt-10">
        <CheckinDiario estado={estado} />
      </div>

      <section className="mt-12">
        <h2 className="mg-rule text-lg">Recuerda tu misión</h2>
        <p className="mt-5 text-mg-gris-texto">
          No estás resistiendo un impulso. Estás construyendo a alguien que ya no lo tiene.
        </p>
      </section>

      <nav className="mt-10 grid grid-cols-2 gap-3">
        <Link href="/app/formacion" className="mg-card mg-card-link block px-4 py-5">
          <span className="mg-kicker">Formación</span>
          <p className="mt-2 text-sm text-mg-gris-texto">Masterclasses y protocolos</p>
        </Link>
        <Link href="/app/calendario" className="mg-card mg-card-link block px-4 py-5">
          <span className="mg-kicker">Calendario</span>
          <p className="mt-2 text-sm text-mg-gris-texto">Tu historial completo</p>
        </Link>
      </nav>
    </div>
  );
}
