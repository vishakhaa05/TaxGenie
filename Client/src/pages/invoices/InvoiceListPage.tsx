import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import PageLayout from "@/components/page-layout";
import {
  getInvoices,
  markInvoicePaid,
  markInvoiceUnpaid,
  cancelInvoice,
  duplicateInvoice,
  deleteInvoiceDraft,
  getInvoicePdfUrl,
  getInvoiceCsvExportUrl,
} from "@/features/invoices/api";
import { Invoice, InvoiceStatus } from "@/features/invoices/types";
import { StatusChip } from "@/features/invoices/components/StatusChip";
import { MonthlySummary } from "@/features/invoices/components/MonthlySummary";
import { toast } from "sonner";

export const InvoiceListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Tab: "invoices" | "summary"
  const [activeTab, setActiveTab] = useState<"invoices" | "summary">("invoices");

  // Invoices & Filters
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals for confirmation
  const [cancelCandidate, setCancelCandidate] = useState<Invoice | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Invoice | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, page]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await getInvoices({
        status: statusFilter ? (statusFilter as InvoiceStatus) : undefined,
        q: searchQuery || undefined,
        page,
        limit: 15,
      });
      if (res.success && res.data) {
        setInvoices(res.data.invoices);
        setTotalCount(res.data.total);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      toast.error(t("invoices.failedToLoadInvoices", "Failed to load invoices"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadInvoices();
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    let outstandingAmount = 0;
    let overdueCount = 0;
    let paidThisMonthAmount = 0;
    let draftsCount = 0;

    invoices.forEach((inv) => {
      const grandTotal = inv.engineResult?.grandTotal || 0;
      if (inv.status === "issued") {
        outstandingAmount += grandTotal;
        if (inv.isOverdue || (inv.dueDate && new Date(inv.dueDate) < now)) {
          overdueCount++;
        }
      } else if (inv.status === "paid") {
        if (inv.invoiceDate && inv.invoiceDate.startsWith(currentMonthKey)) {
          paidThisMonthAmount += grandTotal;
        }
      } else if (inv.status === "draft") {
        draftsCount++;
      }
    });

    return {
      outstandingAmount,
      overdueCount,
      paidThisMonthAmount,
      draftsCount,
    };
  }, [invoices]);

  const formatCurrency = (val: number = 0) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Row Actions
  const handleMarkPaid = async (inv: Invoice) => {
    try {
      setActionLoading(true);
      const res = await markInvoicePaid(inv._id || inv.id!);
      if (res.success && res.data) {
        toast.success(t("invoices.markedPaidSuccess", "Invoice marked as paid"));
        setInvoices((prev) => prev.map((item) => ((item._id || item.id) === (inv._id || inv.id) ? res.data : item)));
      }
    } catch {
      toast.error("Failed to mark invoice as paid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkUnpaid = async (inv: Invoice) => {
    try {
      setActionLoading(true);
      const res = await markInvoiceUnpaid(inv._id || inv.id!);
      if (res.success && res.data) {
        toast.success(t("invoices.markedUnpaidSuccess", "Status reverted to issued"));
        setInvoices((prev) => prev.map((item) => ((item._id || item.id) === (inv._id || inv.id) ? res.data : item)));
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelCandidate) return;
    try {
      setActionLoading(true);
      const res = await cancelInvoice(cancelCandidate._id || cancelCandidate.id!);
      if (res.success && res.data) {
        toast.success(t("invoices.invoiceCancelledSuccess", "Invoice cancelled"));
        setInvoices((prev) =>
          prev.map((item) => ((item._id || item.id) === (cancelCandidate._id || cancelCandidate.id) ? res.data : item))
        );
        setCancelCandidate(null);
      }
    } catch {
      toast.error("Failed to cancel invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async (inv: Invoice) => {
    try {
      setActionLoading(true);
      const res = await duplicateInvoice(inv._id || inv.id!);
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

  const handleDeleteDraft = async () => {
    if (!deleteCandidate) return;
    try {
      setActionLoading(true);
      const res = await deleteInvoiceDraft(deleteCandidate._id || deleteCandidate.id!);
      if (res.success) {
        toast.success(t("invoices.draftDeleted", "Draft removed"));
        setInvoices((prev) => prev.filter((item) => (item._id || item.id) !== (deleteCandidate._id || deleteCandidate.id)));
        setDeleteCandidate(null);
      }
    } catch {
      toast.error("Failed to delete draft");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageLayout
      title={t("invoices.invoicesTitle", "GST Invoices")}
      subtitle={t("invoices.invoicesSubtitle", "Manage, track, download, and reconcile all your business invoices.")}
      addMarginTop
      rightAction={
        <div className="flex items-center gap-2">
          <Link
            to="/invoices/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("invoices.createInvoice", "New Invoice")}</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Outstanding Amount */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {t("invoices.outstandingAmount", "Outstanding")}
            </span>
            <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(kpis.outstandingAmount)}
            </p>
            <p className="text-[11px] text-slate-400">{t("invoices.issuedPendingPayment", "Issued & pending")}</p>
          </div>

          {/* Overdue Count */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {t("invoices.overdueCount", "Overdue")}
            </span>
            <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">{kpis.overdueCount}</p>
            <p className="text-[11px] text-slate-400">{t("invoices.pastDueDate", "Past due date")}</p>
          </div>

          {/* Paid This Month */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {t("invoices.paidThisMonth", "Paid This Month")}
            </span>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(kpis.paidThisMonthAmount)}
            </p>
            <p className="text-[11px] text-slate-400">{t("invoices.settledRevenue", "Collected revenue")}</p>
          </div>

          {/* Drafts */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              {t("invoices.drafts", "Drafts")}
            </span>
            <p className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300">{kpis.draftsCount}</p>
            <p className="text-[11px] text-slate-400">{t("invoices.editableDrafts", "Unissued drafts")}</p>
          </div>
        </div>

        {/* Tab Switcher: Invoices vs Monthly Summary */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === "invoices"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span>{t("invoices.allInvoices", "All Invoices")}</span>
            {activeTab === "invoices" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === "summary"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span>{t("invoices.monthlyTaxSummary", "Monthly Tax Summary")}</span>
            {activeTab === "summary" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 2: Monthly Summary */}
        {activeTab === "summary" ? (
          <MonthlySummary />
        ) : (
          /* Tab 1: Invoices Table with Filters & Search */
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={t("invoices.searchPlaceholder", "Search by customer or invoice number...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </form>

              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-hidden cursor-pointer"
                >
                  <option value="">{t("invoices.allStatuses", "All Statuses")}</option>
                  <option value="draft">{t("invoices.draft", "Draft")}</option>
                  <option value="issued">{t("invoices.issued", "Issued")}</option>
                  <option value="paid">{t("invoices.paid", "Paid")}</option>
                  <option value="cancelled">{t("invoices.cancelled", "Cancelled")}</option>
                </select>

                <a
                  href={getInvoiceCsvExportUrl(statusFilter as InvoiceStatus)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">{t("invoices.exportCsv", "CSV")}</span>
                </a>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <Clock className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                  <p>{t("common.loading", "Loading invoices...")}</p>
                </div>
              ) : invoices.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    {t("invoices.noInvoicesFound", "No invoices found")}
                  </h3>
                  <p className="max-w-xs mx-auto">
                    {statusFilter || searchQuery
                      ? t("invoices.noMatchingFilters", "No invoices match your selected filters.")
                      : t("invoices.createFirstInvoicePrompt", "Create your first professional GST invoice in minutes.")}
                  </p>
                  <Link
                    to="/invoices/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t("invoices.createInvoice", "Create Invoice")}</span>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                      <tr>
                        <th className="p-3.5">{t("invoices.invoiceNumber", "Number")}</th>
                        <th className="p-3.5">{t("invoices.customer", "Customer")}</th>
                        <th className="p-3.5">{t("invoices.date", "Date")}</th>
                        <th className="p-3.5">{t("invoices.dueDate", "Due Date")}</th>
                        <th className="p-3.5 text-right">{t("invoices.total", "Total")}</th>
                        <th className="p-3.5 text-center">{t("invoices.status", "Status")}</th>
                        <th className="p-3.5 text-right">{t("common.actions", "Actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {invoices.map((inv) => (
                        <tr key={inv._id || inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          {/* Number & Document Type */}
                          <td className="p-3.5">
                            <Link
                              to={`/invoices/${inv._id || inv.id}`}
                              className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              {inv.invoiceNumber || t("invoices.draft", "Draft")}
                            </Link>
                            <span className="block text-[10px] text-slate-400 uppercase mt-0.5">
                              {inv.documentType === "tax_invoice" ? "Tax Invoice" : "Bill of Supply"}
                            </span>
                          </td>

                          {/* Customer */}
                          <td className="p-3.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{inv.buyer.name}</p>
                            <p className="text-[11px] text-slate-400">{inv.buyer.state}</p>
                          </td>

                          {/* Date */}
                          <td className="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{inv.invoiceDate}</td>

                          {/* Due Date */}
                          <td className="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{inv.dueDate}</td>

                          {/* Total */}
                          <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatCurrency(inv.engineResult?.grandTotal)}
                          </td>

                          {/* Status */}
                          <td className="p-3.5 text-center">
                            <StatusChip status={inv.status} isOverdue={inv.isOverdue} size="sm" />
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* View */}
                              <Link
                                to={`/invoices/${inv._id || inv.id}`}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="View Invoice"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>

                              {/* Edit (Drafts only) */}
                              {inv.status === "draft" && (
                                <Link
                                  to={`/invoices/${inv._id || inv.id}/edit`}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                  title="Edit Draft"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Link>
                              )}

                              {/* Download PDF */}
                              <a
                                href={getInvoicePdfUrl(inv._id || inv.id!)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Download PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>

                              {/* Duplicate */}
                              <button
                                type="button"
                                onClick={() => handleDuplicate(inv)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                title="Duplicate"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Mark Paid (Issued only) */}
                              {inv.status === "issued" && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkPaid(inv)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer"
                                  title="Mark as Paid"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Mark Unpaid (Paid only) */}
                              {inv.status === "paid" && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkUnpaid(inv)}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg cursor-pointer"
                                  title="Mark as Unpaid"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Cancel (Issued only) */}
                              {inv.status === "issued" && (
                                <button
                                  type="button"
                                  onClick={() => setCancelCandidate(inv)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                                  title="Cancel Invoice"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Draft */}
                              {inv.status === "draft" && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteCandidate(inv)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                                  title="Delete Draft"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {t("invoices.pageOf", "Page {{page}} of {{totalPages}}", { page, totalPages })} (
                    {totalCount} total)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {t("invoices.cancelInvoiceTitle", "Cancel Invoice?")}
              </h4>
              <p className="text-xs text-slate-500">
                Cancel invoice {cancelCandidate.invoiceNumber}? Cancelled invoices retain their number for audit
                compliance and cannot be restored.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelCandidate(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                {t("common.noKeep", "No, Keep Active")}
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                {t("invoices.confirmCancel", "Yes, Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Draft Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {t("invoices.deleteDraftTitle", "Delete Draft?")}
              </h4>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this unissued draft? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteDraft}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                {t("common.delete", "Delete Draft")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
export default InvoiceListPage;
