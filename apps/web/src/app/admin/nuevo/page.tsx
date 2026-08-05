import { createClient } from '@/lib/supabase/server';
import { EditorArticulo } from '@/components/admin/EditorArticulo';

export const dynamic = 'force-dynamic';

export default async function NuevoArticuloPage() {
  const supabase = await createClient();

  const [{ data: categorias }, { data: autores }] = await Promise.all([
    supabase.from('categorias').select('slug, nombre').order('orden'),
    supabase.from('autores').select('id').limit(1),
  ]);

  return (
    <div>
      <header className="mb-8">
        <p className="mg-kicker">Nuevo</p>
        <h1 className="mg-rule mt-2 text-3xl">Escribir un articulo</h1>
      </header>

      <EditorArticulo
        articulo={null}
        categorias={categorias ?? []}
        autorId={autores?.[0]?.id ?? null}
      />
    </div>
  );
}
