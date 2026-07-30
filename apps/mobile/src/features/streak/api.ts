import { supabase } from '../../lib/supabase';
import type { CheckinEstado } from '@reset-alfa/shared';

/**
 * Estado que devuelve `public.estado_diario()`.
 *
 * La fecha y la longitud de la racha las calcula el servidor a partir de la
 * zona horaria del perfil. La app nunca las deduce del reloj del dispositivo.
 */
export interface EstadoDiario {
  fecha_local: string;
  necesita_checkin: boolean;
  ultimo_checkin: string | null;
  racha_actual: number;
  racha_inicio: string | null;
  record_personal: number;
  dias_totales: number;
  timezone: string;
  /** Si es false, el formulario de recaida debe saltarse por completo. */
  consiente_sensibles: boolean;
}

export interface DiaCalendario {
  fecha: string;
  estado: CheckinEstado;
  relapse_id: string | null;
}

export interface RespuestasRecaida {
  lugar?: string | null;
  hora?: string | null;
  trigger?: string | null;
  accion_correctiva?: string | null;
  ejecuto_pad?: boolean | null;
  motivo_fallo?: string | null;
  ajuste_pad?: string | null;
  contexto_ambiental?: string | null;
  contexto_emocional?: string | null;
}

export async function obtenerEstadoDiario(): Promise<EstadoDiario> {
  const { data, error } = await supabase.rpc('estado_diario');
  if (error) throw new Error(error.message);
  return data as unknown as EstadoDiario;
}

export async function registrarCheckin(): Promise<EstadoDiario> {
  const { data, error } = await supabase.rpc('registrar_checkin');
  if (error) throw new Error(error.message);
  return data as unknown as EstadoDiario;
}

/**
 * Registra la recaida y, si hay consentimiento, su detalle. Todo en una sola
 * transaccion en el servidor.
 *
 * Sin consentimiento del art. 9 el check-in se guarda igual y el detalle se
 * descarta: negarse a ceder esos datos no puede impedir usar la app.
 */
export async function guardarRecaida(
  respuestas: RespuestasRecaida,
): Promise<EstadoDiario & { racha_anterior: number; detalle_guardado: boolean }> {
  const { data, error } = await supabase.rpc('guardar_recaida', {
    p_lugar: respuestas.lugar ?? null,
    p_hora: respuestas.hora ?? null,
    p_trigger: respuestas.trigger ?? null,
    p_accion_correctiva: respuestas.accion_correctiva ?? null,
    p_ejecuto_pad: respuestas.ejecuto_pad ?? null,
    p_motivo_fallo: respuestas.motivo_fallo ?? null,
    p_ajuste_pad: respuestas.ajuste_pad ?? null,
    p_contexto_ambiental: respuestas.contexto_ambiental ?? null,
    p_contexto_emocional: respuestas.contexto_emocional ?? null,
  });
  if (error) throw new Error(error.message);
  return data as unknown as EstadoDiario & {
    racha_anterior: number;
    detalle_guardado: boolean;
  };
}

export async function obtenerCalendario(anio: number, mes: number): Promise<DiaCalendario[]> {
  const { data, error } = await supabase.rpc('calendario_mes', { p_anio: anio, p_mes: mes });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as DiaCalendario[];
}
