import { NextResponse, type NextRequest } from 'next/server';
import { clienteDePeticion } from '@/lib/supabase/peticion';
import { sincronizarDesdeRevenueCat } from '@/lib/tiendas/revenuecat';

export const runtime = 'nodejs';

/**
 * La app acaba de comprar (o de restaurar) y quiere ver "Premium activo" al
 * instante, sin esperar al webhook. Sincroniza SOLO al usuario de la sesion:
 * el id no viene en el cuerpo, viene del token, asi que nadie puede pedir la
 * sincronizacion de otro.
 */
export async function POST(request: NextRequest) {
  const supabase = await clienteDePeticion(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return NextResponse.json({ error: 'sesion_requerida' }, { status: 401 });
  }

  try {
    const r = await sincronizarDesdeRevenueCat(user.id);
    if (!r.ok) return NextResponse.json({ error: r.motivo }, { status: 409 });
    return NextResponse.json({ activo: r.activo, origen: r.origen });
  } catch (e) {
    console.error('[revenuecat] fallo al sincronizar desde la app', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'fallo_sincronizacion' }, { status: 500 });
  }
}
