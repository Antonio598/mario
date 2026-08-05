interface Props {
  dias: number;
  record: number;
  diasTotales: number;
}

/** Circunferencia del anillo. r = 88, así que 2·π·88 ≈ 553. */
const CIRCUNFERENCIA = 553;

/**
 * Contador de racha: el elemento central de la app.
 *
 * El anillo avanza hacia el siguiente hito (7, 21, 30, 90, 180, 365 días) en
 * vez de hacia una meta fija. Una barra hacia "365" pasaría tres semanas sin
 * moverse de forma perceptible, que es justo cuando más falta hace ver avance.
 *
 * Es un SVG estático, sin animación de entrada: esta pantalla se abre todos los
 * días y una animación que la primera vez resulta agradable, a la trigésima
 * estorba.
 */
export function ContadorRacha({ dias, record, diasTotales }: Props) {
  const HITOS = [7, 21, 30, 90, 180, 365] as const;
  const siguienteHito = HITOS.find((h) => h > dias) ?? null;
  const hitoAnterior = [...HITOS].reverse().find((h) => h <= dias) ?? 0;

  const progreso =
    siguienteHito === null
      ? 1
      : (dias - hitoAnterior) / (siguienteHito - hitoAnterior);

  return (
    <div className="mg-entrada flex flex-col items-center">
      <div className="relative">
        <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
          <circle
            cx="110"
            cy="110"
            r="88"
            fill="none"
            stroke="var(--color-mg-negro-borde)"
            strokeWidth="6"
          />
          <circle
            cx="110"
            cy="110"
            r="88"
            fill="none"
            stroke="var(--color-mg-rojo)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={CIRCUNFERENCIA * (1 - progreso)}
            className="mg-anillo"
            // Empieza arriba, no a las tres en punto, que es donde SVG sitúa el
            // ángulo cero.
            transform="rotate(-90 110 110)"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/*
            `tabular-nums` fija el ancho de los dígitos: sin ello, al pasar de
            9 a 10 días el número se desplaza y da sensación de fallo.
          */}
          <span className="font-titular text-6xl leading-none font-bold tabular-nums">
            {dias}
          </span>
          <span className="mt-1 text-xs tracking-[0.2em] text-mg-gris-tenue uppercase">
            {dias === 1 ? 'día' : 'días'}
          </span>
        </div>
      </div>

      {siguienteHito !== null && (
        <p className="mt-5 text-sm text-mg-gris-texto">
          <span className="text-mg-blanco">{siguienteHito - dias}</span>{' '}
          {siguienteHito - dias === 1 ? 'día' : 'días'} para los {siguienteHito}
        </p>
      )}

      <dl className="mt-8 grid w-full max-w-xs grid-cols-2 gap-px overflow-hidden rounded-lg border border-mg-negro-borde bg-mg-negro-borde">
        <div className="bg-mg-negro-elevado px-4 py-4 text-center">
          <dt className="text-[11px] tracking-widest text-mg-gris-tenue uppercase">Récord</dt>
          <dd className="mt-1 font-titular text-2xl tabular-nums">{record}</dd>
        </div>
        <div className="bg-mg-negro-elevado px-4 py-4 text-center">
          <dt className="text-[11px] tracking-widest text-mg-gris-tenue uppercase">Totales</dt>
          <dd className="mt-1 font-titular text-2xl tabular-nums">{diasTotales}</dd>
        </div>
      </dl>
    </div>
  );
}
