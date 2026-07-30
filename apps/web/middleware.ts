import type { NextRequest } from 'next/server';
import { updateSession } from './src/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /**
     * Todo salvo estaticos, imagenes y el health check.
     *
     * Excluir /api/health es deliberado: la sonda de Docker se ejecuta cada
     * pocos segundos y no debe provocar una llamada a Supabase cada vez. Si
     * Supabase tuviera una incidencia, el contenedor se marcaria como no
     * saludable y Traefik lo sacaria de servicio, tirando tambien las paginas
     * estaticas que si podrian seguir sirviendose.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/health|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
};
