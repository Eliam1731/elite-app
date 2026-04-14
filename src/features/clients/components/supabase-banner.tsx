export function SupabaseBanner() {
  return (
    <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
      Configura <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
      <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> para conectar la app con tu
      proyecto de Supabase.
    </section>
  );
}
