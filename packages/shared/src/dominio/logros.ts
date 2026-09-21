/**
 * Logros: medallas por hitos.
 *
 * Se calculan al vuelo a partir de datos que ya existen —récord, días
 * totales, P.A.D, carta, plantillas rellenadas— y no se guardan en ninguna
 * tabla. Guardarlos obligaría a mantener sincronizado un dato derivado, y un
 * logro que se concede pero luego no se refleja (o al revés) es peor que no
 * tener logros.
 *
 * Los de racha miran el RÉCORD, no la racha actual. Llegar a 7 días es algo
 * que se consigue una vez; una recaída después no lo borra. Quitar una medalla
 * ya ganada es castigo, y el castigo es lo que hace que se deje de registrar
 * la verdad.
 */

export interface DatosLogros {
  record: number;
  diasTotales: number;
  tienePad: boolean;
  tieneCarta: boolean;
  plantillasRellenadas: number;
  esPremium: boolean;
}

export interface Logro {
  id: string;
  titulo: string;
  descripcion: string;
  /** Texto corto dentro de la medalla. */
  marca: string;
  conseguido: boolean;
  /** Solo alcanzable con Premium. Se pinta con candado en vez de con número. */
  premium: boolean;
}

const HITOS_RACHA: ReadonlyArray<{ dias: number; titulo: string }> = [
  { dias: 7, titulo: 'Primera semana' },
  { dias: 21, titulo: 'Tres semanas' },
  { dias: 30, titulo: 'Un mes' },
  { dias: 90, titulo: 'Tres meses' },
  { dias: 180, titulo: 'Medio año' },
  { dias: 365, titulo: 'Un año' },
];

export function calcularLogros(d: DatosLogros): Logro[] {
  /*
    En gratis el contador se detiene en 30, así que los hitos por encima no
    se pueden ver: se marcan como Premium y no se conceden aunque el récord
    real los supere. Concederlos contradiría el "30+" del contador.
  */
  const racha: Logro[] = HITOS_RACHA.map((h) => {
    const premium = h.dias > 30 && !d.esPremium;
    return {
      id: `racha-${h.dias}`,
      titulo: h.titulo,
      descripcion: `${h.dias} días de racha`,
      marca: String(h.dias),
      conseguido: !premium && d.record >= h.dias,
      premium,
    };
  });

  return [
    {
      id: 'primer-checkin',
      titulo: 'Primer paso',
      descripcion: 'Tu primer check-in',
      marca: '1',
      conseguido: d.diasTotales >= 1,
      premium: false,
    },
    {
      id: 'pad',
      titulo: 'Con plan',
      descripcion: 'Has creado tu P.A.D',
      marca: 'PAD',
      conseguido: d.tienePad,
      premium: false,
    },
    {
      id: 'carta',
      titulo: 'Por escrito',
      descripcion: 'Has escrito tu carta anti-recaída',
      marca: '✉',
      conseguido: d.tieneCarta,
      premium: false,
    },
    {
      id: 'plantilla',
      titulo: 'Sin excusas',
      descripcion: 'Has rellenado tu Bitácora de NOFAP',
      marca: '✓',
      conseguido: d.plantillasRellenadas >= 1,
      premium: false,
    },
    ...racha,
  ];
}
