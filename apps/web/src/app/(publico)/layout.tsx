import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

/**
 * Armazón de la web pública: blog, páginas legales y fichas de producto.
 *
 * Existe separado del de `/app` porque las dos superficies tienen reglas
 * opuestas. Aquí van la cabecera de navegación, el pie con los enlaces legales
 * que AdSense exige y los bloques de anuncio. En `/app` no va nada de eso: son
 * páginas privadas, con datos personales delante, y ni tienen valor
 * publicitario ni deberían mostrar anuncios junto a un registro de recaída.
 *
 * Un grupo de rutas —el paréntesis en el nombre— no añade segmento a la URL:
 * `/articulos` sigue siendo `/articulos`.
 */
export default function PublicoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
