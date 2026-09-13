import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GuardarPlan } from '@/components/empezar/GuardarPlan';

export const dynamic = 'force-dynamic';

/**
 * Puente entre el test y la app.
 *
 * Aqui llega el usuario justo despues de crear la cuenta (o de pulsar
 * "Guardar mi plan" con sesion). Lee las respuestas del navegador, las guarda
 * en el perfil y salta al paywall. Vive FUERA de /app: si estuviera dentro,
 * el gate del layout lo mandaria al test antes de poder guardar, en bucle.
 */
export default async function GuardarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) redirect('/entrar?siguiente=/empezar/guardar&registro=1');

  return <GuardarPlan />;
}
