'use client';

import { useState } from 'react';
import { SLUG_PREMIUM } from '@/lib/app/enlaces';

async function irA(ruta: string, cuerpo?: unknown): Promise<string> {
  const res = await fetch(ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo ?? {}),
  });
  const datos = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || datos.url === undefined) {
    throw new Error(datos.error ?? `HTTP ${res.status}`);
  }
  return datos.url;
}

const MENSAJES: Record<string, string> = {
  ya_adquirido: 'Ya tienes Premium activo.',
  producto_sin_precio: 'El pago aún no está configurado. Escríbenos.',
  no_configurado: 'El pago aún no está configurado. Escríbenos.',
  sesion_requerida: 'Tu sesión ha caducado. Vuelve a entrar.',
  sin_suscripcion: 'No encontramos una suscripción en tu cuenta.',
};

/**
 * Lleva a Stripe Checkout. El precio nunca sale del navegador: la ruta lo lee
 * de la configuración del servidor, y aquí solo se envía el slug.
 */
export function BotonSuscribirse({ texto = 'Hazte Premium' }: { texto?: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function suscribirse() {
    setCargando(true);
    setError(null);
    try {
      const url = await irA('/api/stripe/checkout', { slug: SLUG_PREMIUM });
      window.location.assign(url);
    } catch (e) {
      const clave = e instanceof Error ? e.message : '';
      setError(MENSAJES[clave] ?? `No hemos podido abrir el pago (${clave}).`);
      setCargando(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void suscribirse()} disabled={cargando} className="ra-boton">
        {cargando ? 'Abriendo el pago…' : texto}
      </button>
      {error !== null && <p className="mt-3 text-sm break-words text-ra-rojo">{error}</p>}
    </div>
  );
}

/** Abre el portal de Stripe: cancelar, cambiar tarjeta, facturas. */
export function BotonPortal() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function abrir() {
    setCargando(true);
    setError(null);
    try {
      const url = await irA('/api/stripe/portal');
      window.location.assign(url);
    } catch (e) {
      const clave = e instanceof Error ? e.message : '';
      setError(MENSAJES[clave] ?? `No hemos podido abrir el portal (${clave}).`);
      setCargando(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void abrir()} disabled={cargando} className="ra-boton-sec">
        {cargando ? 'Abriendo…' : 'Gestionar suscripción'}
      </button>
      {error !== null && <p className="mt-3 text-sm break-words text-ra-rojo">{error}</p>}
    </div>
  );
}
