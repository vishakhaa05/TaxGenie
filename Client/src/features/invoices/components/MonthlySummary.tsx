import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Download, FileSpreadsheet, AlertCircle, Info, RefreshCw } from "lucide-react";
import { getInvoiceMonthlySummary, getInvoiceCsvExportUrl } from "../api";
import { MonthlySummaryRow } from "../types";
import { toast } from "sonner";

export const MonthlySummary: React.FC = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<MonthlySummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getInvoiceMonthlySummary();
      if (res.success && res.data) {
        setRows(res.data);
      } else {
        setError(res.error || "Failed to load summary");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number = 0) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleExportCsv = () => {
    const url = getInvoiceCsvExportUrl();
    window.open(url, "_blank");
    toast.success(t("invoices.csvDownloadStarted", "CSV export downloading..."));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            {t("invoices.monthlySummaryTitle", "Monthly Tax & Invoicing Summary")}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("invoices.monthlySummaryDesc", "Aggregated figures of all issued and paid invoices by month.")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSummary}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {t("invoices.exportCsv", "Export CSV")}
          </button>
        </div>
      </div>

      {/* Statutory Disclaimer */}
      <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
        <p>
          {t(
            "invoices.monthlySummaryDisclaimer",
            "For your reference when preparing GSTR-1 and GSTR-3B filings; this is an analytical breakdown and not a statutory tax return."
          )}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
            <p>{t("common.loading", "Loading summary...")}</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-500 space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <p>{error}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {t("invoices.noSummaryData", "No issued or paid invoices found")}
            </p>
            <p>{t("invoices.noSummaryDesc", "Once you issue invoices, monthly aggregates will appear here.")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">{t("invoices.month", "Month")}</th>
                  <th className="p-3 text-center">{t("invoices.invoicesCount", "Invoices")}</th>
                  <th className="p-3 text-right">{t("invoices.taxableValue", "Taxable Value")}</th>
                  <th className="p-3 text-right">CGST</th>
                  <th className="p-3 text-right">SGST</th>
                  <th className="p-3 text-right">IGST</th>
                  <th className="p-3 text-right">{t("invoices.totalGst", "Total GST")}</th>
                  <th className="p-3 text-right">{t("invoices.grandTotal", "Grand Total")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{row.month}</td>
                    <td className="p-3 text-center">{row.invoiceCount}</td>
                    <td className="p-3 text-right">{formatCurrency(row.taxableValue)}</td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(row.cgst)}</td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(row.sgst)}</td>
                    <td className="p-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(row.igst)}</td>
                    <td className="p-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(row.totalGst)}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(row.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default MonthlySummary;
