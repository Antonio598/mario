import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NavegacionApp } from '@/components/app/NavegacionApp';
import { RegistrarSW } from '@/components/app/RegistrarSW';

/**
 * Armazón de la app web (PWA) — Reset Alfa.
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
 * Tema claro: la app usa fondo blanco con acentos rojos y negros, distinto
 * del tema oscuro del blog y el panel admin.
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

  // Comprobar si es editor para mostrar el enlace al panel
  const { data: rol } = await supabase.rpc('mi_rol');
  const esEditor = rol === 'editor' || rol === 'admin';

  return (
    <div className="ra-app flex min-h-[100dvh] flex-col bg-ra-fondo">
      {/* Header con logo Reset Alfa */}
      <header className="ra-cabecera sticky top-0 z-50 border-b border-ra-borde bg-ra-superficie/90 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-[60px] max-w-md items-center justify-between px-5">
          <Link href="/app" className="flex items-center gap-2.5">
            <Image
              src="/casco-espartano.svg"
              alt=""
              width={36}
              height={40}
              className="h-9 w-auto"
              priority
            />
            <div className="leading-none">
              <span className="font-titular text-lg font-bold tracking-[0.08em] text-ra-texto uppercase">
                Reset<span className="text-ra-rojo"> Alfa</span>
              </span>
              {/* 8 px era ilegible en un movil. 9,5 con menos tracking cabe
                  igual y se lee. */}
              <p className="mt-0.5 text-[9.5px] font-semibold tracking-[0.16em] text-ra-texto-tenue uppercase">
                Disciplina | Enfoque | Libertad
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {esEditor && (
              <Link
                href="/admin"
                className="rounded-full border border-ra-borde px-3 py-1 text-[10px] font-semibold tracking-wider text-ra-texto-tenue uppercase transition-colors hover:border-ra-rojo hover:text-ra-rojo"
              >
                Panel
              </Link>
            )}
            {/*
              El avatar llevaba `bg-ra-negro`, token que se invierte en modo
              oscuro: era un circulo blanco encendido, el elemento mas llamativo
              de una cabecera que debe pasar desapercibida. Ahora es una
              superficie con borde, como el resto de la interfaz.
            */}
            <Link href="/app/perfil" aria-label="Perfil">
              <div className="mg-pulsable flex h-9 w-9 items-center justify-center rounded-full border border-ra-borde bg-ra-fondo transition-colors hover:border-ra-rojo">
                <Image
                  src="/casco-espartano.svg"
                  alt=""
                  width={20}
                  height={22}
                  className="h-5 w-auto"
                />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/*
        `ra-contenido` reserva el hueco de la barra inferior fija MAS la barra
        de gestos del iPhone. Antes era un `pb-24` fijo que no sabia nada del
        area segura: en un iPhone con barra de gestos, el ultimo elemento de
        cada pantalla quedaba debajo y no se podia tocar.
      */}
      <main className="mg-pagina ra-contenido flex-1">{children}</main>
      <RegistrarSW />
      <NavegacionApp />
    </div>
  );
}
