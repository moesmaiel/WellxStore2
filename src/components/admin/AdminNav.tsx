"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderTree, Building2, Package,
  ShoppingCart, Link2, Mail, Settings, Users, ShieldCheck,
} from "lucide-react";
import type { AdminRole } from "@/lib/types";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/brands", label: "Brands", icon: Building2 },
  { href: "/admin/affiliate", label: "Affiliate log", icon: Link2 },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  {
    href: "/admin/admin-users",
    label: "Admin Users",
    icon: ShieldCheck,
    superAdminOnly: true,
  },
];

export function AdminNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      {LINKS.filter((l) => !l.superAdminOnly || role === "super_admin").map(
        ({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`wx-focus flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "wx-gradient font-semibold text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </Link>
          );
        }
      )}
    </nav>
  );
}
