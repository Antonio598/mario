/**
 * Envio de correo por Resend.
 *
 * La clave vive solo aqui, en el servidor. Nunca es NEXT_PUBLIC_: una clave de
 * Resend en el navegador deja enviar correo desde el dominio de la marca a
 * cualquiera que abra las herramientas de desarrollo.
 *
 * Se llama a la API con fetch en vez de instalar el SDK. Es una peticion POST
 * con tres campos: una dependencia mas, con su propia cadena de actualizaciones
 * y su propio riesgo de suministro, no compensa aqui.
 */

export interface Correo {
  para: string[];
  asunto: string;
  html: string;
  texto: string;
  /** Responder al usuario debe ser posible desde el propio cliente de correo. */
  responderA?: string;
}

export type ResultadoEnvio =
  | { ok: true; id: string }
  | { ok: false; motivo: 'sin_configurar' | 'error_api'; detalle?: string };

const REMITENTE_POR_DEFECTO = 'Reset Alfa <recaidas@modoguerrero.es>';

export async function enviarCorreo(correo: Correo): Promise<ResultadoEnvio> {
  const clave = process.env['RESEND_API_KEY'];

  // Sin clave no se envia y no se rompe nada. El registro de la recaida ya esta
  // guardado en la base: el correo es un aviso, no la fuente de verdad.
  if (clave === undefined || clave.trim() === '') {
    return { ok: false, motivo: 'sin_configurar' };
  }

  const remitente = process.env['RESEND_FROM']?.trim();

  let respuesta: Response;
  try {
    respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clave.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: remitente === undefined || remitente === '' ? REMITENTE_POR_DEFECTO : remitente,
        to: correo.para,
        subject: correo.asunto,
        html: correo.html,
        text: correo.texto,
        ...(correo.responderA === undefined ? {} : { reply_to: correo.responderA }),
      }),
      // Si Resend tarda, la peticion del usuario no puede quedarse colgada.
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    return { ok: false, motivo: 'error_api', detalle: e instanceof Error ? e.message : 'red' };
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => '');
    return { ok: false, motivo: 'error_api', detalle: `${respuesta.status} ${cuerpo.slice(0, 300)}` };
  }

  const datos = (await respuesta.json().catch(() => ({}))) as { id?: string };
  return { ok: true, id: datos.id ?? 'sin-id' };
}
