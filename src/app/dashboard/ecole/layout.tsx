"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSchool } from "@/lib/useSchool";
import {
  School,
  LayoutDashboard,
  ClipboardList,
  GraduationCap,
  Bell,
  FileText,
  ImageIcon,
  CreditCard,
  LogOut,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Settings,
  DollarSign,
  Building2,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { href: "/dashboard/ecole",               label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/ecole/admissions",    label: "Admissions",     icon: ClipboardList },
  { href: "/dashboard/ecole/classes",       label: "Classes",        icon: GraduationCap },
  { href: "/dashboard/ecole/annonces",      label: "Annonces",       icon: Bell },
  { href: "/dashboard/ecole/frais",         label: "Frais",          icon: DollarSign },
  { href: "/dashboard/ecole/infrastructure",label: "Infrastructures",icon: Building2 },
  { href: "/dashboard/ecole/documents",     label: "Documents",      icon: FileText },
  { href: "/dashboard/ecole/galerie",       label: "Galerie",        icon: ImageIcon },
  { href: "/dashboard/ecole/paiements",     label: "Paiements",      icon: CreditCard },
  { href: "/dashboard/ecole/parametres",    label: "Paramètres",     icon: Settings },
  { href: "/pro/emplois-du-temps",          label: "Emplois du temps", icon: CalendarDays },
];

export default function EcoleDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { school, user, loading, signOut } = useSchool();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-[#0a0f0d] text-white w-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 flex">
              <span className="flex-1 bg-emerald-600 rounded-l-md" />
              <span className="flex-1 bg-red-500" />
              <span className="flex-1 bg-yellow-400 rounded-r-md" />
            </div>
            <School size={15} className="relative z-10 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight">
            Écoles<span className="text-emerald-400">237</span>
          </span>
        </Link>
      </div>

      {/* School info */}
      <div className="px-5 py-4 border-b border-white/8">
        {loading ? (
          <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
        ) : school ? (
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 mb-1">
              Établissement actif
            </p>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-snug truncate">{school.name}</p>
                <p className="text-xs text-slate-400">{school.city}</p>
              </div>
              {school.is_verified && (
                <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-500 mb-2">Aucune école liée</p>
            <Link
              href="/dashboard/ecole/onboarding"
              className="text-xs text-emerald-400 font-semibold hover:text-emerald-300"
            >
              Lier mon établissement →
            </Link>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-600/20 text-emerald-400"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={16} className={active ? "text-emerald-400" : ""} />
              {item.label}
              {active && <ChevronRight size={12} className="ml-auto text-emerald-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-white/8">
        {user && (
          <p className="px-3 text-[11px] text-slate-500 truncate mb-2">{user.email}</p>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors w-full"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f9f7f2] flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-[220px] shrink-0 flex-col fixed inset-y-0 left-0 z-40">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-[220px] flex flex-col">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-[220px] flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-5 h-14 bg-white border-b border-[#ebebeb]">
          <button onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <span className="font-black text-sm">
            {school?.name ?? "Dashboard"}
          </span>
          <button onClick={() => setMobileOpen(false)}>
            {mobileOpen ? <X size={22} /> : <div className="w-6" />}
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
