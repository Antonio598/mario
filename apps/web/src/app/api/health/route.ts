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

/**
 * Que integraciones estan configuradas en ESTE despliegue.
 *
 * Solo booleanos: nunca el valor, ni un fragmento, ni la longitud. Saber que
 * existe una clave no permite usarla, y en cambio ahorra la unica forma que
 * habia de depurar esto, que era ir preguntando al propietario variable por
 * variable mientras un pago real se quedaba sin conceder.
 *
 * Una variable definida pero vacia cuenta como ausente, que es justo el error
 * que no se ve en el panel de EasyPanel.
 */
function puesta(nombre: string): boolean {
  const v = process.env[nombre];
  return typeof v === 'string' && v.trim() !== '';
}

export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'reset-alfa-web',
      environment: process.env['NEXT_PUBLIC_ENVIRONMENT'] ?? 'development',
      timestamp: new Date().toISOString(),
      configuracion: {
        supabaseServiceRole: puesta('SUPABASE_SERVICE_ROLE_KEY'),
        supabaseEsquema: process.env['NEXT_PUBLIC_SUPABASE_SCHEMA'] ?? 'public',
        revenuecatSecreto: puesta('REVENUECAT_SECRET_KEY'),
        revenuecatWebhook: puesta('REVENUECAT_WEBHOOK_SECRET'),
        revenuecatEntitlement: process.env['REVENUECAT_ENTITLEMENT_ID'] ?? 'premium',
        stripeSecreto: puesta('STRIPE_SECRET_KEY'),
        stripeWebhook: puesta('STRIPE_WEBHOOK_SECRET'),
        stripePrecioPremium: puesta('STRIPE_PREMIUM_PRICE_ID'),
        resendClave: puesta('RESEND_API_KEY'),
        resendDestinatario: puesta('RESEND_TO'),
        titularNombre: puesta('TITULAR_NOMBRE'),
        titularDomicilio: puesta('TITULAR_DOMICILIO'),
      },
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
