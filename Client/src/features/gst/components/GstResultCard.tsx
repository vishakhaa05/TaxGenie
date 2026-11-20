import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  Check,
  FileText,
  AlertTriangle,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  Info,
  Sparkles,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GstMode, GstResult, RecentCalculationItem } from "../types";
import { formatRupeesINR } from "../utils/money";
import GstSplitBar from "./GstSplitBar";
import CompareRates from "./CompareRates";
import RecentCalculations from "./RecentCalculations";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { SaveDialog } from "@/features/calculations/SaveDialog";


interface GstResultCardProps {
  result: GstResult | null;
  isLoading: boolean;
  error: { message: string; code?: string; details?: any } | null;
  mode: GstMode;
  amount: number;
  rate: number;
  sellerState: string;
  buyerState: string;
  onRetry: () => void;
  onFillExample: () => void;
  history: RecentCalculationItem[];
  onUseAgain: (item: RecentCalculationItem) => void;
  onClearHistory: () => void;
  onSelectRate: (newRate: number) => void;
  allowedRates?: number[];
}

export const GstResultCard: React.FC<GstResultCardProps> = ({
  result,
  isLoading,
  error,
  mode,
  amount,
  rate,
  sellerState,
  buyerState,
  onRetry,
  onFillExample,
  history,
  onUseAgain,
  onClearHistory,
  onSelectRate,
  allowedRates = [0, 5, 18, 40],
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showHowCalculated, setShowHowCalculated] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Copy plain text summary in current language
  const handleCopyResult = () => {
    if (!result) return;

    const summaryText = [
      `=== ${t("gst.taxSummaryTitle", "TaxGenie GST Computation")} ===`,
      `${t("gst.mode", "Mode")}: ${mode === "add" ? t("gst.addGst", "Add GST (Exclusive)") : t("gst.removeGst", "Remove GST (Inclusive)")}`,
      `${t("gst.inputAmount", "Input Amount")}: ${formatRupeesINR(amount)}`,
      `${t("gst.rate", "GST Rate")}: ${result.rate}%`,
      `${t("gst.basePrice", "Base Price")}: ${formatRupeesINR(result.base)}`,
      result.supplyType === "intra"
        ? `CGST (${result.rate / 2}%): ${formatRupeesINR(result.cgst)}\nSGST (${result.rate / 2}%): ${formatRupeesINR(result.sgst)}`
        : `IGST (${result.rate}%): ${formatRupeesINR(result.igst)}`,
      `${t("gst.totalGst", "Total GST")}: ${formatRupeesINR(result.gstAmount)}`,
      `${t("gst.finalTotal", "Final Total")}: ${formatRupeesINR(result.total)}`,
      result.amountInWords ? `(${result.amountInWords})` : "",
      `\n${t("common.disclaimer", "Estimates only. Please confirm rates on gst.gov.in or with a CA.")}`,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Error State
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
              {t("gst.errorTitle", "Calculation Error")}
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
              {error.message || t("gst.errorDefault", "Unable to compute GST with the provided inputs.")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t("gst.retry", "Retry Calculation")}</span>
        </button>

        {history.length > 0 && (
          <RecentCalculations
            items={history}
            onUseAgain={onUseAgain}
            onClear={onClearHistory}
          />
        )}
      </div>
    );
  }

  // 2. Loading Skeleton State
  if (isLoading && !result) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="space-y-3 pt-2">
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="flex gap-3 pt-2">
          <div className="h-10 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  // 3. Empty State before user types
  if (!result || amount <= 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="space-y-1.5 max-w-sm mx-auto">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {t("gst.emptyStateTitle", "Ready to calculate")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              "gst.emptyStateDesc",
              "Enter any amount on the left to see the instant base price, CGST/SGST/IGST breakdown, and final total."
            )}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onFillExample}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <span>{t("gst.tryExample", "Try ₹50,000 at 18%")}</span>
          </button>
        </div>

        {history.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
            <RecentCalculations
              items={history}
              onUseAgain={onUseAgain}
              onClear={onClearHistory}
            />
          </div>
        )}
      </div>
    );
  }

  // 4. Result Card Live State
  const isIntra = result.supplyType === "intra";
  const halfRate = result.rate / 2;

  const totalCardLabel =
    mode === "add"
      ? t("gst.totalWithGst", "Total with GST")
      : t("gst.priceBeforeGst", "Price before GST");

  const totalCardValue = mode === "add" ? result.total : result.base;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={t("gst.resultCardTitle", "GST Calculation Summary")}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-5 transition-all"
    >
      {/* Top Header: Badge and Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {totalCardLabel}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums tracking-tight mt-0.5">
            {formatRupeesINR(totalCardValue)}
          </div>
          {result.amountInWords && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic mt-1 leading-tight">
              {result.amountInWords}
            </p>
          )}
        </div>

        {/* Supply Type Badge */}
        <div className="self-start sm:self-center">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs",
              isIntra
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isIntra ? "bg-emerald-500" : "bg-sky-500"
              )}
            />
            <span>
              {isIntra
                ? t("gst.badgeIntra", "Same state (CGST + SGST)")
                : t("gst.badgeInter", "Different state (IGST)")}
            </span>
          </span>
        </div>
      </div>

      {/* Visual Composition Bar */}
      <GstSplitBar
        base={result.base}
        gstAmount={result.gstAmount}
        total={result.total}
      />

      {/* Itemized Table Breakdown */}
      <div className="space-y-2.5 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-slate-800/80">
        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-600 dark:text-slate-400">
            {t("gst.basePrice", "Base price")}
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatRupeesINR(result.base)}
          </span>
        </div>

        {isIntra ? (
          <>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <span>
                  {t("gst.cgstLabel", "CGST")} ({halfRate}%)
                </span>
                <InfoTooltip
                  content={t(
                    "gst.cgstTooltip",
                    "Central GST goes to the central government."
                  )}
                  size={13}
                />
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {formatRupeesINR(result.cgst)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <span>
                  {t("gst.sgstLabel", "SGST")} ({halfRate}%)
                </span>
                <InfoTooltip
                  content={t(
                    "gst.sgstTooltip",
                    "State GST goes to your state government."
                  )}
                  size={13}
                />
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {formatRupeesINR(result.sgst)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span>
                {t("gst.igstLabel", "IGST")} ({result.rate}%)
              </span>
              <InfoTooltip
                content={t(
                  "gst.igstTooltip",
                  "Integrated GST applies when buyer and seller are in different states."
                )}
                size={13}
              />
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatRupeesINR(result.igst)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 text-indigo-600 dark:text-indigo-400 font-semibold">
          <span>{t("gst.totalGst", "Total GST")}</span>
          <span className="tabular-nums font-bold">
            {formatRupeesINR(result.gstAmount)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2.5 text-sm sm:text-base font-bold text-slate-900 dark:text-slate-50">
          <span>{t("gst.finalTotal", "Final total")}</span>
          <span className="tabular-nums text-indigo-600 dark:text-indigo-400">
            {formatRupeesINR(result.total)}
          </span>
        </div>
      </div>

      {/* Expandable Section: How we calculated this */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/60">
        <button
          type="button"
          onClick={() => setShowHowCalculated((prev) => !prev)}
          aria-expanded={showHowCalculated}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t("gst.howCalculatedTitle", "How we calculated this")}</span>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-200",
              showHowCalculated && "rotate-180 text-indigo-500"
            )}
          />
        </button>

        {showHowCalculated && (
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
            {mode === "add" ? (
              <>
                <p>
                  <strong>1. {t("gst.stepBase", "Base Amount")}:</strong>{" "}
                  {formatRupeesINR(amount)}
                </p>
                <p>
                  <strong>2. {t("gst.stepRate", "Rate Applied")}:</strong> {result.rate}%
                </p>
                <p>
                  <strong>3. {t("gst.stepFormula", "Formula")}:</strong>{" "}
                  <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">
                    Base × (Rate ÷ 100) = Total GST
                  </code>
                </p>
                <p>
                  <strong>4. {t("gst.stepTotal", "Total")}:</strong>{" "}
                  {formatRupeesINR(result.base)} + {formatRupeesINR(result.gstAmount)} ={" "}
                  {formatRupeesINR(result.total)}
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>1. {t("gst.stepInclusive", "Inclusive Amount")}:</strong>{" "}
                  {formatRupeesINR(amount)}
                </p>
                <p>
                  <strong>2. {t("gst.stepFormula", "Formula in simple words")}:</strong>{" "}
                  <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">
                    Price ÷ (1 + Rate) = Base Price
                  </code>
                </p>
                <p>
                  <strong>3. {t("gst.stepBaseComputed", "Computed Base")}:</strong>{" "}
                  <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">
                    {formatRupeesINR(amount)} × 100 ÷ (100 + {result.rate}) ={" "}
                    {formatRupeesINR(result.base)}
                  </code>
                </p>
                <p>
                  <strong>4. {t("gst.stepExtracted", "GST Extracted")}:</strong>{" "}
                  {formatRupeesINR(amount)} - {formatRupeesINR(result.base)} ={" "}
                  {formatRupeesINR(result.gstAmount)}
                </p>
              </>
            )}
            <p className="text-[11px] text-slate-400 pt-1">
              {isIntra
                ? t(
                    "gst.stepIntra",
                    "Supplier and buyer are in the same state, so GST is divided equally into CGST (50%) and SGST (50%)."
                  )
                : t(
                    "gst.stepInter",
                    "Supplier and buyer are in different states, so full GST is applied as Integrated GST (IGST)."
                  )}
            </p>
          </div>
        )}
      </div>

      {/* Compare Rates Section */}
      <CompareRates
        amount={amount}
        currentRate={result.rate}
        mode={mode}
        sellerState={sellerState}
        buyerState={buyerState}
        allowedRates={allowedRates}
        onSelectRate={onSelectRate}
      />

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => setShowSaveDialog(true)}
          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <Bookmark className="w-4 h-4 text-indigo-500" />
          <span>{t("gst.saveCalculation", "Save Calculation")}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyResult}
          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{t("gst.copied", "Copied!")}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-400" />
              <span>{t("gst.copyResult", "Copy Result")}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem(
                "taxgenie_invoice_prefill",
                JSON.stringify({
                  amount,
                  rate,
                  mode,
                  sellerState,
                  buyerState,
                })
              );
            } catch {
              // ignore
            }
            navigate("/invoices/new?from=gst");
          }}
          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs active:scale-95 sm:col-span-1"
        >
          <FileText className="w-4 h-4" />
          <span>{t("gst.createInvoiceWithAmount", "Create invoice with this amount")}</span>
        </button>
      </div>

      {/* Save Dialog */}
      <SaveDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        type="gst"
        inputs={{
          amount,
          rate,
          mode,
          sellerState,
          buyerState,
        }}
        taxYear="2026-27"
        summaryInfo={{
          amount,
          rate,
          gstAmount: result.gstAmount,
        }}
      />


      {/* Disclaimer */}
      <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
        {t("gst.disclaimer", "Estimates only. Please confirm rates on gst.gov.in or with a CA.")}
      </p>

      {/* Session History */}
      {history.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <RecentCalculations
            items={history}
            onUseAgain={onUseAgain}
            onClear={onClearHistory}
          />
        </div>
      )}
    </div>
  );
};

export default GstResultCard;
