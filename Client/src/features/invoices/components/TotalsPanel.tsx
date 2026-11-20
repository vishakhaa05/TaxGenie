import React from "react";
import { useTranslation } from "react-i18next";
import { Calculator, CheckCircle2, AlertCircle } from "lucide-react";
import { InvoiceEngineResult, InvoiceDocumentType } from "../types";

interface TotalsPanelProps {
  engineResult?: InvoiceEngineResult | null;
  loading?: boolean;
  error?: string | null;
  documentType: InvoiceDocumentType;
}

export const TotalsPanel: React.FC<TotalsPanelProps> = ({
  engineResult,
  loading = false,
  error = null,
  documentType,
}) => {
  const { t } = useTranslation();

  const isBillOfSupply = documentType === "bill_of_supply";

  const formatCurrency = (val: number = 0) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  if (error) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (loading && !engineResult) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-full"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-full"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
      </div>
    );
  }

  const subtotal = engineResult?.subtotal ?? 0;
  const cgst = engineResult?.totalCgst ?? 0;
  const sgst = engineResult?.totalSgst ?? 0;
  const igst = engineResult?.totalIgst ?? 0;
  const roundOff = engineResult?.roundOff ?? 0;
  const grandTotal = engineResult?.grandTotal ?? 0;
  const amountWords = engineResult?.amountInWords ?? "";
  const isInterState = engineResult?.supplyType === "inter";
  const taxSummary = engineResult?.taxSummary ?? [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
            {t("invoices.totalsBreakdown", "Summary & Totals")}
          </h3>
        </div>
        {loading && (
          <span className="text-[11px] text-indigo-500 font-medium animate-pulse">
            {t("common.calculating", "Calculating...")}
          </span>
        )}
      </div>

      {/* Tax Summary Table (Only for Tax Invoice) */}
      {!isBillOfSupply && taxSummary.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {t("invoices.taxSummary", "Tax Breakdown by Rate")}
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-medium">
                <tr>
                  <th className="p-2">Rate %</th>
                  <th className="p-2 text-right">Taxable</th>
                  {!isInterState ? (
                    <>
                      <th className="p-2 text-right">CGST</th>
                      <th className="p-2 text-right">SGST</th>
                    </>
                  ) : (
                    <th className="p-2 text-right">IGST</th>
                  )}
                  <th className="p-2 text-right">Total Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {taxSummary.map((ts) => (
                  <tr key={ts.rate} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-2 font-medium">{ts.rate}%</td>
                    <td className="p-2 text-right">{formatCurrency(ts.taxableAmount)}</td>
                    {!isInterState ? (
                      <>
                        <td className="p-2 text-right">{formatCurrency(ts.cgst)}</td>
                        <td className="p-2 text-right">{formatCurrency(ts.sgst)}</td>
                      </>
                    ) : (
                      <td className="p-2 text-right">{formatCurrency(ts.igst)}</td>
                    )}
                    <td className="p-2 text-right font-semibold">{formatCurrency(ts.totalGst)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Figures Breakdown */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>{t("invoices.subtotalTaxable", "Taxable Subtotal")}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(subtotal)}</span>
        </div>

        {!isBillOfSupply && (
          <>
            {!isInterState ? (
              <>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t("invoices.cgstTotal", "Central GST (CGST)")}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t("invoices.sgstTotal", "State GST (SGST)")}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t("invoices.igstTotal", "Integrated GST (IGST)")}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(igst)}</span>
              </div>
            )}
          </>
        )}

        {roundOff !== 0 && (
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>{t("invoices.roundOff", "Round-off Adjustment")}</span>
            <span>
              {roundOff > 0 ? `+${formatCurrency(roundOff)}` : `-${formatCurrency(Math.abs(roundOff))}`}
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {t("invoices.grandTotal", "Grand Total")}
          </span>
          <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(grandTotal)}
          </span>
        </div>
      </div>

      {/* Amount in words */}
      {amountWords && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-500 uppercase tracking-wide block text-[10px] mb-0.5">
            {t("invoices.amountInWords", "Amount in Words")}
          </span>
          <p className="font-medium italic leading-relaxed">{amountWords}</p>
        </div>
      )}
    </div>
  );
};
export default TotalsPanel;
