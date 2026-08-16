import Image from 'next/image';

interface Props {
  /** `app` es el isotipo cuadrado; `programa`, el logotipo horizontal. */
  variante?: 'app' | 'programa';
  className?: string;
  /** Alto en píxeles. El ancho se calcula solo para no deformar el logo. */
  alto?: number;
  prioridad?: boolean;
}

/**
 * Proporciones reales de los ficheros de public/logos/.
 *
 * Se derivan del alto que pida cada sitio en vez de fijar ancho y alto a mano:
 * pasar a `Image` unas medidas que no coinciden con la imagen real la deforma y
 * reserva un hueco del tamaño equivocado, que al cargar descuadra el layout.
 *
 * Si sustituyes un logo por otro de distinta forma, actualiza esta constante.
 */
const PROPORCION = {
  app: 1080 / 1080,
  programa: 1080 / 607,
} as const;

export function Logo({ variante = 'app', className = '', alto = 40, prioridad = false }: Props) {
  const ancho = Math.round(alto * PROPORCION[variante]);

  return (
    <Image
      src={`/logos/${variante}.png`}
      alt="Reset Alfa"
      width={ancho}
      height={alto}
      className={className}
      priority={prioridad}
    />
  );
}
