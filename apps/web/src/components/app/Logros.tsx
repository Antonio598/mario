import { calcularLogros, type DatosLogros, type Logro } from '@reset-alfa/shared';

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
