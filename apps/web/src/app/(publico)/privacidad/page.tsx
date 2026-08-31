import type { Metadata } from 'next';
import { publicEnv } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Politica de privacidad',
  description: 'Que datos trata Modo Guerrero, con que base legal y como ejercer tus derechos.',
};

/**
 * BORRADOR TECNICO, NO TEXTO LEGAL DEFINITIVO.
 *
 * Refleja con exactitud lo que el sistema hace, para que quien redacte la
 * version final parta de la realidad tecnica y no de una plantilla generica.
 * Debe revisarlo un profesional antes de publicar: hay datos de categoria
 * especial (art. 9 RGPD) de por medio.
 *
 * La version que se muestra aqui debe coincidir con
 * NEXT_PUBLIC_PRIVACY_POLICY_VERSION, que es lo que se guarda en cada fila de
 * `consents`. Asi se puede demostrar que texto acepto exactamente cada usuario.
 */
export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl sm:text-4xl">Politica de privacidad</h1>
      <p className="mt-2 text-sm text-mg-gris-tenue">
        Version {publicEnv.privacyPolicyVersion}
      </p>

      <div className="mt-8 space-y-8 text-mg-gris-texto">
        <section>
          <h2 className="text-xl text-mg-blanco">Responsable</h2>
          <p className="mt-2">
            {/* PENDIENTE: identidad, NIF, domicilio y correo del responsable. */}
            Pendiente de completar por el titular del proyecto.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-mg-blanco">Datos que tratamos</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-mg-gris-texto">Cuenta:</strong> correo electronico, nombre y,
              si inicias sesion con Google o Apple, la imagen de perfil.
            </li>
            <li>
              <strong className="text-mg-gris-texto">Uso de la aplicacion:</strong> registros
              diarios de seguimiento, rachas y progreso en la formacion.
            </li>
            <li>
              <strong className="text-mg-gris-texto">
                Registros de recaida (categoria especial):
              </strong>{' '}
              las respuestas del protocolo posterior a una recaida describen aspectos de tu vida
              sexual. Son datos de categoria especial segun el articulo 9 del RGPD y reciben una
              proteccion reforzada.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl text-mg-blanco">Base legal</h2>
          <p className="mt-2">
            Los datos de cuenta y de uso se tratan para poder prestarte el servicio (art. 6.1.b
            RGPD). Los registros de recaida se tratan{' '}
            <strong className="text-mg-gris-texto">
              unicamente con tu consentimiento explicito
            </strong>{' '}
            (art. 9.2.a RGPD). Ese consentimiento es separado del resto, puedes negarlo y seguir
            usando la aplicacion, y puedes retirarlo en cualquier momento desde Ajustes.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-mg-blanco">Donde se guardan</h2>
          <p className="mt-2">
            En servidores situados en la Union Europea (Frankfurt, Alemania). La informacion se
            almacena cifrada y cada usuario solo puede acceder a sus propios registros: el control
            se aplica en la propia base de datos, no solo en la aplicacion.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-mg-blanco">Quien mas los recibe</h2>
          <p className="mt-2">
            Cuando completas el protocolo posterior a una recaida, tus respuestas se envian por
            correo al equipo de Modo Guerrero para poder darte seguimiento. Ese envio solo ocurre
            si has dado el consentimiento explicito del art. 9: si lo niegas o lo retiras, se
            registra el dia y no se envia nada.
          </p>
          <p className="mt-2">
            El correo se entrega a traves de Resend (Resend, Inc.), que actua como encargado del
            tratamiento. No se cede a nadie mas, no se usa con fines publicitarios y no se elabora
            ningun perfil con ello.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-mg-blanco">Publicidad y cookies</h2>
          <p className="mt-2">
            {/* Se activa en la Fase 3, junto con el banner de consentimiento. */}
            Esta web se financia con publicidad. No se instala ninguna cookie publicitaria ni de
            medicion antes de que des tu consentimiento en el banner. Puedes cambiar tu eleccion
            cuando quieras.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-mg-blanco">Tus derechos</h2>
          <p className="mt-2">
            Puedes acceder a tus datos, rectificarlos, suprimirlos, oponerte al tratamiento,
            limitarlo y solicitar su portabilidad. Desde{' '}
            <strong className="text-mg-gris-texto">Perfil &gt; Exportar mis datos</strong> obtienes
            una copia completa en formato legible por maquina, y desde{' '}
            <strong className="text-mg-gris-texto">Perfil &gt; Eliminar cuenta</strong> el borrado
            es real e inmediato: no se conserva una copia desactivada.
          </p>
          <p className="mt-2">
            Si consideras que no atendemos tus derechos, puedes reclamar ante la Agencia Espanola
            de Proteccion de Datos (aepd.es).
          </p>
        </section>
      </div>
    </main>
  );
}
