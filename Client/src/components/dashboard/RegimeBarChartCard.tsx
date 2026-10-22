import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import InfoTooltip from "../ui/InfoTooltip";
import { useTheme } from "@/context/theme-provider";

interface RegimeBarChartCardProps {
  data?: { scenario: string; newRegime: number; oldRegime: number }[];
}

const defaultData = [
  { scenario: "₹8L", newRegime: 0, oldRegime: 36400 },
  { scenario: "₹10L", newRegime: 0, oldRegime: 75400 },
  { scenario: "₹12L", newRegime: 0, oldRegime: 119600 },
  { scenario: "₹15L", newRegime: 97500, oldRegime: 210600 },
  { scenario: "₹20L", newRegime: 212500, oldRegime: 366600 },
  { scenario: "₹25L", newRegime: 350000, oldRegime: 522600 },
];

export const RegimeBarChartCard = ({ data = defaultData }: RegimeBarChartCardProps) => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "#334155" : "#E2E8F0";
  const textColor = isDark ? "#94A3B8" : "#64748B";
  const tooltipBg = isDark ? "#1E293B" : "#FFFFFF";
  const tooltipBorder = isDark ? "#334155" : "#E2E8F0";

  const formatRupee = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs transition-all flex flex-col justify-between h-full">
      {/* Card Header matching 'Direct VS Indirect' in reference image */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase">
              Old vs New Regime
            </h3>
            <InfoTooltip content={t("charts.regimeComparison.tooltip")} />
          </div>
        </div>

        {/* Legend Row directly under title with bold numbers (matches reference image: ● $1.7K Direct  ○ $2.4K Indirect) */}
        <div className="mt-2 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              ₹97.5K
            </span>
            <span className="text-[11px] text-slate-400 font-medium">New Regime</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#38BDF8] bg-transparent" />
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              ₹210.6K
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Old Regime</span>
          </div>
        </div>
      </div>

      {/* Grouped Bar Chart with clean horizontal gridlines */}
      <div className="w-full h-60 sm:h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="scenario"
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
              cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
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
                        Income Level: {label}
                      </p>
                      <div className="flex items-center justify-between gap-4 text-[#6366F1]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                          New Regime:
                        </span>
                        <span className="font-bold">
                          ₹{Number(payload[0]?.value || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[#38BDF8]">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full border border-[#38BDF8]" />
                          Old Regime:
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
            <Bar
              dataKey="newRegime"
              name="New Regime"
              fill="#6366F1"
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
            />
            <Bar
              dataKey="oldRegime"
              name="Old Regime"
              fill="#38BDF8"
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RegimeBarChartCard;
