import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicEnv } from '@/lib/env';

export const runtime = 'nodejs';

/**
 * Alta en la lista de correo.
 *
 * Usa el cliente administrativo porque `email_subscribers` no tiene ninguna
 * politica RLS: es inalcanzable desde el navegador a proposito. Si `anon`
 * pudiera escribir, se llenaria de altas falsas; si pudiera leer, la lista
 * entera seria descargable.
 *
 * Limitacion de frecuencia en memoria del proceso. Es suficiente para el
 * volumen actual y para frenar un formulario enviado en bucle. Con varias
 * replicas dejaria de ser efectiva: entonces habria que moverla a Redis, igual
 * que la cache de ISR. Anotado en el README.
 */
const VENTANA_MS = 60_000;
const MAX_POR_VENTANA = 3;
const intentos = new Map<string, { n: number; hasta: number }>();

function limitado(clave: string): boolean {
  const ahora = Date.now();
  const actual = intentos.get(clave);

  if (actual === undefined || actual.hasta < ahora) {
    intentos.set(clave, { n: 1, hasta: ahora + VENTANA_MS });
    return false;
  }

  actual.n += 1;
  return actual.n > MAX_POR_VENTANA;
}

function hashearIp(ip: string): string | null {
  const sal = process.env['CONSENT_IP_SALT'];
  // Sin sal no se guarda nada. Una IP hasheada sin sal es reversible con una
  // tabla precalculada: hay poco mas de cuatro mil millones de IPv4.
  if (sal === undefined || sal === '') return null;
  return createHash('sha256').update(`${sal}:${ip}`).digest('hex');
}

export async function POST(request: NextRequest) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'peticion_invalida' }, { status: 400 });
  }

  const { email, origen } = (cuerpo ?? {}) as { email?: unknown; origen?: unknown };

  if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'email_invalido' }, { status: 400 });
  }

  // Detras de Traefik, request.ip no existe: la direccion real llega en la
  // cabecera x-forwarded-for, cuyo primer valor es el cliente original.
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'desconocida';

  if (limitado(ip)) {
    return NextResponse.json({ error: 'demasiados_intentos' }, { status: 429 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from('email_subscribers').upsert(
    {
      email: email.toLowerCase().trim(),
      origen: typeof origen === 'string' ? origen.slice(0, 120) : null,
      version_politica: publicEnv.privacyPolicyVersion,
      ip_hash: hashearIp(ip),
    },
    { onConflict: 'email', ignoreDuplicates: true },
  );

  if (error) {
    // No se devuelve el detalle: revelaria estructura interna. Queda en el log
    // del servidor, que es donde sirve.
    console.error('[suscribir] fallo al insertar', error.message);
    return NextResponse.json({ error: 'no_disponible' }, { status: 500 });
  }

  /**
   * Se responde SIEMPRE lo mismo, tanto si la direccion es nueva como si ya
   * estaba. Distinguirlo permitiria comprobar si un correo concreto esta
   * suscrito, que es una fuga de datos personales.
   *
   * PENDIENTE: enviar el correo de confirmacion. Requiere decidir el proveedor
   * de envio (Resend, Brevo...). Hasta entonces las altas quedan en estado
   * 'pendiente' y NO deben recibir ningun envio.
   */
  return NextResponse.json({ ok: true });
}
