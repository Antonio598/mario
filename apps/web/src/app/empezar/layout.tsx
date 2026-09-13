import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tu plan personalizado',
  // El test es privado por naturaleza y no aporta nada en resultados.
  robots: { index: false, follow: false },
};

/**
 * Armazon del embudo de entrada.
 *
 * Fuera de /app a proposito: sin cabecera, sin barra inferior y sin gate de
 * sesion, porque el test se hace ANTES de tener cuenta. Usa los tokens `ra-*`
 * de la app (SCRIPT_TEMA del layout raiz ya fija el tema), asi que lo que ve
 * el usuario aqui es exactamente lo que vera dentro.
 */
export default function EmpezarLayout({ children }: { children: React.ReactNode }) {
  return <div className="ra-app min-h-[100dvh] bg-ra-fondo text-ra-texto">{children}</div>;
}
