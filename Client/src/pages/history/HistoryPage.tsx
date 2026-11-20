import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  History,
  Search,
  Filter,
  Calculator,
  Receipt,
  RotateCcw,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogIn,
  AlertCircle,
  CheckCircle2,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/useAuth";
import {
  listCalculationsApi,
  deleteCalculationApi,
  renameCalculationApi,
  recalculateCalculationApi,
  CalculationItem,
} from "@/features/calculations/api";
import { formatRupeesINR } from "@/features/gst/utils/money";
import { RecalculateBanner } from "@/features/calculations/RecalculateBanner";

export const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Filters & State
  const [activeTab, setActiveTab] = useState<"all" | "income_tax" | "gst">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [taxYearFilter, setTaxYearFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "amount_desc" | "amount_asc">("latest");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Data
  const [calculations, setCalculations] = useState<CalculationItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Rename modal state
  const [renamingItem, setRenamingItem] = useState<CalculationItem | null>(null);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch calculations
  const loadCalculations = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await listCalculationsApi({
        type: activeTab === "all" ? undefined : activeTab,
        taxYear: taxYearFilter === "all" ? undefined : taxYearFilter,
        q: debouncedQuery.trim() || undefined,
        sort: sortBy,
        page,
        limit,
      });

      const calcs = res.data?.calculations || [];
      const total = res.data?.total || res.data?.pagination?.total || 0;
      const pages = res.data?.totalPages || res.data?.pagination?.totalPages || 1;

      setCalculations(calcs);
      setTotalItems(total);
      setTotalPages(pages);
    } catch (err: any) {
      toast.error(err?.message || t("history.loadFailed", "Failed to load calculation history"));
    } finally {
      setIsLoading(false);
    }
  }, [user, activeTab, taxYearFilter, debouncedQuery, sortBy, page, limit, t]);

  useEffect(() => {
    loadCalculations();
  }, [loadCalculations]);

  // Handle Open/Restore calculation
  const handleOpenCalculation = (item: CalculationItem) => {
    if (item.type === "income_tax") {
      try {
        sessionStorage.setItem("taxgenie_income_tax_wizard", JSON.stringify(item.inputs));
        if (item.result) {
          sessionStorage.setItem("taxgenie_income_tax_result", JSON.stringify(item.result));
        }
        navigate("/income-tax/result");
      } catch {
        navigate("/income-tax");
      }
    } else {
      // GST: Save inputs to session so GstCalculatorPage mounts with them
      try {
        sessionStorage.setItem(
          "taxgenie_gst_restore",
          JSON.stringify({
            amount: item.inputs.amount,
            rate: item.inputs.rate,
            mode: item.inputs.mode,
            sellerState: item.inputs.sellerState,
            buyerState: item.inputs.buyerState,
          })
        );
      } catch {}
      navigate("/gst");
    }
  };

  // Handle Rename Submit
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingItem || !newName.trim()) return;

    setIsRenaming(true);
    try {
      await renameCalculationApi(renamingItem.id, newName.trim());
      toast.success(t("history.renameSuccess", "Calculation renamed successfully"));
      setRenamingItem(null);
      loadCalculations();
    } catch (err: any) {
      toast.error(err?.message || t("history.renameFailed", "Failed to rename calculation"));
    } finally {
      setIsRenaming(false);
    }
  };

  // Handle Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      await deleteCalculationApi(deletingId);
      toast.success(t("history.deleteSuccess", "Calculation deleted"));
      setDeletingId(null);
      loadCalculations();
    } catch (err: any) {
      toast.error(err?.message || t("history.deleteFailed", "Failed to delete calculation"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Recalculate
  const handleRecalculateItem = async (item: CalculationItem) => {
    try {
      const res = await recalculateCalculationApi(item.id);
      toast.success(t("history.recalculated", "Recomputed with latest statutory tax rules!"));
      loadCalculations();
    } catch (err: any) {
      toast.error(err?.message || t("history.recalcFailed", "Failed to recompute"));
    }
  };

  // 1. Guest Logged-Out View
  if (!isAuthLoading && !user) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
          <History className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("history.guestTitle", "Login to Access Saved Calculations")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {t(
              "history.guestDesc",
              "Sign in to your TaxGenie account to review your saved tax plans, compare previous financial years, recompute with updated rules, and export reports."
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{t("common.login", "Log In")}</span>
          </Link>
          <Link
            to="/income-tax"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-indigo-500" />
            <span>{t("incomeTax.calculateNow", "Calculate Income Tax")}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>{t("history.title", "Calculation History")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("history.subtitle", "Track, recompute, and manage all your saved Income Tax and GST calculations.")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/income-tax"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{t("history.newIncomeTax", "+ Income Tax")}</span>
          </Link>
          <Link
            to="/gst"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 transition-all cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{t("history.newGst", "+ GST")}</span>
          </Link>
        </div>
      </div>

      {/* Tabs and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start">
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            {t("history.tabAll", "All Calculations")}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("income_tax");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "income_tax"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Income Tax</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("gst");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "gst"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>GST</span>
          </button>
        </div>

        {/* Search & Select Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("history.searchPlaceholder", "Search by name...")}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Tax Year Filter */}
          <select
            value={taxYearFilter}
            onChange={(e) => {
              setTaxYearFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">{t("history.allYears", "All Tax Years")}</option>
            <option value="2026-27">FY 2026-27</option>
            <option value="2025-26">FY 2025-26</option>
            <option value="2024-25">FY 2024-25</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="latest">{t("history.sortLatest", "Latest First")}</option>
            <option value="oldest">{t("history.sortOldest", "Oldest First")}</option>
            <option value="amount_desc">{t("history.sortAmountDesc", "Amount (High to Low)")}</option>
            <option value="amount_asc">{t("history.sortAmountAsc", "Amount (Low to High)")}</option>
          </select>
        </div>
      </div>

      {/* Calculations List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs">{t("history.loading", "Loading calculations...")}</p>
        </div>
      ) : calculations.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t("history.noCalculationsFound", "No saved calculations found")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {debouncedQuery || taxYearFilter !== "all"
                ? t("history.tryAdjustingFilters", "Try adjusting your search query or filters to find what you need.")
                : t(
                    "history.startFirstCalc",
                    "You haven't saved any calculations yet. Use our calculators and click 'Save' to track them here."
                  )}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/income-tax"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculate Income Tax</span>
            </Link>
            <Link
              to="/gst"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Calculate GST</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {calculations.map((item) => {
            const isIncomeTax = item.type === "income_tax";
            const dateStr = new Date(item.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/40 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Left: Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isIncomeTax
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80"
                          : "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/80"
                      }`}
                    >
                      {isIncomeTax ? <Calculator className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                      <span>{isIncomeTax ? "Income Tax" : "GST"}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      FY {item.taxYear}
                    </span>

                    <span className="text-[11px] text-slate-400">{dateStr}</span>
                  </div>

                  <h3
                    onClick={() => handleOpenCalculation(item)}
                    className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors truncate"
                  >
                    {item.name}
                  </h3>

                  {/* Summary Metric Chips */}
                  <div className="flex items-center gap-4 text-xs flex-wrap">
                    {isIncomeTax ? (
                      <>
                        {item.summary?.grossIncome !== undefined && (
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <span>Income:</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {formatRupeesINR(item.summary.grossIncome)}
                            </span>
                          </div>
                        )}
                        {item.summary?.bestTax !== undefined && (
                          <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                            <span>Tax:</span>
                            <span className="font-bold">{formatRupeesINR(item.summary.bestTax)}</span>
                          </div>
                        )}
                        {item.summary?.recommendedRegime && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            {item.summary.recommendedRegime === "new" ? "New Regime" : "Old Regime"}
                            {item.summary.savings ? ` (Save ${formatRupeesINR(item.summary.savings)})` : ""}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {item.summary?.amount !== undefined && (
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <span>Base:</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {formatRupeesINR(item.summary.amount)}
                            </span>
                          </div>
                        )}
                        {item.summary?.rate !== undefined && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.summary.rate}% GST
                          </span>
                        )}
                        {item.summary?.gstAmount !== undefined && (
                          <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                            <span>GST Amount:</span>
                            <span className="font-bold">{formatRupeesINR(item.summary.gstAmount)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenCalculation(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all cursor-pointer shadow-xs"
                  >
                    <span>{t("common.open", "Open")}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRenamingItem(item);
                      setNewName(item.name);
                    }}
                    title={t("common.rename", "Rename")}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {isIncomeTax && (
                    <button
                      type="button"
                      onClick={() => handleRecalculateItem(item)}
                      title={t("history.recalculate", "Recompute with latest rules")}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeletingId(item.id)}
                    title={t("common.delete", "Delete")}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            {t("history.showingPage", "Page {{page}} of {{totalPages}} ({{total}} calculations)", {
              page,
              totalPages,
              total: totalItems,
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700 dark:text-slate-300 px-2">{page}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {renamingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t("history.renameModalTitle", "Rename Calculation")}
            </h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Calculation name"
                required
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isRenaming}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
                >
                  {isRenaming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{t("common.save", "Save")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {t("history.deleteModalTitle", "Delete Calculation?")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t(
                  "history.deleteModalDesc",
                  "Are you sure you want to delete this saved calculation? This cannot be undone."
                )}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("common.delete", "Delete")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
