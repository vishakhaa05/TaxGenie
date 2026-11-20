import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  History,
  Calculator,
  Receipt,
  FileText,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { formatRupeesINR } from "@/features/gst/utils/money";

export interface DashboardActivityItem {
  id: string;
  type: "income_tax" | "gst" | "invoice";
  name: string;
  date: string;
  amount: number;
  taxOrGst: number;
  badge: string;
  status: "Saved" | "Optimized";
  route: string;
}

interface DashboardRecentActivityProps {
  items: DashboardActivityItem[];
  isSample?: boolean;
}

export const DashboardRecentActivity: React.FC<DashboardRecentActivityProps> = ({
  items,
  isSample = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl p-6 bg-[#16192E] text-white border border-[#23274A] shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#23274A]">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm sm:text-base font-bold text-white">
            {t("dashboard.recentActivity", "Recent Calculations & Optimizations")}
          </h3>
        </div>
        <Link
          to="/history"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          <span>{t("common.viewAll", "View all")}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <p className="text-xs text-slate-400">
            {t("dashboard.noActivity", "No saved calculations yet in this financial year.")}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/income-tax"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Calculate Tax
            </Link>
            <Link
              to="/gst"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#262B54] hover:bg-[#2F356B] text-slate-200 transition-colors"
            >
              Calculate GST
            </Link>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-[#23274A]">
          {items.slice(0, 8).map((item) => {
            const isTax = item.type === "income_tax";

            return (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3 group hover:bg-[#1B1E38]/50 px-2 rounded-xl transition-colors"
              >
                {/* Left: Icon & Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isTax
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                    }`}
                  >
                    {isTax ? <Calculator className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-white truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{item.date}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-medium">
                        Gross: {formatRupeesINR(item.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Badge, Amount, and Open */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-white tabular-nums">
                      {formatRupeesINR(item.taxOrGst)}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {item.badge}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(item.route)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#23274A] transition-colors cursor-pointer"
                    title="Open calculation"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardRecentActivity;
