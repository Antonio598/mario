import { createClient } from '@/lib/supabase/server';
import { FormularioRecaida } from '@/components/app/FormularioRecaida';
import { RegistroRecaidaLibre } from '@/components/app/RegistroRecaidaLibre';
import { obtenerAcceso } from '@/lib/app/acceso';
import type { EstadoDiario } from '@/lib/app/tipos';

export const dynamic = 'force-dynamic';

/**
 * Protocolo post-recaída.
 *
 * La página solo decide si el usuario ha dado su consentimiento explícito para
 * el tratamiento de datos del art. 9 RGPD. Si no lo ha dado, el formulario no
 * se muestra siquiera: la base de datos rechazaría el detalle y sería cruel
 * pedirle que escriba ocho respuestas para tirarlas después.
 */
export default async function RecaidaPage() {
  const supabase = await createClient();
  const [{ data }, acceso] = await Promise.all([supabase.rpc('estado_diario'), obtenerAcceso()]);
  const estado = data as unknown as EstadoDiario | null;

  // En gratis se registra el día; el protocolo de 9 preguntas es Premium.
  if (!acceso.esPremium) return <RegistroRecaidaLibre />;

  return <FormularioRecaida consiente={estado?.consiente_sensibles ?? false} />;
}
