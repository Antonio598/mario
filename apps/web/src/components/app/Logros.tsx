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

interface Logro {
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

function Medalla({ logro }: { logro: Logro }) {
  return (
    <li
      className={`ra-card flex flex-col items-center px-2 py-4 text-center transition-opacity ${
        logro.conseguido ? '' : 'opacity-50'
      }`}
      aria-label={`${logro.titulo}: ${logro.conseguido ? 'conseguido' : 'pendiente'}`}
    >
      {/*
        La medalla: un círculo con cinta. Conseguida va en rojo con la marca en
        blanco; pendiente va solo con el contorno y un candado, para que se vea
        qué queda por delante sin que parezca un error.
      */}
      <div className="relative">
        <svg width="56" height="64" viewBox="0 0 56 64" aria-hidden="true">
          <path
            d="M18 2h8l-6 22h-8zM30 2h8l6 22h-8z"
            fill={logro.conseguido ? 'var(--color-ra-rojo)' : 'var(--color-ra-borde)'}
            opacity={logro.conseguido ? 0.7 : 1}
          />
          <circle
            cx="28"
            cy="40"
            r="20"
            fill={logro.conseguido ? 'var(--color-ra-rojo)' : 'var(--color-ra-superficie)'}
            stroke={logro.conseguido ? 'var(--color-ra-rojo-oscuro)' : 'var(--color-ra-borde)'}
            strokeWidth="2"
          />
          <circle
            cx="28"
            cy="40"
            r="15"
            fill="none"
            stroke={logro.conseguido ? 'rgba(255,255,255,0.35)' : 'var(--color-ra-borde-suave)'}
            strokeWidth="1.5"
          />
          {logro.conseguido ? (
            <text
              x="28"
              y="45"
              textAnchor="middle"
              fontFamily="var(--font-titular)"
              fontWeight="700"
              fontSize={logro.marca.length > 2 ? 11 : 15}
              fill="#fff"
            >
              {logro.marca}
            </text>
          ) : (
            <g
              transform="translate(22 34)"
              fill="none"
              stroke="var(--color-ra-texto-tenue)"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <rect x="1" y="5" width="10" height="7" rx="1.5" />
              <path d="M3.5 5V3.5a2.5 2.5 0 0 1 5 0V5" />
            </g>
          )}
        </svg>
      </div>

      <p className="mt-2 font-titular text-xs leading-tight font-bold text-ra-texto uppercase">
        {logro.titulo}
      </p>
      <p className="mt-0.5 text-[10px] leading-tight text-ra-texto-tenue">
        {logro.premium ? 'Premium' : logro.descripcion}
      </p>
    </li>
  );
}

export function Logros({ datos }: { datos: DatosLogros }) {
  const logros = calcularLogros(datos);
  const conseguidos = logros.filter((l) => l.conseguido).length;

  // Conseguidos primero: lo que ya tienes es lo que te anima a seguir. Dentro
  // de cada grupo se respeta el orden de dificultad.
  const ordenados = [...logros.filter((l) => l.conseguido), ...logros.filter((l) => !l.conseguido)];

  return (
    <section className="mt-10">
      <div className="ra-seccion">
        <h2>Logros</h2>
        <span className="ra-chip">
          {conseguidos} de {logros.length}
        </span>
      </div>
      <p className="mt-1 text-xs text-ra-texto-tenue">
        Las medallas de racha se quedan aunque después recaigas. Lo conseguido, conseguido está.
      </p>

      <ul className="mg-escalonado mt-4 grid grid-cols-3 gap-2">
        {ordenados.map((l) => (
          <Medalla key={l.id} logro={l} />
        ))}
      </ul>
    </section>
  );
}
