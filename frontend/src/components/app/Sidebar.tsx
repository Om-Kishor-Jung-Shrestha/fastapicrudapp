"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Tags,
  UserCircle,
  ShieldPlus,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const baseLinks = [
  { href: "/app", label: "Products", icon: LayoutGrid, exact: true },
  { href: "/app/products/new", label: "Add Product", icon: PlusCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, isSuperAdmin, user } = useAuth();

  const links = [
    ...baseLinks,
    ...(isAdmin ? [{ href: "/app/categories", label: "Categories", icon: Tags }] : []),
    ...(isSuperAdmin
      ? [{ href: "/app/admin/invitations", label: "Invite Admins", icon: ShieldPlus }]
      : []),
    { href: "/app/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-slate-200 bg-white h-[calc(100vh-4rem)] sticky top-16 py-4">
      <div className="px-4 pb-4 mb-2 border-b border-slate-100">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
          Signed in as
        </p>
        <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</p>
        <span className="mt-1 inline-block text-[11px] font-semibold uppercase tracking-wide text-brand-600 bg-brand-50 rounded px-1.5 py-0.5">
          {user?.role.replace("_", " ")}
        </span>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
