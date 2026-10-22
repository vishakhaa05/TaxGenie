import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ArrowDownRight } from "lucide-react";
import InfoTooltip from "../ui/InfoTooltip";
import { useTheme } from "@/context/theme-provider";

const defaultTrendData = [
  { month: "Apr", currentFY: 8120, previousFY: 9900 },
  { month: "May", currentFY: 8120, previousFY: 9900 },
  { month: "Jun", currentFY: 8120, previousFY: 9900 },
  { month: "Jul", currentFY: 7500, previousFY: 9600 },
  { month: "Aug", currentFY: 7500, previousFY: 9600 },
  { month: "Sep", currentFY: 7500, previousFY: 9600 },
  { month: "Oct", currentFY: 6800, previousFY: 9200 },
  { month: "Nov", currentFY: 6800, previousFY: 9200 },
  { month: "Dec", currentFY: 6800, previousFY: 9200 },
  { month: "Jan", currentFY: 6500, previousFY: 8900 },
  { month: "Feb", currentFY: 6500, previousFY: 8900 },
  { month: "Mar", currentFY: 6500, previousFY: 8900 },
];

export const TaxLineChartCard = () => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "#334155" : "#E2E8F0";
  const textColor = isDark ? "#94A3B8" : "#64748B";
  const tooltipBg = isDark ? "#1E293B" : "#FFFFFF";
  const tooltipBorder = isDark ? "#334155" : "#E2E8F0";

  const formatRupee = (val: number) => `₹${(val / 1000).toFixed(0)}k`;

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs transition-all flex flex-col justify-between h-full">
      {/* Header matching 'AVG Order Value' in reference image */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase">
              Average Monthly Tax
            </h3>
            <InfoTooltip content={t("charts.taxOverTime.tooltip")} />
          </div>

          {/* Top-right legend: ● Current  ○ Previous */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Current
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-[#38BDF8]" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Previous
              </span>
            </div>
          </div>
        </div>

        {/* Large stat + change badge (matches reference image: $72  +34%) */}
        <div className="mt-2 flex items-center gap-2.5">
          <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            ₹8,125
          </div>
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
            <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
            <span>-18%</span>
          </span>
        </div>
      </div>

      {/* Dual Wavy Line Chart */}
      <div className="w-full h-60 sm:h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={defaultTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: textColor, fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatRupee}
              tick={{ fill: textColor, fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      style={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                      }}
                      className="p-3 rounded-xl shadow-xl border text-xs space-y-1.5"
                    >
                      <p className="font-bold text-slate-900 dark:text-white border-b pb-1 mb-1 border-slate-100 dark:border-slate-800">
                        Month: {label}
                      </p>
                      <div className="flex items-center justify-between gap-4 text-[#6366F1]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                          Current FY:
                        </span>
                        <span className="font-bold">
                          ₹{Number(payload[0]?.value || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[#38BDF8]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full border border-[#38BDF8]" />
                          Previous FY:
                        </span>
                        <span className="font-bold">
                          ₹{Number(payload[1]?.value || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="currentFY"
              stroke="#6366F1"
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4, stroke: "#6366F1", strokeWidth: 2, fill: "#FFFFFF" }}
            />
            <Line
              type="monotone"
              dataKey="previousFY"
              stroke="#38BDF8"
              strokeWidth={1.8}
              strokeDasharray="3 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TaxLineChartCard;
