import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { RegimeResult } from "../types";
import { formatINR } from "../utils/formatINR";
import { useTheme } from "@/context/theme-provider";
import { BarChart3, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonChartProps {
  newRegime: RegimeResult;
  oldRegime: RegimeResult;
  className?: string;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  newRegime,
  oldRegime,
  className = "",
}) => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [chartView, setChartView] = useState<"grouped" | "stacked">("grouped");

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "#334155" : "#E2E8F0";
  const textColor = isDark ? "#94A3B8" : "#64748B";
  const tooltipBg = isDark ? "#1E293B" : "#FFFFFF";
  const tooltipBorder = isDark ? "#334155" : "#E2E8F0";

  // Data for Recharts
  const chartData = [
    {
      name: t("incomeTax.result.newRegimeShort", "New Regime"),
      baseTax: newRegime.taxAfterRebate,
      cess: newRegime.cess,
      totalTax: newRegime.totalTax,
    },
    {
      name: t("incomeTax.result.oldRegimeShort", "Old Regime"),
      baseTax: oldRegime.taxAfterRebate,
      cess: oldRegime.cess,
      totalTax: oldRegime.totalTax,
    },
  ];

  const formatRupee = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  return (
    <div
      className={cn(
        "rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-4",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              {t("incomeTax.chart.title", "Tax Liability Comparison Chart")}
            </h3>
            <p className="text-[11px] text-slate-400">
              {t("incomeTax.chart.subtitle", "Visual comparison of New Regime vs Old Regime tax liability")}
            </p>
          </div>
        </div>

        {/* View mode toggle: Grouped vs Stacked */}
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => setChartView("grouped")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
              chartView === "grouped"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            {t("incomeTax.chart.totalTax", "Total Tax")}
          </button>
          <button
            type="button"
            onClick={() => setChartView("stacked")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
              chartView === "stacked"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            {t("incomeTax.chart.taxPlusCess", "Base Tax + Cess")}
          </button>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="w-full h-64 sm:h-72 pt-2" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: textColor, fontSize: 12, fontWeight: 600 }}
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
                      className="p-3.5 rounded-xl shadow-xl border text-xs space-y-1.5"
                    >
                      <p className="font-bold text-slate-900 dark:text-white border-b pb-1 mb-1 border-slate-100 dark:border-slate-800">
                        {label}
                      </p>
                      {payload.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.name}:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatINR(Number(item.value), { prefixSymbol: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
              formatter={(value) => (
                <span className="text-slate-600 dark:text-slate-400 font-medium">{value}</span>
              )}
            />

            {chartView === "grouped" ? (
              <Bar
                dataKey="totalTax"
                name={t("incomeTax.chart.totalTaxLabel", "Total Tax Payable")}
                fill="#6366F1"
                radius={[6, 6, 0, 0]}
                maxBarSize={55}
              />
            ) : (
              <>
                <Bar
                  dataKey="baseTax"
                  name={t("incomeTax.chart.baseTaxLabel", "Tax before Cess")}
                  stackId="a"
                  fill="#6366F1"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={55}
                />
                <Bar
                  dataKey="cess"
                  name={t("incomeTax.chart.cessLabel", "Cess (4%)")}
                  stackId="a"
                  fill="#38BDF8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={55}
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Screen Reader Accessible Data Table Alternative */}
      <div className="sr-only">
        <h4>Comparison Chart Data Table</h4>
        <table>
          <thead>
            <tr>
              <th>Regime</th>
              <th>Base Tax</th>
              <th>Cess</th>
              <th>Total Tax</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>New Regime</td>
              <td>{newRegime.taxAfterRebate}</td>
              <td>{newRegime.cess}</td>
              <td>{newRegime.totalTax}</td>
            </tr>
            <tr>
              <td>Old Regime</td>
              <td>{oldRegime.taxAfterRebate}</td>
              <td>{oldRegime.cess}</td>
              <td>{oldRegime.totalTax}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonChart;
