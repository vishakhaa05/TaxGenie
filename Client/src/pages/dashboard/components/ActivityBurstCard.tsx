import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Activity } from "lucide-react";

interface ActivityBurstCardProps {
  activityCount?: number;
  totalSavedTax?: number;
}

export const ActivityBurstCard: React.FC<ActivityBurstCardProps> = ({
  activityCount = 12,
  totalSavedTax = 32500,
}) => {
  const { t } = useTranslation();

  // Generate 32 radiating bar rays around the circle
  const rayCount = 32;
  const colors = [
    "#06B6D4", // cyan
    "#3B82F6", // blue
    "#6366F1", // indigo
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#F43F5E", // rose
    "#F59E0B", // amber
    "#10B981", // emerald
    "#14B8A6", // teal
  ];

  return (
    <div className="rounded-3xl p-6 bg-[#16192E] text-white border border-[#23274A] shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#23274A]">
        <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-300">
          {t("dashboard.activity", "ACTIVITY & STATUTORY CHECKS")}
        </h3>
        <Activity className="w-4 h-4 text-cyan-400" />
      </div>

      {/* Sunburst Radial Ray Chart */}
      <div className="relative h-56 flex items-center justify-center my-auto py-2">
        <svg viewBox="0 0 200 200" className="w-48 h-48">
          {/* 32 radiating rays */}
          {Array.from({ length: rayCount }).map((_, i) => {
            const angle = (i * 360) / rayCount;
            const rad = (angle * Math.PI) / 180;
            const innerRadius = 42;
            // Varied ray lengths to mimic equalizer activity
            const rayLengths = [22, 28, 35, 20, 32, 26, 38, 24, 30, 22, 36, 28, 34, 25, 30, 38];
            const rayLen = rayLengths[i % rayLengths.length];
            const outerRadius = innerRadius + rayLen;

            const x1 = 100 + innerRadius * Math.cos(rad);
            const y1 = 100 + innerRadius * Math.sin(rad);
            const x2 = 100 + outerRadius * Math.cos(rad);
            const y2 = 100 + outerRadius * Math.sin(rad);

            const color = colors[i % colors.length];

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth="3.2"
                strokeLinecap="round"
                className="opacity-80 hover:opacity-100 transition-opacity"
              />
            );
          })}

          {/* Center Circular Disc */}
          <circle cx="100" cy="100" r="36" fill="#1B1E38" stroke="#2D3360" strokeWidth="2.5" />
        </svg>

        {/* Center Overlay Metric */}
        <div className="absolute z-10 text-center flex flex-col items-center justify-center pointer-events-none">
          <span className="text-base font-extrabold text-white tracking-tight">32.5 K</span>
          <span className="inline-flex items-center text-[10px] font-bold text-emerald-400">
            <ArrowUpRight className="w-3 h-3 stroke-[3]" />
            <span>+9%</span>
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-[#23274A] text-[11px] text-slate-400 text-center">
        {activityCount} calculations & optimizations verified for statutory accuracy
      </div>
    </div>
  );
};

export default ActivityBurstCard;
