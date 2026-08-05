import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Panel',
  robots: { index: false, follow: false },
};

/**
 * Panel de administración.
 *
 * Esta comprobación es de INTERFAZ, no de seguridad. Evita enseñar un panel
 * inútil a quien no puede usarlo, pero quien se la salte no gana nada: las
 * políticas RLS de `articles` exigen rol de editor, así que la base de datos
 * rechazaría cualquier escritura aunque la pantalla se pintara.
 *
 * Esa es la razón de que el rol viva en Postgres y no en una variable de
 * entorno. Un permiso comprobado solo en la aplicación se rodea llamando a la
 * API directamente con la anon key, que es pública por diseño.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) redirect('/entrar?siguiente=/admin');

  const { data: rol } = await supabase.rpc('mi_rol');

  if (rol !== 'editor' && rol !== 'admin') {
    redirect('/app');
  }

  return (
    <div className="min-h-[100dvh] bg-mg-negro">
      <header className="sticky top-0 z-50 border-b border-mg-negro-borde bg-mg-negro/90 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-5xl items-center gap-6 px-5">
          <Link href="/admin" className="font-titular tracking-[0.18em] uppercase">
            Panel<span className="text-mg-rojo">.</span>
          </Link>

          <nav className="flex flex-1 gap-5 text-sm text-mg-gris-texto">
            <Link href="/admin" className="hover:text-mg-blanco">
              Artículos
            </Link>
            <Link href="/admin/nuevo" className="hover:text-mg-blanco">
              Nuevo
            </Link>
          </nav>

          <Link href="/app" className="text-sm text-mg-gris-tenue hover:text-mg-blanco">
            Salir del panel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">{children}</main>
    </div>
  );
}
