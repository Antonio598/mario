import Image from 'next/image';

interface Props {
  variante?: 'app' | 'programa';
  className?: string;
  ancho?: number;
  alto?: number;
}

/**
 * Logotipo de marca.
 *
 * Lee los ficheros de public/logos/. Si no existen todavía, Next sirve un 404
 * para la imagen y el navegador muestra el texto alternativo, así que la app
 * no se rompe mientras no haya assets: solo se ve el nombre.
 *
 * Cuando el cliente suba los suyos, basta con dejarlos en esa carpeta con el
 * nombre correcto. No hay que tocar código.
 */
export function Logo({ variante = 'app', className = '', ancho = 140, alto = 40 }: Props) {
  return (
    <Image
      src={`/logos/${variante}.svg`}
      alt={variante === 'app' ? 'Reset Alfa' : 'Reset Alfa'}
      width={ancho}
      height={alto}
      className={className}
      priority={variante === 'app'}
    />
  );
}
