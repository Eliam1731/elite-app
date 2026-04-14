import { PlaceholderModule } from "@/components/shared/placeholder-module";

export default function PaymentsPage() {
  return (
    <PlaceholderModule
      title="Pagos"
      description="Los pagos ya se registran directamente dentro de cada pedido."
      helperText="Para uso diario, entra al pedido correspondiente y registra ahi anticipos, abonos o liquidacion. Asi el saldo pendiente y el status se actualizan sobre el pedido correcto."
      actionHref="/pedidos"
      actionLabel="Ir a pedidos"
    />
  );
}
