import React, { useState } from "react";
import { MoreHorizontal, ArrowUpRight, ArrowDownRight, Compass } from "lucide-react";
import InfoTooltip from "../ui/InfoTooltip";

interface KpiCardProps {
  title: string;
  caption: string;
  value: string;
  tooltip: string;
  badgeText: string;
  badgeType?: "positive" | "savings" | "neutral" | "warning";
  icon?: React.ElementType;
  sparklineData: number[];
  comparisonData?: number[];
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  caption,
  value,
  tooltip,
  badgeText,
  badgeType = "positive",
  icon: Icon = Compass,
  sparklineData,
  comparisonData,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // SVG dimensions for wide sparkline
  const width = 280;
  const height = 48;
  const padding = 6;

  const minVal = Math.min(...sparklineData, ...(comparisonData || []));
  const maxVal = Math.max(...sparklineData, ...(comparisonData || [])) || 1;

  const getY = (val: number) => {
    return height - padding - ((val - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);
  };

  const getPoints = (data: number[]) => {
    const step = (width - 2 * padding) / (data.length - 1);
    return data
      .map((val, idx) => `${padding + idx * step},${getY(val)}`)
      .join(" ");
  };

  const mainPoints = getPoints(sparklineData);
  const comparisonPoints = comparisonData ? getPoints(comparisonData) : null;

  const safeId = caption.replace(/[^a-zA-Z0-9]/g, "_");
  const strokeColor =
    badgeType === "savings"
      ? "#6366F1"
      : badgeType === "warning"
      ? "#F59E0B"
      : badgeType === "neutral"
      ? "#38BDF8"
      : "#6366F1";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      {/* Top Row: Icon + Title + Menu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h3>
        </div>

        {/* ... Context Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-36 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 z-30 text-xs">
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                View breakdown
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Caption Row */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          {caption}
        </span>
        <InfoTooltip content={tooltip} />
      </div>

      {/* Middle Row: Big Bold KPI Number + Colored Change Badge next to it */}
      <div className="mt-1 flex items-center gap-3">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>

        <span
          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[11px] ${
            badgeType === "warning"
              ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
              : badgeType === "neutral"
              ? "bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400"
              : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {badgeType === "warning" ? (
            <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
          ) : (
            <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
          )}
          <span>{badgeText}</span>
        </span>
      </div>

      {/* Bottom Area: Wide Wavy Sparkline across card width */}
      <div className="mt-4 pt-1 w-full h-12">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Faint dotted comparison baseline */}
          {comparisonPoints && (
            <polyline
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1.4"
              strokeDasharray="3,3"
              opacity="0.4"
              points={comparisonPoints}
            />
          )}

          {/* Main wavy series line */}
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={mainPoints}
          />
        </svg>
      </div>
    </div>
  );
};

export default KpiCard;
