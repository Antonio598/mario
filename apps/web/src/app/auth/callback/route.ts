import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Retorno de OAuth (Google y Apple) y de los enlaces magicos de correo.
 *
 * Supabase devuelve un codigo de un solo uso que aqui se canjea por una sesion.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Redireccion abierta: sin esta comprobacion, ?next=https://sitio-malicioso
  // convertiria nuestro dominio en un trampolin de phishing con la credibilidad
  // de la marca detras.
  const destino = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  if (code === null) {
    return NextResponse.redirect(`${origin}/auth/error?motivo=sin_codigo`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?motivo=intercambio_fallido`);
  }

  /**
   * Detras de Traefik, `origin` refleja el host interno del contenedor, no el
   * dominio publico. La cabecera x-forwarded-host es la que lleva el dominio
   * real; sin esto, el usuario acabaria redirigido a una URL interna.
   */
  const forwardedHost = request.headers.get('x-forwarded-host');
  const base =
    process.env.NODE_ENV === 'development' || forwardedHost === null
      ? origin
      : `https://${forwardedHost}`;

  return NextResponse.redirect(`${base}${destino}`);
}
