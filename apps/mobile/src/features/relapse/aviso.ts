import { siteUrl, supabase } from '../../lib/supabase';
import type { RespuestasRecaida } from '../streak/api';

/**
 * Aviso por correo al equipo tras una recaida.
 *
 * Lo envia el servidor web (/api/aviso-recaida), que es donde vive la clave de
 * Resend. La app se identifica con el token de sesion en la cabecera
 * Authorization: la ruta lo acepta ademas de la cookie del navegador.
 *
 * Nunca lanza: es un aviso, no el registro. Si falla, queda en el log del
 * servidor y el usuario no ve nada.
 */
export async function avisarRecaida(datos: RespuestasRecaida & { racha_anterior: number }): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session === null) return;

    await fetch(`${siteUrl}/api/aviso-recaida`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(datos),
    });
  } catch {
    // Sin importancia para el usuario.
  }
}
