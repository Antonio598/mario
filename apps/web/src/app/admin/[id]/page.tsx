import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditorArticulo } from '@/components/admin/EditorArticulo';

export const dynamic = 'force-dynamic';

export default async function EditarArticuloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: articulo }, { data: categorias }, { data: autores }] = await Promise.all([
    supabase.from('articles').select('*').eq('id', id).maybeSingle(),
    supabase.from('categorias').select('slug, nombre').order('orden'),
    supabase.from('autores').select('id').limit(1),
  ]);

  if (articulo === null) notFound();

  return (
    <div>
      <header className="mb-8">
        <p className="mg-kicker">Editando</p>
        <h1 className="mg-rule mt-2 truncate text-3xl">{articulo.titulo}</h1>
      </header>

      <EditorArticulo
        articulo={articulo}
        categorias={categorias ?? []}
        autorId={articulo.autor_id ?? autores?.[0]?.id ?? null}
      />
    </div>
  );
}
