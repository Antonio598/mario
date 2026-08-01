import { createClient } from '@/lib/supabase/server';
import { FormularioRecaida } from '@/components/app/FormularioRecaida';
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
  const { data } = await supabase.rpc('estado_diario');
  const estado = data as unknown as EstadoDiario | null;

  return <FormularioRecaida consiente={estado?.consiente_sensibles ?? false} />;
}
