import { describe, expect, it } from 'vitest';
import {
  diaSemanaLunes,
  diasDelMes,
  diasEntre,
  fechaLarga,
  fechaLocal,
  longitudRacha,
  sumarDias,
} from './fechas.js';

describe('fechaLocal', () => {
  it('devuelve dias distintos para zonas horarias a ambos lados del cambio de fecha', () => {
    // 2026-07-30 a las 11:00 UTC.
    const instante = new Date('2026-07-30T11:00:00Z');

    // Kiritimati va +14 -> ya es dia 31 alli.
    expect(fechaLocal('Pacific/Kiritimati', instante)).toBe('2026-07-31');
    // Midway va -11 -> alli todavia es dia 30.
    expect(fechaLocal('Pacific/Midway', instante)).toBe('2026-07-30');
  });

  it('cruza la medianoche en Madrid antes que en UTC', () => {
    // 22:30 UTC del 30 de julio: en Madrid (UTC+2 en verano) ya es dia 31.
    const antesDeMedianocheUTC = new Date('2026-07-30T22:30:00Z');

    expect(fechaLocal('UTC', antesDeMedianocheUTC)).toBe('2026-07-30');
    expect(fechaLocal('Europe/Madrid', antesDeMedianocheUTC)).toBe('2026-07-31');
  });

  it('respeta el horario de verano espanol', () => {
    // En enero Madrid va en UTC+1, no en UTC+2.
    const invierno = new Date('2026-01-15T23:30:00Z');
    expect(fechaLocal('Europe/Madrid', invierno)).toBe('2026-01-16');

    const veranoJusto = new Date('2026-07-15T21:30:00Z');
    expect(fechaLocal('Europe/Madrid', veranoJusto)).toBe('2026-07-15');
  });
});

describe('diasEntre', () => {
  it('cuenta dias consecutivos', () => {
    expect(diasEntre('2026-07-30', '2026-07-31')).toBe(1);
    expect(diasEntre('2026-07-30', '2026-07-30')).toBe(0);
    expect(diasEntre('2026-07-31', '2026-07-30')).toBe(-1);
  });

  it('cruza meses y anios', () => {
    expect(diasEntre('2026-07-31', '2026-08-01')).toBe(1);
    expect(diasEntre('2026-12-31', '2027-01-01')).toBe(1);
    expect(diasEntre('2026-01-01', '2026-12-31')).toBe(364);
  });

  it('cuenta bien el 29 de febrero de un anio bisiesto', () => {
    expect(diasEntre('2028-02-28', '2028-03-01')).toBe(2);
    expect(diasEntre('2026-02-28', '2026-03-01')).toBe(1);
  });

  it('no se descuadra al cruzar el cambio de hora estacional', () => {
    // El 29 de marzo de 2026 los relojes se adelantan una hora en Espana.
    // Ese dia tiene 23 horas: con aritmetica de instantes el redondeo podria
    // comerse un dia entero.
    expect(diasEntre('2026-03-28', '2026-03-30')).toBe(2);
    // El 25 de octubre de 2026 se atrasan: ese dia tiene 25 horas.
    expect(diasEntre('2026-10-24', '2026-10-26')).toBe(2);
  });
});

describe('longitudRacha', () => {
  it('cuenta el primer dia como dia 1, no como dia 0', () => {
    expect(longitudRacha('2026-07-30', '2026-07-30')).toBe(1);
  });

  it('suma un dia por cada dia natural transcurrido', () => {
    expect(longitudRacha('2026-07-01', '2026-07-30')).toBe(30);
  });

  it('devuelve 0 para una racha que empieza manana', () => {
    // Es el caso de la racha que se abre justo despues de una recaida.
    expect(longitudRacha('2026-07-31', '2026-07-30')).toBe(0);
  });

  it('coincide con app.longitud_racha de Postgres', () => {
    // Mismos casos que verifica supabase/tests/streaks.test.sql.
    expect(longitudRacha('2026-07-25', '2026-07-30')).toBe(6);
    expect(longitudRacha('2026-07-25', '2026-07-29')).toBe(5);
  });
});

describe('sumarDias', () => {
  it('avanza y retrocede cruzando meses', () => {
    expect(sumarDias('2026-07-31', 1)).toBe('2026-08-01');
    expect(sumarDias('2026-08-01', -1)).toBe('2026-07-31');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('diasDelMes', () => {
  it('conoce la longitud de cada mes', () => {
    expect(diasDelMes(2026, 1)).toBe(31);
    expect(diasDelMes(2026, 4)).toBe(30);
    expect(diasDelMes(2026, 2)).toBe(28);
    expect(diasDelMes(2028, 2)).toBe(29);
  });
});

describe('diaSemanaLunes', () => {
  it('coloca el lunes en la primera columna', () => {
    // El 27 de julio de 2026 es lunes.
    expect(diaSemanaLunes('2026-07-27')).toBe(0);
    expect(diaSemanaLunes('2026-08-02')).toBe(6); // domingo
  });
});

describe('fechaLarga', () => {
  it('formatea en espanol sin ceros a la izquierda', () => {
    expect(fechaLarga('2026-07-05')).toBe('5 de julio de 2026');
  });
});
