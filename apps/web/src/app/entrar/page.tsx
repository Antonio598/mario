import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FormularioAcceso } from '@/components/app/FormularioAcceso';
import { Logo } from '@/components/app/Logo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Entrar',
  // Una pantalla de acceso no aporta nada en resultados de búsqueda y compite
  // con las páginas que sí traen tráfico.
  robots: { index: false, follow: false },
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ siguiente?: string; registro?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { siguiente, registro } = await searchParams;
  const vieneDelTest = registro === '1';

  // Redirección abierta: sin esta comprobación, ?siguiente=https://sitio-falso
  // convertiría el dominio en trampolín de phishing con la credibilidad de la
  // marca detrás.
  const destino =
    siguiente !== undefined && siguiente.startsWith('/') && !siguiente.startsWith('//')
      ? siguiente
      : '/app';

  if (user !== null) redirect(destino);

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="inline-block">
        <Logo variante="app" alto={72} prioridad />
      </Link>
      <h1 className="mt-6 text-4xl">{vieneDelTest ? 'Crea tu cuenta' : 'Entra'}</h1>
      <p className="mt-3 text-mg-gris-texto">
        {vieneDelTest ? 'Tu plan te está esperando.' : 'Tu racha te está esperando.'}
      </p>

      <FormularioAcceso destino={destino} modoInicial={vieneDelTest ? 'registro' : 'entrar'} />

      {!vieneDelTest && (
        <p className="mt-6 text-center text-sm text-mg-gris-tenue">
          ¿Nuevo aquí?{' '}
          <Link href="/empezar" className="text-mg-rojo underline underline-offset-2">
            Empieza por el test de 2 minutos
          </Link>
        </p>
      )}

      <p className="mt-10 text-center text-xs text-mg-gris-apagado">
        Al continuar aceptas la{' '}
        <Link href="/privacidad" className="underline hover:text-mg-gris-tenue">
          política de privacidad
        </Link>
        .
      </p>
    </main>
  );
}
