import { PlaceholderModule } from "@/components/shared/placeholder-module";

export default function SizesPage() {
  return (
    <PlaceholderModule
      title="Tallas"
      description="La captura de tallas ya opera dentro de cada pedido, no como modulo global."
      helperText="Para trabajar tallas en uso real, entra a un pedido y captura las piezas desde su detalle. Asi se conserva la relacion correcta con cliente, producto y status."
      actionHref="/pedidos"
      actionLabel="Abrir pedidos"
    />
  );
}
