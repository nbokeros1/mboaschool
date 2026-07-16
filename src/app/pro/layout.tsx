import Link from "next/link";
import { School } from "lucide-react";

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9f7f2]">
      <header className="bg-[#0a0f0d] text-white px-6 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 flex">
              <span className="flex-1 bg-emerald-600 rounded-l-md" />
              <span className="flex-1 bg-red-500" />
              <span className="flex-1 bg-yellow-400 rounded-r-md" />
            </div>
            <School size={13} className="relative z-10 text-white" />
          </div>
          <span className="text-base font-black tracking-tight">
            MboaSchool<span className="text-emerald-400 font-bold"> Pro</span>
          </span>
        </Link>
        <span className="text-white/20">|</span>
        <Link
          href="/dashboard/ecole"
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          ← Tableau de bord
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
