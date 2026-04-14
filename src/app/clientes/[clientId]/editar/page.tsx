import { notFound } from "next/navigation";

import { PageIntro } from "@/components/shared/page-intro";
import { updateClientAction } from "@/features/clients/actions";
import { ClientForm } from "@/features/clients/components/client-form";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getClientById } from "@/services/clients/queries";

type EditClientPageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function EditClientPage({
  params,
}: EditClientPageProps) {
  const { clientId } = await params;
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Clientes"
          title="Editar cliente"
          description="Conecta Supabase para editar registros reales."
          backHref="/clientes"
        />
        <SupabaseBanner />
      </div>
    );
  }

  const client = await getClientById(clientId);

  if (!client) {
    notFound();
  }

  const action = updateClientAction.bind(null, clientId);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Clientes"
        title="Editar cliente"
        description="Actualiza los datos base para no recapturar despues."
        backHref={`/clientes/${clientId}`}
      />

      <ClientForm
        action={action}
        submitLabel="Guardar cambios"
        defaultValues={{
          name: client.name,
          phone: client.phone,
          email: client.email ?? "",
          address: client.address ?? "",
          rfc: client.rfc ?? "",
          notes: client.notes ?? "",
        }}
      />
    </div>
  );
}
