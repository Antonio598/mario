import Link from 'next/link';

/**
 * Destino de los fallos del callback de autenticacion.
 *
 * No muestra detalles tecnicos del error: para el usuario no aportan nada y
 * pueden revelar informacion sobre el sistema.
 */
export default function AuthErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
      <h1 className="text-3xl">No hemos podido completar el acceso</h1>
      <p className="mt-4 text-mg-gris-texto">
        El enlace puede haber caducado o haberse usado ya. Vuelve a intentarlo.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block bg-mg-rojo px-6 py-3 font-semibold text-mg-blanco hover:bg-mg-rojo-oscuro"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
