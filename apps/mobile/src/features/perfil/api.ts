import type { Json, RespuestasCarta, RespuestasPlan } from '@reset-alfa/shared';
import { leerCarta, PRODUCTO_PREMIUM_ID } from '@reset-alfa/shared';
import { supabase } from '../../lib/supabase';

/**
 * Perfil, herramientas y acceso Premium.
 *
 * Todas las escrituras van por RPC `security definer`: el cliente nunca hace
 * UPDATE sobre `profiles`. Es la misma regla que en la web y por el mismo
 * motivo: el GRANT de columnas de profiles es cerrado a proposito.
 */

export interface Perfil {
  nombre: string;
  timezone: string;
  pad: string | null;
  carta: RespuestasCarta | null;
  plan: RespuestasPlan | null;
  hitosVistos: string[];
  onboardingCompletado: boolean;
}

export async function obtenerPerfil(): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('nombre, timezone, pad, carta, plan, hitos_vistos, onboarding_completado')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data === null) return null;

  return {
    nombre: data.nombre,
    timezone: data.timezone,
    pad: data.pad,
    carta: leerCarta(data.carta),
    plan: (data.plan as RespuestasPlan | null) ?? null,
    hitosVistos: data.hitos_vistos ?? [],
    onboardingCompletado: data.onboarding_completado,
  };
}

export async function guardarPad(texto: string): Promise<void> {
  const { error } = await supabase.rpc('guardar_pad', { p_texto: texto });
  if (error) throw new Error(`${error.code ?? ''} ${error.message}`.trim());
}

export async function guardarCarta(respuestas: RespuestasCarta): Promise<void> {
  const { error } = await supabase.rpc('guardar_carta', { p_respuestas: respuestas as Json });
  if (error) throw new Error(`${error.code ?? ''} ${error.message}`.trim());
}

export async function guardarPlan(plan: RespuestasPlan | null): Promise<void> {
  const { error } = await supabase.rpc('guardar_plan', {
    p_plan: (plan as unknown as Json) ?? null,
  });
  if (error) throw new Error(`${error.code ?? ''} ${error.message}`.trim());
}

export async function marcarHito(hito: '7-dias' | '30-dias'): Promise<void> {
  const { error } = await supabase.rpc('marcar_hito', { p_hito: hito });
  if (error) throw new Error(`${error.code ?? ''} ${error.message}`.trim());
}

export async function ajustarRacha(dias: number): Promise<void> {
  const { error } = await supabase.rpc('ajustar_racha', { p_dias: dias });
  if (error) throw new Error(`${error.code ?? ''} ${error.message}`.trim());
}

/* -------------------------------------------------------------------------- */
/* Acceso Premium                                                              */
/* -------------------------------------------------------------------------- */

export interface Acceso {
  esPremium: boolean;
  expiraEn: string | null;
  cancelaAlFinal: boolean;
}

/**
 * Misma regla que la web y que `has_entitlement` en la base: activo y sin
 * caducar. Pasa por la RLS, asi que solo puede leer las filas propias.
 */
export async function obtenerAcceso(): Promise<Acceso> {
  const { data } = await supabase
    .from('entitlements')
    .select('activo, expires_at, cancel_at_period_end')
    .eq('product_id', PRODUCTO_PREMIUM_ID)
    .maybeSingle();

  if (data === null || data === undefined) {
    return { esPremium: false, expiraEn: null, cancelaAlFinal: false };
  }

  const vigente =
    data.activo && (data.expires_at === null || new Date(data.expires_at).getTime() > Date.now());

  return { esPremium: vigente, expiraEn: data.expires_at, cancelaAlFinal: data.cancel_at_period_end };
}

/* -------------------------------------------------------------------------- */
/* Consentimiento art. 9                                                       */
/* -------------------------------------------------------------------------- */

export async function darConsentimiento(concedido: boolean, version: string): Promise<void> {
  const { error } = await supabase.rpc('dar_consentimiento', {
    p_tipo: 'datos_sensibles',
    p_concedido: concedido,
    p_version: version,
    p_origen: 'app',
  });
  if (error) throw new Error(`${error.code ?? ''} ${error.message}`.trim());
}

/* -------------------------------------------------------------------------- */
/* Bitacora                                                                    */
/* -------------------------------------------------------------------------- */

export interface EntradaHistorial {
  fecha: string;
  relapse_id: string | null;
  racha_anterior: number;
}

export async function historialRecaidas(limite = 50): Promise<EntradaHistorial[]> {
  const { data, error } = await supabase.rpc('historial_recaidas', { p_limite: limite });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as EntradaHistorial[];
}

export interface FilaRecaida {
  lugar: string | null;
  hora: string | null;
  trigger: string | null;
  accion_correctiva: string | null;
  ejecuto_pad: boolean | null;
  motivo_fallo: string | null;
  ajuste_pad: string | null;
  contexto_ambiental: string | null;
  contexto_emocional: string | null;
}

export async function detalleRecaida(fecha: string): Promise<FilaRecaida | null> {
  const { data, error } = await supabase.rpc('detalle_recaida', { p_fecha: fecha });
  if (error) throw new Error(error.message);
  return (data as unknown as FilaRecaida | null) ?? null;
}

/** Cuantas recaidas tienen al menos una respuesta: es el logro "Sin excusas". */
export async function plantillasRellenadas(): Promise<number> {
  const { data } = await supabase
    .from('relapses')
    .select(
      'lugar, trigger, accion_correctiva, ejecuto_pad, motivo_fallo, ajuste_pad, contexto_ambiental, contexto_emocional',
    )
    .limit(100);
  return (data ?? []).filter((r) => Object.values(r).some((v) => v !== null && v !== '')).length;
}
