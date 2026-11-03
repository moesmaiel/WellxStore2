import { listCustomers } from "@/lib/customers-repo";
import { getSettings } from "@/lib/repo";
import { PageHeader } from "@/components/admin/ui";
import { CustomerTable } from "./CustomerTable";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [customers, settings] = await Promise.all([listCustomers(), getSettings()]);

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} unique customers, derived from orders and deduplicated by email or phone.`}
      />
      <CustomerTable customers={customers} currency={settings.default_currency} />
    </>
  );
}
