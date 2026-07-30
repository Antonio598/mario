/**
 * Fechas locales sin dependencias externas.
 *
 * AVISO IMPORTANTE SOBRE LA AUTORIDAD DE LA FECHA:
 * Estas funciones son para PINTAR (rejilla del calendario, etiquetas). La fecha
 * que decide si procede un check-in y cuanto mide la racha la calcula SIEMPRE
 * el servidor, en `app.today_for_user`. Si la app confiara en el reloj del
 * dispositivo, adelantarlo bastaria para inflar una racha.
 *
 * Todas las fechas se manejan como cadenas 'YYYY-MM-DD', no como objetos Date.
 * Un Date es un instante, no un dia: al restar dos instantes aparecen los
 * errores de cambio de hora estacional y de zona horaria. Una cadena de dia
 * natural no tiene ese problema.
 */

/** Dia natural, en formato ISO, en una zona horaria concreta. */
export function fechaLocal(timezone: string, ahora: Date = new Date()): string {
  // 'en-CA' produce exactamente YYYY-MM-DD, que es lo que Postgres espera.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

/**
 * Convierte 'YYYY-MM-DD' a un instante en UTC a mediodia.
 *
 * El mediodia y no la medianoche a proposito: deja doce horas de margen a cada
 * lado, de modo que ningun desplazamiento de zona horaria ni cambio de hora
 * estacional pueda mover el dia al formatear.
 */
function aInstante(fechaISO: string): number {
  const partes = fechaISO.split('-');
  const anio = Number(partes[0]);
  const mes = Number(partes[1]);
  const dia = Number(partes[2]);

  if (!Number.isInteger(anio) || !Number.isInteger(mes) || !Number.isInteger(dia)) {
    throw new Error(`Fecha no valida: ${fechaISO}. Se esperaba YYYY-MM-DD.`);
  }

  return Date.UTC(anio, mes - 1, dia, 12);
}

const MS_POR_DIA = 86_400_000;

/** Dias naturales entre dos fechas. Negativo si `hasta` es anterior a `desde`. */
export function diasEntre(desdeISO: string, hastaISO: string): number {
  return Math.round((aInstante(hastaISO) - aInstante(desdeISO)) / MS_POR_DIA);
}

/** Suma (o resta, con valores negativos) dias a una fecha ISO. */
export function sumarDias(fechaISO: string, dias: number): string {
  const d = new Date(aInstante(fechaISO) + dias * MS_POR_DIA);
  return d.toISOString().slice(0, 10);
}

/**
 * Longitud de una racha en dias naturales.
 *
 * Espejo exacto de `app.longitud_racha` en Postgres. El primer dia es el dia 1.
 * Una racha que aun no ha empezado —la que se abre tras una recaida, con
 * inicio manana— devuelve 0.
 *
 * Si cambias esto, cambia tambien la migracion 0011.
 */
export function longitudRacha(inicioISO: string, hastaISO: string): number {
  return Math.max(diasEntre(inicioISO, hastaISO) + 1, 0);
}

/** Numero de dias del mes. `mes` va de 1 a 12. */
export function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/**
 * Dia de la semana con el lunes como primer dia (0 = lunes ... 6 = domingo).
 *
 * getUTCDay() devuelve 0 para el domingo, que es la convencion estadounidense.
 * En Espana la semana empieza en lunes y el calendario debe pintarse asi.
 */
export function diaSemanaLunes(fechaISO: string): number {
  return (new Date(aInstante(fechaISO)).getUTCDay() + 6) % 7;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

export function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? '';
}

/** Etiqueta legible, p. ej. "30 de julio de 2026". */
export function fechaLarga(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split('-');
  return `${Number(dia)} de ${nombreMes(Number(mes))} de ${anio}`;
}
