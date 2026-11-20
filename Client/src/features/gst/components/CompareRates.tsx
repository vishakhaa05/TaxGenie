import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, BarChart3, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GstMode } from "../types";
import { calculateGstApi } from "../api";
import { calculateLocalGst, formatRupeesINR } from "../utils/money";

interface CompareRatesProps {
  amount: number;
  currentRate: number;
  mode: GstMode;
  sellerState: string;
  buyerState: string;
  allowedRates?: number[];
  onSelectRate: (rate: number) => void;
  taxYear?: string;
}

interface CompareRow {
  rate: number;
  base: number;
  gstAmount: number;
  total: number;
  diff: number; // Difference in total vs current rate
}

export const CompareRates: React.FC<CompareRatesProps> = ({
  amount,
  currentRate,
  mode,
  sellerState,
  buyerState,
  allowedRates = [0, 5, 18, 40],
  onSelectRate,
  taxYear = "2026-27",
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch / compute only when section is opened and amount > 0
  useEffect(() => {
    if (!isOpen || amount <= 0) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    async function computeComparisons() {
      try {
        const comparisons = await Promise.all(
          allowedRates.map(async (r) => {
            try {
              const res = await calculateGstApi({
                amount,
                rate: r,
                mode,
                sellerState,
                buyerState,
                taxYear,
              });
              return {
                rate: r,
                base: res.base,
                gstAmount: res.gstAmount,
                total: res.total,
              };
            } catch {
              // Fallback to local computation
              const local = calculateLocalGst({
                amount,
                rate: r,
                mode,
                sellerState,
                buyerState,
              });
              return {
                rate: r,
                base: local.base,
                gstAmount: local.gstAmount,
                total: local.total,
              };
            }
          })
        );

        if (!isMounted) return;

        const currentTotal = comparisons.find((c) => c.rate === currentRate)?.total ?? amount;

        const tableRows: CompareRow[] = comparisons.map((c) => ({
          ...c,
          diff: Math.round((c.total - currentTotal) * 100) / 100,
        }));

        setRows(tableRows);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    computeComparisons();

    return () => {
      isMounted = false;
    };
  }, [isOpen, amount, currentRate, mode, sellerState, buyerState, allowedRates, taxYear]);

  if (amount <= 0) return null;

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/60 transition-all">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t("gst.compareRatesTitle", "Compare Rates (0%, 5%, 18%, 40%)")}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180 text-indigo-500"
          )}
        />
      </button>

      {isOpen && (
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {t(
              "gst.compareRatesSubtitle",
              "See how much the same amount costs across standard Indian GST slabs:"
            )}
          </p>

          {isLoading ? (
            <div className="space-y-2 py-4">
              <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                    <th className="pb-2">{t("gst.rate", "Rate")}</th>
                    <th className="pb-2">{t("gst.base", "Base")}</th>
                    <th className="pb-2">{t("gst.tax", "GST")}</th>
                    <th className="pb-2">{t("gst.total", "Total")}</th>
                    <th className="pb-2 text-right">{t("gst.action", "Action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {rows.map((row) => {
                    const isCurrent = row.rate === currentRate;
                    return (
                      <tr
                        key={row.rate}
                        className={cn(
                          "transition-colors",
                          isCurrent && "bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold"
                        )}
                      >
                        <td className="py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold tabular-nums",
                              row.rate === 18
                                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                                : row.rate === 5
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                : row.rate === 40
                                ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            )}
                          >
                            {row.rate}%
                          </span>
                        </td>
                        <td className="py-2.5 tabular-nums text-slate-700 dark:text-slate-300">
                          {formatRupeesINR(row.base)}
                        </td>
                        <td className="py-2.5 tabular-nums text-slate-700 dark:text-slate-300">
                          {formatRupeesINR(row.gstAmount)}
                        </td>
                        <td className="py-2.5 tabular-nums text-slate-900 dark:text-slate-100 font-bold">
                          {formatRupeesINR(row.total)}
                        </td>
                        <td className="py-2.5 text-right">
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                              <Check className="w-3.5 h-3.5" />
                              <span>{t("gst.active", "Active")}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSelectRate(row.rate)}
                              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                            >
                              {t("gst.apply", "Apply")}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompareRates;
