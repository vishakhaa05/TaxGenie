import { useTranslation } from "react-i18next";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import InfoTooltip from "../ui/InfoTooltip";
import { useTheme } from "@/context/theme-provider";

export const IncomeDonutChartCard = () => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const tooltipBg = isDark ? "#1E293B" : "#FFFFFF";
  const tooltipBorder = isDark ? "#334155" : "#E2E8F0";

  const data = [
    { name: t("charts.incomeSources.salary"), value: 1080000, percentage: 72, color: "#6366F1" },
    { name: t("charts.incomeSources.business"), value: 225000, percentage: 15, color: "#38BDF8" },
    { name: t("charts.incomeSources.interest"), value: 120000, percentage: 8, color: "#10B981" },
    { name: t("charts.incomeSources.other"), value: 75000, percentage: 5, color: "#F59E0B" },
  ];

  const totalIncome = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs transition-all flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              {t("charts.incomeSources.caption")}
            </span>
            <InfoTooltip content={t("charts.incomeSources.tooltip")} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t("charts.incomeSources.title")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("charts.incomeSources.subtitle")}
          </p>
        </div>
      </div>

      {/* Donut Chart with center summary */}
      <div className="relative w-full h-52 flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={58}
              outerRadius={82}
              paddingAngle={4}
              dataKey="value"
              stroke={isDark ? "#1E293B" : "#FFFFFF"}
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div
                      style={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                      }}
                      className="p-2.5 rounded-xl shadow-xl border text-xs space-y-1"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                        ₹{item.value.toLocaleString("en-IN")} ({item.percentage}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Gross
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white">
            ₹{(totalIncome / 100000).toFixed(1)}L
          </span>
        </div>
      </div>

      {/* Legend list below */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-slate-600 dark:text-slate-300 truncate text-[11px] font-medium">
                {item.name}
              </p>
              <p className="text-slate-400 text-[10px]">
                {item.percentage}% (₹{(item.value / 1000).toFixed(0)}k)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomeDonutChartCard;
