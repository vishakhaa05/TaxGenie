import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Download,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Printer,
  Calendar,
} from "lucide-react";
import PageLayout from "@/components/page-layout";
import {
  getInvoiceById,
  markInvoicePaid,
  markInvoiceUnpaid,
  cancelInvoice,
  duplicateInvoice,
  deleteInvoiceDraft,
  getInvoicePdfUrl,
} from "@/features/invoices/api";
import { Invoice } from "@/features/invoices/types";
import { StatusChip } from "@/features/invoices/components/StatusChip";
import { PaperPreview } from "@/features/invoices/components/PaperPreview";
import { toast } from "sonner";

export const InvoiceViewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (id) loadInvoice(id);
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const res = await getInvoiceById(invoiceId);
      if (res.success && res.data) {
        setInvoice(res.data);
      } else {
        toast.error(res.error || t("invoices.invoiceNotFound", "Invoice not found"));
      }
    } catch {
      toast.error(t("invoices.invoiceNotFound", "Invoice not found"));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!invoice) return;
    const url = getInvoicePdfUrl(invoice._id || invoice.id!);
    window.open(url, "_blank");
    toast.success(t("invoices.pdfDownloaded", "Invoice PDF downloading..."));
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;
    try {
      setActionLoading(true);
      const res = await markInvoicePaid(invoice._id || invoice.id!);
      if (res.success && res.data) {
        setInvoice(res.data);
        toast.success(t("invoices.markedPaidSuccess", "Invoice marked as paid"));
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkUnpaid = async () => {
    if (!invoice) return;
    try {
      setActionLoading(true);
      const res = await markInvoiceUnpaid(invoice._id || invoice.id!);
      if (res.success && res.data) {
        setInvoice(res.data);
        toast.success(t("invoices.markedUnpaidSuccess", "Invoice status reverted to issued"));
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!invoice) return;
    try {
      setActionLoading(true);
      const res = await cancelInvoice(invoice._id || invoice.id!);
      if (res.success && res.data) {
        setInvoice(res.data);
        setShowCancelModal(false);
        toast.success(t("invoices.invoiceCancelledSuccess", "Invoice cancelled"));
      }
    } catch {
      toast.error("Failed to cancel invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!invoice) return;
    try {
      setActionLoading(true);
      const res = await duplicateInvoice(invoice._id || invoice.id!);
      if (res.success && res.data) {
        toast.success(t("invoices.duplicatedSuccess", "New draft created"));
        navigate(`/invoices/${res.data._id || res.data.id}/edit`);
      }
    } catch {
      toast.error("Failed to duplicate invoice");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Loading Invoice..." addMarginTop>
        <div className="max-w-4xl mx-auto p-12 text-center text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
          <p>{t("common.loading", "Loading invoice...")}</p>
        </div>
      </PageLayout>
    );
  }

  if (!invoice) {
    return (
      <PageLayout title="Invoice Not Found" addMarginTop>
        <div className="max-w-md mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white">Invoice Not Found</h3>
          <p className="text-xs text-slate-500">
            The requested invoice does not exist or you do not have permission to view it.
          </p>
          <Link
            to="/invoices"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Invoices
          </Link>
        </div>
      </PageLayout>
    );
  }

  const isIssued = invoice.status === "issued";
  const isPaid = invoice.status === "paid";
  const isCancelled = invoice.status === "cancelled";
  const isDraft = invoice.status === "draft";

  return (
    <PageLayout
      title={invoice.invoiceNumber || t("invoices.draftInvoice", "Draft Invoice")}
      subtitle={`${invoice.documentType === "tax_invoice" ? "Tax Invoice" : "Bill of Supply"} • ${
        invoice.buyer.name
      }`}
      addMarginTop
      rightAction={
        <div className="flex items-center gap-2">
          <Link
            to="/invoices"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t("invoices.backToList", "Invoices")}</span>
          </Link>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t("invoices.downloadPdf", "Download PDF")}</span>
          </button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Status & Lifecycle Timeline Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <StatusChip status={invoice.status} isOverdue={invoice.isOverdue} size="md" />
            <div className="text-xs text-slate-500">
              {isPaid && invoice.paidAt && (
                <span>
                  {t("invoices.paidOn", "Paid on")}{" "}
                  {new Date(invoice.paidAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
              {isCancelled && invoice.cancelledAt && (
                <span>
                  {t("invoices.cancelledOn", "Cancelled on")}{" "}
                  {new Date(invoice.cancelledAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
              {isIssued && (
                <span>
                  {t("invoices.dueBy", "Due on")}{" "}
                  {new Date(invoice.dueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {isIssued && (
              <button
                type="button"
                onClick={handleMarkPaid}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("invoices.markPaid", "Mark as Paid")}
              </button>
            )}

            {isPaid && (
              <button
                type="button"
                onClick={handleMarkUnpaid}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t("invoices.markUnpaid", "Mark Unpaid")}
              </button>
            )}

            {isDraft && (
              <Link
                to={`/invoices/${invoice._id || invoice.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 cursor-pointer"
              >
                {t("common.edit", "Edit Draft")}
              </Link>
            )}

            <button
              type="button"
              onClick={handleDuplicate}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {t("invoices.duplicate", "Duplicate")}
            </button>

            {isIssued && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                {t("invoices.cancelInvoice", "Cancel")}
              </button>
            )}
          </div>
        </div>

        {/* Paper-Style Preview (Preserves Print Fidelity) */}
        <div className="shadow-lg rounded-2xl overflow-hidden">
          <PaperPreview
            documentType={invoice.documentType}
            invoiceNumber={invoice.invoiceNumber || "DRAFT"}
            invoiceDate={invoice.invoiceDate}
            dueDate={invoice.dueDate}
            seller={invoice.seller}
            buyer={invoice.buyer}
            items={invoice.items}
            engineResult={invoice.engineResult}
            notes={invoice.notes}
            terms={invoice.terms}
            paymentDetailsText={invoice.paymentDetailsText}
          />
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {t("invoices.cancelInvoiceTitle", "Cancel Invoice?")}
              </h4>
              <p className="text-xs text-slate-500">
                {t(
                  "invoices.cancelInvoiceNotice",
                  "Cancelled invoices retain their sequential number for audit compliance but are excluded from your dashboard revenue and GST totals."
                )}
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                {t("common.noKeep", "No, Keep Active")}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                {t("invoices.confirmCancel", "Yes, Cancel Invoice")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
export default InvoiceViewPage;
