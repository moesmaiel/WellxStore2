import { CartProvider } from "@/lib/cart";
import { SiteHeader } from "@/components/store/SiteHeader";
import { SiteFooter } from "@/components/store/SiteFooter";
import { getSettings } from "@/lib/repo";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <CartProvider>
      <SiteHeader storeName={settings.store_name} />
      <main className="flex-1">{children}</main>
      <SiteFooter storeName={settings.store_name} />
    </CartProvider>
  );
}
