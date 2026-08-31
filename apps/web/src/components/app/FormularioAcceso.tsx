'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { registrarConsentimiento } from '@/lib/app/consentimiento';
import { publicEnv } from '@/lib/env';

type Modo = 'entrar' | 'registro';

/**
 * Acceso por correo y por Google.
 *
 * En el registro se recoge el consentimiento del art. 9 RGPD por separado y
 * DESMARCADO. Una casilla premarcada no es consentimiento válido (art. 4.11 y
 * sentencia Planet49 del TJUE), y el consentimiento no puede condicionarse a
 * la prestación del servicio (art. 7.4): se puede crear la cuenta sin aceptarlo
 * y usar la app con normalidad, solo que sin guardar el detalle de las
 * recaídas.
 */
export function FormularioAcceso({ destino }: { destino: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [aceptaSensibles, setAceptaSensibles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    setEnviando(true);

    const supabase = createClient();

    if (modo === 'entrar') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setEnviando(false);

      // Mensaje genérico a propósito: distinguir "no existe" de "contraseña
      // incorrecta" permite enumerar las cuentas registradas.
      if (err) {
        setError('No hemos podido iniciar sesión. Revisa tus datos.');
        return;
      }
      router.push(destino);
      router.refresh();
      return;
    }

    if (password.length < 8) {
      setEnviando(false);
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nombre } },
    });

    if (err) {
      setEnviando(false);
      setError('No hemos podido crear la cuenta. Revisa tus datos.');
      return;
    }

    // Se registran AMBAS decisiones, también la negativa: poder demostrar que
    // el usuario dijo que no es tan importante como que dijo que sí (art. 7.1).
    if (data.user !== null) {
      await registrarConsentimiento(supabase, {
        userId: data.user.id,
        tipo: 'datos_sensibles',
        concedido: aceptaSensibles,
      });
    }

    setEnviando(false);

    // Si el proyecto exige confirmación por correo, no hay sesión todavía.
    if (data.session === null) {
      setAviso('Revisa tu correo para confirmar la cuenta.');
      return;
    }
    router.push(destino);
    router.refresh();
  }

  async function entrarConGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${publicEnv.siteUrl}/auth/callback?next=${destino}` },
    });
  }

  return (
    <div className="mt-8">
      <form onSubmit={(e) => void enviar(e)} className="grid gap-3">
        {modo === 'registro' && (
          <input
            type="text"
            autoComplete="name"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="min-h-[52px] rounded-md border border-mg-negro-borde bg-mg-negro-elevado px-4 placeholder:text-mg-gris-apagado"
          />
        )}

        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-[52px] rounded-md border border-mg-negro-borde bg-mg-negro-elevado px-4 placeholder:text-mg-gris-apagado"
        />

        <input
          type="password"
          required
          autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
          placeholder={modo === 'entrar' ? 'Contraseña' : 'Contraseña (mínimo 8 caracteres)'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-[52px] rounded-md border border-mg-negro-borde bg-mg-negro-elevado px-4 placeholder:text-mg-gris-apagado"
        />

        {modo === 'registro' && (
          <label className="mt-2 flex cursor-pointer gap-3 text-sm text-mg-gris-texto">
            <input
              type="checkbox"
              checked={aceptaSensibles}
              onChange={(e) => setAceptaSensibles(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-[#D32F2F]"
            />
            <span>
              Acepto que se guarden mis registros de recaída, que incluyen información sobre mi
              vida sexual, para consultar mi historial y detectar patrones.
              <span className="mt-1 block text-xs text-mg-gris-tenue">
                Opcional. Puedes usar la app sin aceptarlo y retirarlo cuando quieras.
              </span>
            </span>
          </label>
        )}

        {error !== null && <p className="text-sm text-mg-rojo-claro">{error}</p>}
        {aviso !== null && <p className="text-sm text-mg-exito">{aviso}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 min-h-[52px] rounded-md bg-mg-rojo px-6 font-titular font-semibold tracking-wider text-mg-blanco-puro uppercase transition-colors hover:bg-mg-rojo-oscuro disabled:opacity-60"
        >
          {enviando ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4 text-xs text-mg-gris-apagado">
        <span className="h-px flex-1 bg-mg-negro-borde" />o<span className="h-px flex-1 bg-mg-negro-borde" />
      </div>

      <button
        type="button"
        onClick={() => void entrarConGoogle()}
        className="min-h-[52px] w-full rounded-md border border-mg-negro-borde font-titular tracking-wider uppercase transition-colors hover:border-mg-gris-tenue"
      >
        Continuar con Google
      </button>

      <button
        type="button"
        onClick={() => {
          setModo((m) => (m === 'entrar' ? 'registro' : 'entrar'));
          setError(null);
          setAviso(null);
        }}
        className="mt-8 w-full text-sm text-mg-gris-tenue hover:text-mg-gris-texto"
      >
        {modo === 'entrar' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Entrar'}
      </button>
    </div>
  );
}
