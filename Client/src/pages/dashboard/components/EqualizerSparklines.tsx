import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatRupeesINR } from "@/features/gst/utils/money";

interface EqualizerSparklinesProps {
  taxSaved?: number;
  effectiveRate?: number;
  gstAmount?: number;
  deductions?: number;
}

export const EqualizerSparklines: React.FC<EqualizerSparklinesProps> = ({
  taxSaved = 112500,
  effectiveRate = 12.5,
  gstAmount = 42800,
  deductions = 150000,
}) => {
  const { t } = useTranslation();

  const metrics = [
    {
      title: "Tax Saved",
      value: formatRupeesINR(taxSaved),
      badge: "+15%",
      isPositive: true,
      color: "bg-cyan-400",
      bars: [45, 70, 90, 60, 85],
    },
    {
      title: "Effective Rate",
      value: `${effectiveRate}%`,
      badge: "-2.4%",
      isPositive: true, // Lower effective tax rate is good
      color: "bg-teal-400",
      bars: [60, 85, 100, 75, 55],
    },
    {
      title: "GST Position",
      value: formatRupeesINR(gstAmount),
      badge: "+18%",
      isPositive: true,
      color: "bg-rose-500",
      bars: [30, 80, 50, 95, 70],
    },
    {
      title: "Deductions Used",
      value: formatRupeesINR(deductions),
      badge: "+10%",
      isPositive: true,
      color: "bg-amber-400",
      bars: [50, 65, 80, 70, 95],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-3xl bg-[#16192E] border border-[#23274A] shadow-xl text-white">
      {metrics.map((m) => (
        <div
          key={m.title}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1B1E38] border border-[#262B54] hover:border-indigo-500/30 transition-all group"
        >
          {/* Left Text */}
          <div className="space-y-1">
            <span className="block text-xs font-bold text-slate-300">{m.title}</span>
            <span className="block text-sm font-extrabold text-white">{m.value}</span>
            <div className="flex items-center gap-1 text-[11px] font-bold">
              {m.isPositive ? (
                <span className="text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                  <span>{m.badge}</span>
                </span>
              ) : (
                <span className="text-rose-400 flex items-center">
                  <ArrowDownRight className="w-3 h-3 stroke-[3]" />
                  <span>{m.badge}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: Glowing Equalizer Bars */}
          <div className="flex items-end gap-1.5 h-10 px-1">
            {m.bars.map((heightPct, idx) => (
              <div
                key={idx}
                style={{ height: `${heightPct}%` }}
                className={`w-1.5 rounded-full ${m.color} transition-all duration-300 group-hover:brightness-125 group-hover:scale-y-110 origin-bottom`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EqualizerSparklines;
