import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Funnel } from '@/components/empezar/Funnel';

export const dynamic = 'force-dynamic';

/**
 * El test. Quien ya lo completo no vuelve a verlo: va directo a la app.
 */
export default async function EmpezarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user !== null) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('onboarding_completado')
      .maybeSingle();
    if (perfil?.onboarding_completado === true) redirect('/app');
  }

  return <Funnel haySesion={user !== null} />;
}
