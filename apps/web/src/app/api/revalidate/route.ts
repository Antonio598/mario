import { timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';

/**
 * Revalidacion bajo demanda. La llama n8n tras aprobar un articulo.
 *
 * Sin esto, un articulo aprobado tardaria hasta una hora en aparecer (el ciclo
 * de ISR). Con esto, esta en vivo en segundos y puede enviarse el push de las
 * 07:30 sabiendo que el enlace ya funciona.
 */
function secretoValido(recibido: string | null): boolean {
  const esperado = process.env['REVALIDATE_SECRET'];
  if (esperado === undefined || esperado === '' || recibido === null) return false;

  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);

  // Longitudes distintas: se responde igualmente en tiempo constante para no
  // filtrar la longitud del secreto.
  if (a.length !== b.length) return false;

  // Comparacion en tiempo constante. Una comparacion normal con === se detiene
  // en el primer caracter distinto, y ese tiempo permite deducir el secreto
  // caracter a caracter.
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!secretoValido(request.headers.get('x-revalidate-secret'))) {
    return NextResponse.json({ error: 'no_autorizado' }, { status: 401 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'peticion_invalida' }, { status: 400 });
  }

  const { slug } = (cuerpo ?? {}) as { slug?: unknown };

  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: 'slug_invalido' }, { status: 400 });
  }

  // Se revalida el articulo y todo lo que lo lista: si solo se refrescara la
  // ficha, el articulo nuevo no apareceria en el indice ni en el sitemap y
  // Google tardaria dias en descubrirlo.
  revalidatePath(`/articulos/${slug}`);
  revalidatePath('/articulos');
  revalidatePath('/sitemap.xml');

  return NextResponse.json({ revalidado: true, slug, momento: new Date().toISOString() });
}
