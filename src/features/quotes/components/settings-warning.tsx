export function SettingsWarning() {
  return (
    <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
      Falta configurar <code>business_settings</code>. Agrega una fila con{" "}
      <code>vat_rate</code>, <code>quote_prefix</code> y <code>order_prefix</code>{" "}
      para poder guardar cotizaciones.
    </section>
  );
}
