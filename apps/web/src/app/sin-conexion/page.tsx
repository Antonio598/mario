import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sin conexión',
  robots: { index: false, follow: false },
};

/**
 * Pantalla que muestra el service worker cuando no hay red.
 *
 * Estática y sin datos: es lo único que puede servirse desde la caché sin
 * arriesgarse a dejar información personal escrita en el disco del dispositivo.
 */
export default function SinConexionPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-5 text-center">
      <p className="mg-kicker">Modo Guerrero</p>
      <h1 className="mt-3 text-3xl">Sin conexión</h1>
      <p className="mt-4 text-mg-gris-texto">
        No hemos podido conectar. Tu racha está a salvo en el servidor: en cuanto vuelva la red,
        seguirá donde la dejaste.
      </p>
    </main>
  );
}
