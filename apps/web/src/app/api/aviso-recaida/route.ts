import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enviarCorreo } from '@/lib/correo/resend';
import { PREGUNTAS } from '@/lib/app/preguntas-recaida';
import type { RespuestasRecaida } from '@/lib/app/tipos';

export const runtime = 'nodejs';

/**
 * Aviso por correo de una recaída registrada.
 *
 * POR QUÉ EN EL SERVIDOR. La clave de Resend no puede salir del servidor, y el
 * destinatario tampoco puede decidirlo el navegador: si llegara en el cuerpo de
 * la petición, cualquiera con una sesión podría usar el dominio de la marca
 * para mandar correo a quien quisiera.
 *
 * ES UN AVISO, NO EL REGISTRO. Lo que vale está ya guardado en `relapses`
 * cuando esto se ejecuta. Por eso ningún fallo de aquí se propaga al usuario:
 * se responde 200 con `enviado: false` y se anota en el log del servidor. Un
 * problema en Resend no puede convertirse en un error rojo delante de alguien
 * que acaba de recaer.
 *
 * ARTÍCULO 9. Estas respuestas son datos de categoría especial. El
 * consentimiento se comprueba CONTRA LA BASE antes de enviar nada, no contra lo
 * que diga el cliente: quien no ha consentido no puede acabar con su vida
 * sexual en una bandeja de entrada por un fallo de la interfaz.
 */

const DESTINO_POR_DEFECTO = 'israymarioresetalfa@gmail.com';

const VENTANA_MS = 600_000;
const MAX_POR_VENTANA = 5;
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

/** Escapa el texto del usuario: va dentro de un HTML que se abre en Gmail. */
function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Recorta y normaliza. Nada de longitud libre en un correo. */
function limpiar(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t.slice(0, 2000);
}

function formatear(campo: keyof RespuestasRecaida, datos: Record<string, unknown>): string | null {
  const bruto = datos[campo];
  if (campo === 'ejecuto_pad') {
    if (typeof bruto !== 'boolean') return null;
    return bruto ? 'Sí' : 'No';
  }
  return limpiar(bruto);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return NextResponse.json({ error: 'sin_sesion' }, { status: 401 });
  }

  if (limitado(user.id)) {
    return NextResponse.json({ enviado: false, motivo: 'demasiados_envios' }, { status: 429 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'peticion_invalida' }, { status: 400 });
  }

  const datos = (cuerpo ?? {}) as Record<string, unknown>;

  // Consentimiento del art. 9, comprobado contra la base. La RLS de `consents`
  // limita el SELECT a las filas del propio usuario, así que esto no puede leer
  // el consentimiento de nadie más.
  const { data: consentimiento } = await supabase
    .from('consents')
    .select('concedido')
    .eq('tipo', 'datos_sensibles')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (consentimiento === null || !consentimiento.concedido) {
    return NextResponse.json({ enviado: false, motivo: 'sin_consentimiento' });
  }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nombre, timezone')
    .eq('user_id', user.id)
    .maybeSingle();

  const nombre = perfil?.nombre ?? 'Sin nombre';
  const zona = perfil?.timezone ?? 'Europe/Madrid';
  const correoUsuario = user.email ?? null;

  const fecha = new Date().toLocaleDateString('es-ES', {
    timeZone: zona,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const rachaRota = typeof datos['racha_anterior'] === 'number' ? datos['racha_anterior'] : null;

  const respuestas = PREGUNTAS.map((p) => ({
    titulo: p.titulo,
    valor: formatear(p.campo, datos),
  }));

  const contestadas = respuestas.filter((r) => r.valor !== null).length;

  const filas = respuestas
    .map((r) => {
      const color = r.valor === null ? '#bbbbbb' : '#111111';
      const contenido = r.valor === null ? 'Sin responder' : esc(r.valor).replace(/\n/g, '<br>');
      return [
        '<tr><td style="padding:12px 0;border-bottom:1px solid #eeeeee;vertical-align:top">',
        '<div style="font:600 12px/1.4 system-ui,sans-serif;color:#777777;',
        'text-transform:uppercase;letter-spacing:.05em">',
        esc(r.titulo),
        '</div>',
        '<div style="margin-top:4px;font:400 15px/1.5 system-ui,sans-serif;color:' + color + '">',
        contenido,
        '</div></td></tr>',
      ].join('');
    })
    .join('');

  const subtitulo = [
    esc(fecha),
    rachaRota === null ? null : 'racha rota de ' + rachaRota + (rachaRota === 1 ? ' día' : ' días'),
    contestadas + ' de ' + PREGUNTAS.length + ' respondidas',
  ]
    .filter((x) => x !== null)
    .join(' &middot; ');

  const html = [
    '<div style="max-width:600px;margin:0 auto;padding:24px;background:#ffffff">',
    '<div style="border-left:4px solid #D32F2F;padding-left:14px">',
    '<div style="font:700 12px/1.4 system-ui,sans-serif;color:#D32F2F;',
    'text-transform:uppercase;letter-spacing:.12em">Reset Alfa &middot; Protocolo post-recaída</div>',
    '<h1 style="margin:6px 0 0;font:700 22px/1.3 system-ui,sans-serif;color:#111111">',
    esc(nombre),
    '</h1>',
    '<div style="margin-top:4px;font:400 14px/1.5 system-ui,sans-serif;color:#666666">',
    subtitulo,
    '</div>',
    '<div style="margin-top:2px;font:400 13px/1.5 system-ui,sans-serif;color:#888888">',
    esc(correoUsuario ?? 'sin correo'),
    '</div></div>',
    '<table style="width:100%;margin-top:20px;border-collapse:collapse">',
    filas,
    '</table>',
    '<p style="margin-top:24px;font:400 12px/1.6 system-ui,sans-serif;color:#999999">',
    'Datos de categoría especial (art. 9 RGPD) enviados con el consentimiento explícito del ',
    'usuario. No los reenvíes ni los copies fuera de este buzón.',
    '</p></div>',
  ].join('');

  const plano = [
    'RESET ALFA - Protocolo post-recaída',
    nombre + ' <' + (correoUsuario ?? 'sin correo') + '>',
    fecha + (rachaRota === null ? '' : ' - racha rota de ' + rachaRota + ' días'),
    '',
    ...respuestas.map((r) => r.titulo + '\n' + (r.valor ?? 'Sin responder') + '\n'),
  ].join('\n');

  const destino = process.env['RESEND_TO']?.trim();

  const resultado = await enviarCorreo({
    para: [destino === undefined || destino === '' ? DESTINO_POR_DEFECTO : destino],
    asunto: 'Recaída registrada - ' + nombre + ' - ' + fecha,
    html,
    texto: plano,
    // Responder al aviso escribe directamente al usuario. Es el gesto que
    // convierte un registro en un seguimiento.
    ...(correoUsuario === null ? {} : { responderA: correoUsuario }),
  });

  if (!resultado.ok) {
    console.error('[aviso-recaida] no enviado:', resultado.motivo, resultado.detalle ?? '');
    return NextResponse.json({ enviado: false, motivo: resultado.motivo });
  }

  return NextResponse.json({ enviado: true });
}
