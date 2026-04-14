import { UserRoundPlus, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { ClientCard } from "@/features/clients/components/client-card";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getClients } from "@/services/clients/queries";

export default async function ClientsPage() {
  const configured = isSupabaseConfigured();
  const clients = configured ? await getClients() : [];

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Clientes"
        title="Tu cartera activa"
        description="Consulta clientes frecuentes, crea altas rapidas y entra directo al detalle sin perder tiempo."
        actionHref="/clientes/nuevo"
        actionLabel="Nuevo"
      />

      {!configured ? <SupabaseBanner /> : null}

      {configured && clients.length > 0 ? (
        <section className="space-y-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </section>
      ) : null}

      {configured && clients.length === 0 ? (
        <EmptyState
          title="Todavia no hay clientes"
          description="Empieza con una alta sencilla. Con nombre y telefono ya puedes guardar el primer registro."
          actionHref="/clientes/nuevo"
          actionLabel="Crear cliente"
          icon={<UserRoundPlus className="h-6 w-6" />}
        />
      ) : null}

      {!configured ? (
        <EmptyState
          title="Conecta Supabase para empezar"
          description="En cuanto pongas las variables de entorno, esta vista mostrara los clientes reales guardados en tu proyecto Elite."
          icon={<Users className="h-6 w-6" />}
        />
      ) : null}
    </div>
  );
}
