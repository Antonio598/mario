import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FormularioAcceso } from '@/components/app/FormularioAcceso';

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
  searchParams: Promise<{ siguiente?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { siguiente } = await searchParams;

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
      <Link href="/" className="mg-kicker">
        Modo Guerrero
      </Link>
      <h1 className="mt-3 text-4xl">Entra</h1>
      <p className="mt-3 text-mg-gris-texto">Tu racha te está esperando.</p>

      <FormularioAcceso destino={destino} />

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
