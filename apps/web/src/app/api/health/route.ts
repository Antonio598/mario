import { NextResponse } from 'next/server';

/**
 * Sonda de estado.
 *
 * La consultan el HEALTHCHECK del contenedor, Traefik y Uptime Kuma.
 *
 * Comprueba UNICAMENTE que el proceso Next responde. No toca Supabase a
 * proposito: si lo hiciera, una incidencia de Supabase marcaria el contenedor
 * como no saludable y EasyPanel lo reiniciaria en bucle, dejando tambien fuera
 * de servicio los articulos estaticos, que son justo lo que si podria seguir
 * sirviendose y generando ingresos publicitarios.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'reset-alfa-web',
      environment: process.env['NEXT_PUBLIC_ENVIRONMENT'] ?? 'development',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
