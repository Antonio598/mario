import { NextResponse, type NextRequest } from 'next/server';
import { esUsuarioNuestro, sincronizarDesdeRevenueCat } from '@/lib/tiendas/revenuecat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook de RevenueCat: compras, renovaciones, cancelaciones y caducidades
 * de la suscripcion comprada en la App Store o en Google Play.
 *
 * AUTENTICACION. RevenueCat no firma el cuerpo como Stripe; en su lugar manda
 * la cabecera Authorization con el valor que se configure en el panel. Se
 * compara con REVENUECAT_WEBHOOK_SECRET. Sin coincidencia exacta, 401.
 *
 * NO SE INTERPRETA EL EVENTO. Sea INITIAL_PURCHASE, RENEWAL, CANCELLATION,
 * EXPIRATION o TRANSFER, se pide a RevenueCat el estado actual de cada usuario
 * implicado y se copia. Una entrega duplicada o fuera de orden produce la
 * misma fila.
 *
 * Responde 500 solo ante fallos transitorios (API de RevenueCat o base de
 * datos), para que reintente. Un evento sin usuario nuestro se acepta con 200:
 * reintentarlo no lo arreglaria.
 */
interface EventoRC {
  event?: {
    type?: string;
    app_user_id?: unknown;
    original_app_user_id?: unknown;
    aliases?: unknown;
    transferred_from?: unknown;
    transferred_to?: unknown;
  };
}

export async function POST(request: NextRequest) {
  const secreto = process.env['REVENUECAT_WEBHOOK_SECRET']?.trim();
  if (secreto === undefined || secreto === '') {
    console.error('[revenuecat] falta REVENUECAT_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'no_configurado' }, { status: 500 });
  }

  const auth = request.headers.get('authorization') ?? '';
  const presentado = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (presentado !== secreto) {
    return NextResponse.json({ error: 'no_autorizado' }, { status: 401 });
  }

  let cuerpo: EventoRC;
  try {
    cuerpo = (await request.json()) as EventoRC;
  } catch {
    return NextResponse.json({ error: 'peticion_invalida' }, { status: 400 });
  }

  const ev = cuerpo.event ?? {};
  const candidatos: unknown[] = [ev.app_user_id, ev.original_app_user_id];
  for (const lista of [ev.aliases, ev.transferred_from, ev.transferred_to]) {
    if (Array.isArray(lista)) candidatos.push(...lista);
  }
  const usuarios = [...new Set(candidatos.filter(esUsuarioNuestro))];

  if (usuarios.length === 0) {
    return NextResponse.json({ recibido: true, aviso: 'sin_usuario' });
  }

  try {
    const resultados = await Promise.all(usuarios.map((u) => sincronizarDesdeRevenueCat(u)));
    return NextResponse.json({ recibido: true, tipo: ev.type ?? null, resultados });
  } catch (e) {
    console.error('[revenuecat] fallo al sincronizar', ev.type, e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'fallo_sincronizacion' }, { status: 500 });
  }
}
