import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Calculator,
  Receipt,
  FileText,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import InfoTooltip from "../ui/InfoTooltip";

export interface ActivityItem {
  id: string;
  type: string;
  icon: typeof Calculator;
  category: "tax" | "gst" | "invoice";
  date: string;
  amount: number;
  taxOrGst: number;
  savingsOrRate?: string;
  status: "optimized" | "settled" | "pending";
}

const defaultActivities: ActivityItem[] = [
  {
    id: "act-1",
    type: "Salaried Tax Calculation (FY 26-27)",
    icon: Calculator,
    category: "tax",
    date: "Today, 10:45 AM",
    amount: 1275000,
    taxOrGst: 0,
    savingsOrRate: "+₹1,12,500 saved",
    status: "optimized",
  },
  {
    id: "act-2",
    type: "GST Tax Invoice #INV-2026-104",
    icon: FileText,
    category: "invoice",
    date: "Yesterday, 3:20 PM",
    amount: 85000,
    taxOrGst: 15300,
    savingsOrRate: "18% GST (CGST+SGST)",
    status: "settled",
  },
  {
    id: "act-3",
    type: "Freelance 44ADA Presumptive Tax",
    icon: Calculator,
    category: "tax",
    date: "Oct 18, 2026",
    amount: 1500000,
    taxOrGst: 97500,
    savingsOrRate: "+₹78,000 saved",
    status: "optimized",
  },
  {
    id: "act-4",
    type: "Client GST Invoice #INV-2026-103",
    icon: Receipt,
    category: "gst",
    date: "Oct 15, 2026",
    amount: 42000,
    taxOrGst: 7560,
    savingsOrRate: "18% IGST",
    status: "pending",
  },
];

interface RecentActivityTableProps {
  activities?: ActivityItem[];
}

export const RecentActivityTable = ({ activities }: RecentActivityTableProps) => {
  const { t } = useTranslation();
  const displayActivities = activities && activities.length > 0 ? activities : defaultActivities;

  const getStatusBadge = (status: ActivityItem["status"]) => {
    switch (status) {
      case "optimized":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            <span>{t("activity.status.optimized")}</span>
          </span>
        );
      case "settled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            {t("activity.status.settled")}
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {t("activity.status.pending")}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs transition-all flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              {t("activity.caption")}
            </span>
            <InfoTooltip content="Your recent tax calculations and generated GST tax invoices" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t("activity.title")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("activity.subtitle")}
          </p>
        </div>

        <Link
          to="/tax-history"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
        >
          <span>{t("common.viewAll")}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 pr-4">{t("activity.columns.type")}</th>
              <th className="pb-3 px-3">{t("activity.columns.date")}</th>
              <th className="pb-3 px-3 text-right">{t("activity.columns.amount")}</th>
              <th className="pb-3 px-3 text-right">{t("activity.columns.taxGst")}</th>
              <th className="pb-3 pl-3 text-right">{t("activity.columns.status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {displayActivities.map((row) => {
              const Icon = row.icon;
              return (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Type (icon + name) */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate max-w-[180px] sm:max-w-[220px]">
                          {row.type}
                        </span>
                        {row.savingsOrRate && (
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 block">
                            {row.savingsOrRate}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {row.date}
                  </td>

                  {/* Gross Amount */}
                  <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-slate-100 text-right whitespace-nowrap">
                    ₹{row.amount.toLocaleString("en-IN")}
                  </td>

                  {/* Tax / GST */}
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        row.taxOrGst === 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {row.taxOrGst === 0 ? "₹0 (Zero Tax)" : `₹${row.taxOrGst.toLocaleString("en-IN")}`}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                    {getStatusBadge(row.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentActivityTable;
