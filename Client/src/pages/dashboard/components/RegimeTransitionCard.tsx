import React from "react";
import { useTranslation } from "react-i18next";
import { formatRupeesINR } from "@/features/gst/utils/money";

interface RegimeTransitionCardProps {
  data?: Array<{
    id: string;
    label: string;
    grossIncome: number;
    newTax: number;
    oldTax: number;
    recommended: "new" | "old";
  }>;
}

export const RegimeTransitionCard: React.FC<RegimeTransitionCardProps> = ({ data }) => {
  const { t } = useTranslation();

  // 9 brackets matching reference image pillars A to I
  const brackets = [
    { label: "A", range: "0-4L", height: "35%", color: "bg-slate-600/70", val: "0.0" },
    { label: "B", range: "4-8L", height: "65%", color: "bg-slate-500", val: "1.01" },
    { label: "C", range: "8-12L", height: "55%", color: "bg-teal-500", val: "3.1" },
    { label: "D", range: "12-16L", height: "60%", color: "bg-indigo-500", val: "0.2" },
    { label: "E", range: "16-20L", height: "78%", color: "bg-amber-400", val: "1.2" },
    { label: "F", range: "20-24L", height: "70%", color: "bg-rose-500", val: "0.1" },
    { label: "G", range: "24-30L", height: "52%", color: "bg-teal-400", val: "1.1" },
    { label: "H", range: "30-50L", height: "80%", color: "bg-cyan-400", val: "4.2" },
    { label: "I", range: "50L+", height: "92%", color: "bg-slate-400", val: "0.1" },
  ];

  // Table items on the right side
  const transitionTable = [
    { name: "Salary Income", color: "bg-rose-500", amount: "₹ 15.24 L", pct: "65%" },
    { name: "Business / Prof.", color: "bg-cyan-400", amount: "₹ 4.42 L", pct: "18%" },
    { name: "Capital Gains", color: "bg-teal-400", amount: "₹ 2.15 L", pct: "9%" },
    { name: "Other Sources", color: "bg-amber-400", amount: "₹ 1.80 L", pct: "8%" },
    { name: "Total Taxable", color: "bg-indigo-400", amount: "₹ 23.61 L", pct: "100%" },
  ];

  return (
    <div className="rounded-3xl p-6 sm:p-7 bg-[#16192E] text-white border border-[#23274A] shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#23274A]">
        <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-300">
          {t("dashboard.transition", "TRANSITION / REGIME BRACKETS")}
        </h3>
        <span className="text-xs font-semibold text-slate-400">
          FY 2026-27 Slabs
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end my-auto py-4">
        {/* Left: 9 Multi-Colored Pillar Bars */}
        <div className="md:col-span-7">
          <div className="h-44 flex items-end justify-between gap-1.5 px-1 border-b border-[#23274A] pb-2">
            {brackets.map((b) => (
              <div key={b.label} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div
                  style={{ height: b.height }}
                  className={`w-full max-w-[22px] rounded-t-sm transition-all duration-500 group-hover:brightness-125 group-hover:scale-y-105 origin-bottom shadow-sm ${b.color}`}
                  title={`${b.label}: ${b.range}`}
                />
              </div>
            ))}
          </div>

          {/* Slabs / Letter Labels below */}
          <div className="flex justify-between items-center px-1 pt-2">
            {brackets.map((b) => (
              <div key={b.label} className="flex-1 text-center">
                <span className="block text-[10px] font-bold text-slate-400">{b.label}</span>
                <span className="block text-[8px] text-slate-500">{b.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Mini Transition Table */}
        <div className="md:col-span-5 space-y-2 pt-2 md:pt-0">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pb-1 border-b border-[#23274A]">
            <span>Category</span>
            <span>Amount</span>
          </div>

          <div className="space-y-1.5">
            {transitionTable.map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-[#1F2449]/50 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-2 h-2 rounded-xs shrink-0 ${row.color}`} />
                  <span className="text-slate-300 truncate text-[11px]">{row.name}</span>
                </div>
                <span className="font-semibold text-slate-100 text-[11px] tabular-nums">
                  {row.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[#23274A] text-[11px] text-slate-400 flex items-center justify-between">
        <span>Old Regime (Slabs up to 30%)</span>
        <span className="text-emerald-400 font-bold">New Regime saves up to ₹1,12,500</span>
      </div>
    </div>
  );
};

export default RegimeTransitionCard;
