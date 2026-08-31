'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { publicEnv } from '@/lib/env';
import { registrarConsentimiento } from '@/lib/app/consentimiento';

interface Props {
  consienteSensibles: boolean;
  timezone: string;
}

/**
 * Ajustes y derechos del interesado.
 *
 * Los tres botones de RGPD no son adorno: el art. 15 (acceso), el art. 20
 * (portabilidad) y el art. 17 (supresión) exigen que el usuario pueda
 * ejercerlos por sí mismo, y el art. 7.3 que retirar el consentimiento sea tan
 * fácil como darlo. Por eso el interruptor está aquí arriba y no escondido.
 */
export function AccionesCuenta({ consienteSensibles, timezone }: Props) {
  const router = useRouter();
  const [consiente, setConsiente] = useState(consienteSensibles);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function cambiarConsentimiento(nuevo: boolean) {
    setOcupado(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user !== null) {
      // Se INSERTA una fila nueva; nunca se modifica la anterior. El historial
      // completo es la prueba que exige el art. 7.1.
      const res = await registrarConsentimiento(supabase, {
        userId: user.id,
        tipo: 'datos_sensibles',
        concedido: nuevo,
      });

      if (!res.ok) {
        setOcupado(false);
        // El interruptor NO se mueve si no se pudo guardar: enseñar el
        // consentimiento como concedido cuando no consta en la base es
        // exactamente lo que el art. 7.1 obliga a poder demostrar.
        setAviso(
          res.detalle === undefined
            ? 'No hemos podido guardar tu decisión. Inténtalo de nuevo.'
            : `No hemos podido guardar tu decisión (${res.detalle}).`,
        );
        return;
      }
      setConsiente(nuevo);
      setAviso(null);
    }
    setOcupado(false);
    router.refresh();
  }

  async function exportar() {
    setOcupado(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('export_my_data');
    setOcupado(false);

    if (error) {
      setAviso('No hemos podido generar la exportación.');
      return;
    }

    // Descarga en el navegador, sin pasar por el servidor: los datos ya están
    // aquí y enviarlos de vuelta solo añadiría un sitio más por donde
    // pudieran filtrarse.
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reset-alfa-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function borrarCuenta() {
    const seguro = window.confirm(
      'Esto borra tu racha, tu historial y tus registros de recaída de forma permanente. ' +
        'No se puede deshacer. ¿Continuar?',
    );
    if (!seguro) return;

    setOcupado(true);
    const supabase = createClient();

    // El nombre de la función depende de la instalación. En un proyecto
    // Supabase dedicado, `delete_my_account` elimina la identidad y todo cae en
    // cascada. En uno compartido con otra app, `borrar_mis_datos` NO puede
    // tocar `auth.users` —expulsaría al usuario también de la otra app— y borra
    // solo los datos de Reset Alfa.
    const { error } =
      publicEnv.supabaseSchema === 'reset_alfa'
        ? await supabase.rpc('borrar_mis_datos')
        : await supabase.rpc('delete_my_account');

    if (error) {
      setOcupado(false);
      setAviso('No hemos podido completar el borrado. Escríbenos y lo hacemos nosotros.');
      return;
    }

    await supabase.auth.signOut();
    router.push('/');
  }

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="ra-card px-5 py-4">
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <span>
            <span className="text-sm font-medium text-ra-negro">Guardar el detalle de mis recaídas</span>
            <span className="mt-1 block text-xs text-ra-texto-tenue">
              Incluye información sobre tu vida sexual. Sin esto se registra el día, pero no las
              respuestas del protocolo.
            </span>
          </span>
          <input
            type="checkbox"
            checked={consiente}
            disabled={ocupado}
            onChange={(e) => void cambiarConsentimiento(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-[#D32F2F]"
          />
        </label>
      </div>

      <div className="ra-card px-5 py-4 text-sm text-ra-texto-sec">
        Zona horaria: <span className="font-medium text-ra-negro">{timezone}</span>
        <p className="mt-1 text-xs text-ra-texto-tenue">
          Determina cuándo empieza tu día para el check-in.
        </p>
      </div>

      {aviso !== null && <p className="text-sm text-ra-rojo">{aviso}</p>}

      <button
        type="button"
        onClick={() => void exportar()}
        disabled={ocupado}
        className="min-h-[48px] w-full rounded-xl border border-ra-borde px-5 text-sm font-medium text-ra-texto-sec transition-colors hover:border-ra-rojo hover:text-ra-rojo disabled:opacity-60"
      >
        Exportar mis datos
      </button>

      <button
        type="button"
        onClick={() => void salir()}
        className="min-h-[48px] w-full rounded-xl border border-ra-borde px-5 text-sm font-medium text-ra-texto-sec transition-colors hover:border-ra-rojo hover:text-ra-rojo"
      >
        Cerrar sesión
      </button>

      <button
        type="button"
        onClick={() => void borrarCuenta()}
        disabled={ocupado}
        className="min-h-[48px] w-full rounded-xl border border-red-200 px-5 text-sm font-medium text-ra-rojo disabled:opacity-60"
      >
        Eliminar mis datos
      </button>
    </div>
  );
}
