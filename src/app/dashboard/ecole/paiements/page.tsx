"use client";

import { CreditCard, Clock } from "lucide-react";

export default function PaiementsPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Dashboard</p>
        <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a]">Paiements</h1>
      </div>

      <div className="bg-white border border-[#ebebeb] rounded-2xl py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-[#ebebeb] flex items-center justify-center mx-auto mb-5">
          <CreditCard size={22} className="text-slate-300" />
        </div>
        <h2 className="font-black text-lg text-[#0a0a0a] mb-2">Paiements Mobile Money</h2>
        <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed mb-4">
          L'intégration Orange Money & MTN MoMo via CinetPay arrive prochainement.
        </p>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full">
          <Clock size={11} /> Prochainement
        </span>
      </div>
    </div>
  );
}
