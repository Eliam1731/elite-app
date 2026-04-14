import { PageIntro } from "@/components/shared/page-intro";
import { createClientAction } from "@/features/clients/actions";
import { ClientForm } from "@/features/clients/components/client-form";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { isSupabaseConfigured } from "@/lib/supabase/server";

type NewClientPageProps = {
  searchParams?: Promise<{ returnTo?: string }>;
};

function getSafeReturnTo(returnTo?: string) {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return null;
  }

  return returnTo;
}

export default async function NewClientPage({
  searchParams,
}: NewClientPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const returnTo = getSafeReturnTo(resolvedSearchParams?.returnTo);
  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Clientes"
        title="Nuevo cliente"
        description="Captura minima para operar rapido desde el celular."
        backHref={returnTo ?? "/clientes"}
      />

      {!configured ? <SupabaseBanner /> : null}

      <ClientForm
        action={createClientAction}
        submitLabel="Guardar cliente"
        returnTo={returnTo ?? undefined}
      />
    </div>
  );
}
