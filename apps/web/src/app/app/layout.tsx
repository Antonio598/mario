import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NavegacionApp } from '@/components/app/NavegacionApp';

/**
 * Armazón de la app web (PWA).
 *
 * Deliberadamente distinto del de la web pública. Aquí NO van:
 *
 *   · Bloques de anuncio. Poner publicidad al lado de un formulario donde
 *     alguien describe su vida sexual es mala idea por dos motivos
 *     independientes: el riesgo con las políticas de AdSense sobre contenido
 *     sensible, y que resulta indecente. Además el inventario de una página
 *     privada no vale casi nada.
 *   · Cabecera de blog. Quien abre la app quiere su racha, no navegar por
 *     categorías.
 *
 * Toda la sección está protegida en el servidor: si no hay sesión, redirección
 * antes de renderizar nada.
 */
export const metadata: Metadata = {
  title: 'Reset Alfa',
  // Una página privada no debe indexarse jamás. Si Google la indexa, aparecen
  // en resultados pantallas personales del usuario.
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // getUser() y no getSession(): getUser valida el token contra el servidor de
  // Supabase. getSession solo lee la cookie, que el cliente podría haber
  // manipulado, y por tanto no sirve para decidir autorización.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    redirect('/entrar?siguiente=/app');
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-mg-negro">
      {/*
        pb-24 reserva el hueco de la barra inferior fija. Sin él, el último
        elemento de cada pantalla queda tapado por la navegación.
      */}
      <main className="flex-1 pb-24">{children}</main>
      <NavegacionApp />
    </div>
  );
}
