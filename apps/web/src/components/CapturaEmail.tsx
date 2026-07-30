'use client';

import { useState } from 'react';

/**
 * Captacion de correo dentro del articulo.
 *
 * El iman es el mismo del brief: los cuatro protocolos gratuitos. Se entrega
 * algo concreto y util, no una "newsletter", que ya no convierte.
 *
 * Va a mitad-final del articulo y no en una ventana emergente: los intersticios
 * que tapan el contenido en movil son motivo de penalizacion directa por parte
 * de Google, y aqui el posicionamiento es el negocio.
 */
export function CapturaEmail({ origen }: { origen: string }) {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'ok' | 'error'>('inicial');

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado('enviando');

    try {
      const r = await fetch('/api/suscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, origen }),
      });
      setEstado(r.ok ? 'ok' : 'error');
    } catch {
      setEstado('error');
    }
  }

  if (estado === 'ok') {
    return (
      <div className="my-10 border border-mg-negro-borde bg-mg-negro-elevado p-6">
        <p className="font-semibold text-mg-blanco">Revisa tu correo.</p>
        <p className="mt-2 text-sm text-mg-gris-texto">
          Te hemos enviado un mensaje para confirmar la direccion. Sin ese paso no te
          escribimos.
        </p>
      </div>
    );
  }

  return (
    <aside className="my-10 border border-mg-negro-borde bg-mg-negro-elevado p-6">
      <h2 className="text-xl">Los 4 protocolos, gratis</h2>
      <p className="mt-2 text-sm text-mg-gris-texto">
        Potencia Sexual, Reset, Largas Rachas e Identidad Alfa. El metodo completo por escrito.
      </p>

      <form onSubmit={(e) => void enviar(e)} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`email-${origen}`} className="sr-only">
          Tu correo electronico
        </label>
        <input
          id={`email-${origen}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          className="min-h-11 flex-1 border border-mg-negro-borde bg-mg-negro px-4 text-mg-blanco placeholder:text-mg-gris-tenue"
        />
        <button
          type="submit"
          disabled={estado === 'enviando'}
          className="min-h-11 bg-mg-rojo px-6 font-semibold text-mg-blanco hover:bg-mg-rojo-oscuro disabled:opacity-60"
        >
          {estado === 'enviando' ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      {estado === 'error' && (
        <p className="mt-3 text-sm text-mg-rojo-claro">
          No hemos podido registrarte. Intentalo de nuevo.
        </p>
      )}

      {/* Consentimiento informado para marketing: la finalidad y el derecho de
          baja se declaran en el punto de recogida, no solo en la politica. */}
      <p className="mt-3 text-xs text-mg-gris-tenue">
        Te enviaremos los protocolos y contenidos de Modo Guerrero. Puedes darte de baja en
        cualquier momento desde el enlace de cada correo.
      </p>
    </aside>
  );
}
