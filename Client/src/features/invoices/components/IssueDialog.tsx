import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Lock, CheckCircle2 } from "lucide-react";

interface IssueDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  nextNumberPreview?: string;
  documentType: "tax_invoice" | "bill_of_supply";
}

export const IssueDialog: React.FC<IssueDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  nextNumberPreview,
  documentType,
}) => {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              {t("invoices.issueInvoiceTitle", "Issue & Finalize Invoice?")}
            </h3>
            <p className="text-xs text-slate-500">
              {documentType === "tax_invoice"
                ? t("invoices.officialTaxInvoice", "Official GST Tax Invoice")
                : t("invoices.officialBillOfSupply", "Official Bill of Supply")}
            </p>
          </div>
        </div>

        <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl space-y-2 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="leading-relaxed">
              {t(
                "invoices.issueWarning",
                "Issuing will lock this invoice permanently. Once issued, it cannot be modified or deleted, preserving audit and tax compliance."
              )}
            </p>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-700 dark:text-amber-400">
            <li>
              {t("invoices.numberAssignedNotice", "A permanent sequential invoice number will be allocated.")}
              {nextNumberPreview && (
                <span className="font-bold ml-1">({nextNumberPreview})</span>
              )}
            </li>
            <li>{t("invoices.immutabilityNotice", "Buyer & Seller snapshots will be locked.")}</li>
            <li>{t("invoices.allowedActionsNotice", "Future actions allowed: Mark Paid, Duplicate, or Cancel.")}</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t("common.cancel", "Keep as Draft")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>{t("common.issuing", "Issuing...")}</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t("invoices.confirmIssue", "Issue Invoice")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default IssueDialog;
