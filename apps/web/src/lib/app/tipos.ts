import type { CheckinEstado } from '@reset-alfa/shared';

/**
 * Estado que devuelve `estado_diario()`.
 *
 * La fecha y la longitud de la racha las calcula el servidor a partir de la
 * zona horaria guardada en el perfil. El navegador nunca las deduce de su
 * propio reloj: adelantarlo bastaría para inflar la racha.
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
  /** Si es false, el formulario de recaída debe saltarse por completo. */
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
