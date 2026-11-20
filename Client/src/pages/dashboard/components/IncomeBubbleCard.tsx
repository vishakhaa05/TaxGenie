import React from "react";
import { useTranslation } from "react-i18next";
import { formatRupeesINR } from "@/features/gst/utils/money";

interface IncomeBubbleCardProps {
  salary?: number;
  business?: number;
  other?: number;
  capitalGains?: number;
}

export const IncomeBubbleCard: React.FC<IncomeBubbleCardProps> = ({
  salary = 1250000,
  business = 150000,
  other = 80000,
  capitalGains = 120000,
}) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl p-6 bg-[#16192E] text-white border border-[#23274A] shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#23274A]">
        <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-300">
          {t("dashboard.finance", "FINANCE & INCOME SOURCES")}
        </h3>
        <span className="text-[11px] text-slate-400">Distribution</span>
      </div>

      {/* Cluster of Overlapping Circular Bubbles */}
      <div className="relative h-56 flex items-center justify-center my-auto py-2">
        {/* Center hub */}
        <div className="absolute z-20 w-16 h-16 rounded-full bg-[#1B1E38] border-2 border-slate-600/60 shadow-lg flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase">Gross</span>
          <span className="text-xs font-extrabold text-white">16.0L</span>
        </div>

        {/* Bubble 1: Top (Muted Slate/Purple) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-slate-700/60 border border-slate-500/40 backdrop-blur-xs flex flex-col items-center justify-center text-center shadow-md animate-pulse">
          <span className="text-[9px] text-slate-300">Other</span>
          <span className="text-[11px] font-bold text-white">10.2L</span>
        </div>

        {/* Bubble 2: Left (Pink/Rose) */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-rose-500/70 border border-rose-400/50 backdrop-blur-xs flex flex-col items-center justify-center text-center shadow-lg">
          <span className="text-[10px] text-rose-100 font-medium">Salary</span>
          <span className="text-xs font-bold text-white">12.57L</span>
        </div>

        {/* Bubble 3: Right (Teal/Green) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-teal-500/70 border border-teal-400/50 backdrop-blur-xs flex flex-col items-center justify-center text-center shadow-lg">
          <span className="text-[10px] text-teal-100 font-medium">Business</span>
          <span className="text-xs font-bold text-white">15.2L</span>
        </div>

        {/* Bubble 4: Bottom-Left (Cyan) */}
        <div className="absolute bottom-2 left-14 w-20 h-20 rounded-full bg-cyan-500/60 border border-cyan-400/40 backdrop-blur-xs flex flex-col items-center justify-center text-center shadow-md">
          <span className="text-[9px] text-cyan-100">80C</span>
          <span className="text-[11px] font-bold text-white">1.5L</span>
        </div>

        {/* Bubble 5: Bottom-Right (Indigo) */}
        <div className="absolute bottom-1 right-14 w-22 h-22 rounded-full bg-indigo-600/60 border border-indigo-400/40 backdrop-blur-xs flex flex-col items-center justify-center text-center shadow-md">
          <span className="text-[9px] text-indigo-100">Cap. Gains</span>
          <span className="text-[11px] font-bold text-white">12.5L</span>
        </div>
      </div>

      {/* Legend Dots */}
      <div className="flex items-center justify-center gap-4 pt-3 border-t border-[#23274A] text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Salary</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span>Deductions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          <span>Investments</span>
        </div>
      </div>
    </div>
  );
};

export default IncomeBubbleCard;
