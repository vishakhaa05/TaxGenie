import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";
import { formatRupeesINR } from "@/features/gst/utils/money";

interface RadialDonutCardProps {
  total?: number;
  centerMetric?: string;
  isSample?: boolean;
}

export const RadialDonutCard: React.FC<RadialDonutCardProps> = ({
  total = 153215,
  centerMetric = "125.5",
  isSample = true,
}) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl p-6 bg-[#16192E] text-white border border-[#23274A] shadow-xl relative overflow-hidden flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#23274A]">
        <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-300">
          {t("dashboard.sales", "SALES / TAX RATIO")}
        </h3>
        <span className="text-xs font-semibold text-slate-400">Total Shares</span>
      </div>

      {/* Segmented Radial Donut SVG with Percentages */}
      <div className="relative my-auto py-4 flex flex-col items-center justify-center">
        <svg viewBox="0 0 240 240" className="w-56 h-56 drop-shadow-lg">
          {/* Slices created with stroke-dasharray on circumference (2 * PI * 80 = 502) */}
          {/* Slice 1: Rose/Pink (32.1% = ~160px) */}
          <circle
            cx="120"
            cy="120"
            r="80"
            fill="none"
            stroke="#F43F5E"
            strokeWidth="28"
            strokeDasharray="155 347"
            strokeDashoffset="125"
            className="transition-all duration-700"
          />

          {/* Slice 2: Yellow/Gold (8.0% = ~40px) */}
          <circle
            cx="120"
            cy="120"
            r="80"
            fill="none"
            stroke="#FBBF24"
            strokeWidth="28"
            strokeDasharray="36 466"
            strokeDashoffset="-35"
            className="transition-all duration-700"
          />

          {/* Slice 3: Teal (4.5% = ~22px) */}
          <circle
            cx="120"
            cy="120"
            r="80"
            fill="none"
            stroke="#14B8A6"
            strokeWidth="28"
            strokeDasharray="20 482"
            strokeDashoffset="-76"
            className="transition-all duration-700"
          />

          {/* Slice 4: Cyan (8.1% = ~40px) */}
          <circle
            cx="120"
            cy="120"
            r="80"
            fill="none"
            stroke="#06B6D4"
            strokeWidth="28"
            strokeDasharray="38 464"
            strokeDashoffset="-101"
            className="transition-all duration-700"
          />

          {/* Slice 5: Pink accent (3.2% = ~16px) */}
          <circle
            cx="120"
            cy="120"
            r="80"
            fill="none"
            stroke="#EC4899"
            strokeWidth="28"
            strokeDasharray="16 486"
            strokeDashoffset="-144"
            className="transition-all duration-700"
          />

          {/* Slice 6: Cyan/Blue (24.2% = ~120px) */}
          <circle
            cx="120"
            cy="120"
            r="80"
            fill="none"
            stroke="#0EA5E9"
            strokeWidth="28"
            strokeDasharray="115 387"
            strokeDashoffset="-165"
            className="transition-all duration-700"
          />

          {/* Slice 7: Indigo (12.0% = ~60px) */}
          <circle
            cx="120"
            cy="120"
            r="80"
            fill="none"
            stroke="#6366F1"
            strokeWidth="28"
            strokeDasharray="55 447"
            strokeDashoffset="-285"
            className="transition-all duration-700"
          />

          {/* Center Cutout */}
          <circle cx="120" cy="120" r="54" fill="#1B1E38" stroke="#2D3360" strokeWidth="2" />

          {/* SVG percentage labels positioned around donut */}
          <text x="32" y="70" fill="#F43F5E" fontSize="11" fontWeight="bold">32.1%</text>
          <text x="175" y="72" fill="#FBBF24" fontSize="11" fontWeight="bold">8%</text>
          <text x="202" y="105" fill="#14B8A6" fontSize="10" fontWeight="bold">4.5%</text>
          <text x="202" y="172" fill="#06B6D4" fontSize="10" fontWeight="bold">8.1%</text>
          <text x="180" y="212" fill="#EC4899" fontSize="10" fontWeight="bold">3.2%</text>
          <text x="95" y="218" fill="#0EA5E9" fontSize="11" fontWeight="bold">24.2%</text>
          <text x="25" y="145" fill="#6366F1" fontSize="11" fontWeight="bold">12%</text>
        </svg>

        {/* Center overlay currency and number */}
        <div className="absolute z-10 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-xl font-bold text-slate-100 flex items-center justify-center">
            <span className="text-base text-slate-400 mr-0.5">₹</span>
            <span>{centerMetric}</span>
          </span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
            Metric
          </span>
        </div>
      </div>

      {/* Bottom Summary Callout */}
      <div className="pt-4 border-t border-[#23274A] text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatRupeesINR(total)}
          </span>
          <span className="inline-flex items-center text-xs font-bold text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            <span>+74.5%</span>
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Combined Tax & GST Optimization Index
        </p>
      </div>
    </div>
  );
};

export default RadialDonutCard;
