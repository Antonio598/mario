import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acerca de',
  description: 'Quien esta detras de Modo Guerrero y por que existe este proyecto.',
};

/**
 * Pagina obligatoria para AdSense.
 *
 * Google rechaza los sitios sin autor identificable, biografia real y datos de
 * contacto. Ademas es una senal E-E-A-T directa. El texto definitivo lo aporta
 * el cliente; lo marcado con PENDIENTE debe sustituirse antes de solicitar la
 * revision de AdSense.
 */
export default function AcercaDePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl sm:text-4xl">Acerca de Modo Guerrero</h1>

      <div className="mt-8 space-y-5 text-mg-gris-texto">
        <p>
          {/* PENDIENTE: biografia real del autor, en primera persona. */}
          Modo Guerrero nace de una experiencia concreta: la de recuperar el control sobre los
          propios habitos cuando el piloto automatico llevaba anos decidiendo por ti.
        </p>
        <p>
          Aqui se escribe sobre disciplina, autocontrol, foco y constancia. Sobre lo que funciona
          sostenido en el tiempo, no sobre atajos.
        </p>
        <p className="border-l-2 border-mg-negro-borde pl-4 text-sm text-mg-gris-tenue">
          Modo Guerrero es un proyecto de habitos y disciplina. No es un tratamiento medico ni
          psicologico y no sustituye la atencion de un profesional.
        </p>
      </div>
    </main>
  );
}
