import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Bookmark,
  X,
  Loader2,
  Calendar,
  Receipt,
  Calculator,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/useAuth";
import { saveCalculationApi, CalculationItem } from "./api";
import { formatRupeesINR } from "@/features/gst/utils/money";

interface SaveDialogProps {
  open: boolean;
  onClose: () => void;
  type: "income_tax" | "gst";
  inputs: Record<string, any>;
  taxYear?: string;
  summaryInfo?: {
    grossIncome?: number;
    bestTax?: number;
    recommendedRegime?: string;
    amount?: number;
    rate?: number;
    gstAmount?: number;
  };
  onSaved?: (savedItem: CalculationItem) => void;
}

export const SaveDialog: React.FC<SaveDialogProps> = ({
  open,
  onClose,
  type,
  inputs,
  taxYear = "2026-27",
  summaryInfo,
  onSaved,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getDefaultName = () => {
    const today = new Date().toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
    if (type === "income_tax") {
      return `FY ${taxYear} Tax Plan - ${today}`;
    } else {
      const amtStr = summaryInfo?.amount ? formatRupeesINR(summaryInfo.amount) : "";
      const rateStr = summaryInfo?.rate !== undefined ? `${summaryInfo.rate}%` : "";
      return `GST ${amtStr} (${rateStr}) - ${today}`;
    }
  };

  const [name, setName] = useState(getDefaultName());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(getDefaultName());
    }
  }, [open, type, taxYear, summaryInfo]);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guest user flow: save to sessionStorage and prompt login
    if (!user) {
      try {
        sessionStorage.setItem(
          "taxgenie_pending_save",
          JSON.stringify({
            type,
            name: name.trim() || getDefaultName(),
            inputs,
            taxYear,
          })
        );
        toast.info(
          t(
            "calculations.guestPendingSaved",
            "Calculation draft saved! Please log in to permanently save it to your account."
          )
        );
        onClose();
        navigate("/login");
      } catch {
        toast.error(t("common.saveError", "Failed to preserve draft in storage"));
      }
      return;
    }

    setIsSaving(true);
    try {
      const response = await saveCalculationApi({
        type,
        inputs,
        name: name.trim() || getDefaultName(),
        taxYear,
      });

      toast.success(t("calculations.savedSuccess", "Calculation saved to your account!"));
      if (onSaved) {
        onSaved(response.data);
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || t("calculations.saveFailed", "Failed to save calculation"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <h3 id="save-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
              {t("calculations.saveTitle", "Save Calculation")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t("calculations.calculationName", "Calculation Name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="e.g. FY 2026-27 Final Tax Plan"
              required
              autoFocus
            />
          </div>

          {/* Snapshot Summary Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                {type === "income_tax" ? <Calculator className="w-3.5 h-3.5" /> : <Receipt className="w-3.5 h-3.5" />}
                <span>{type === "income_tax" ? "Income Tax" : "GST Calculation"}</span>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                FY {taxYear}
              </span>
            </div>

            {type === "income_tax" && summaryInfo?.grossIncome !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Gross Income:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatRupeesINR(summaryInfo.grossIncome)}
                </span>
              </div>
            )}

            {type === "income_tax" && summaryInfo?.bestTax !== undefined && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Best Tax Payable:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {formatRupeesINR(summaryInfo.bestTax)}
                </span>
              </div>
            )}

            {type === "gst" && summaryInfo?.gstAmount !== undefined && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Total GST Amount:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {formatRupeesINR(summaryInfo.gstAmount)}
                </span>
              </div>
            )}
          </div>

          {!user && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>
                {t(
                  "calculations.guestLoginNotice",
                  "You're not logged in. Saving will redirect you to sign in or create an account to preserve this calculation."
                )}
              </span>
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50 shadow-sm shadow-indigo-500/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t("common.saving", "Saving...")}</span>
                </>
              ) : (
                <span>{user ? t("common.save", "Save") : t("common.continueToLogin", "Continue to Login")}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveDialog;
