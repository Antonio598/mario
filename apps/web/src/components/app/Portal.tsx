'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Saca su contenido de la jerarquia y lo cuelga de <body>.
 *
 * POR QUE HACE FALTA. Los modales se declaran dentro de la pantalla que los
 * abre, y esa pantalla vive dentro de <main>, que lleva la animacion de entrada
 * `mg-pagina`. Una animacion de `opacity` y `transform` convierte al elemento
 * en contexto de apilamiento y en bloque contenedor: a partir de ahi,
 * `position: fixed; inset: 0` deja de referirse a la ventana y pasa a
 * referirse a <main>.
 *
 * El resultado se veia en pantalla: el modal medía lo que mide la pagina
 * entera -no la ventana-, su contenido quedaba centrado a mitad del documento
 * y por tanto fuera de la vista, y ni la cabecera ni la barra inferior
 * quedaban cubiertas pese al z-index mas alto, porque ese z-index solo competia
 * dentro del contexto de <main>.
 *
 * Colgar del body es la unica solucion que no depende de que nadie vuelva a
 * poner una animacion o un filtro en un contenedor intermedio.
 *
 * El estado `montado` evita el desajuste de hidratacion: en el servidor no hay
 * `document`, asi que la primera pasada no pinta nada.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  if (!montado) return null;
  return createPortal(children, document.body);
}
