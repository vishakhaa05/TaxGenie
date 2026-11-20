import React from "react";
import { FileEdit, Send, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { InvoiceStatus } from "../types";

interface StatusChipProps {
  status: InvoiceStatus;
  isOverdue?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  isOverdue,
  className,
  size = "sm",
}) => {
  if (isOverdue && status === "issued") {
    return (
      <span
        role="status"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs",
          className
        )}
      >
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" aria-hidden="true" />
        <span>Overdue</span>
      </span>
    );
  }

  switch (status) {
    case "paid":
      return (
        <span
          role="status"
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs",
            className
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
          <span>Paid</span>
        </span>
      );

    case "issued":
      return (
        <span
          role="status"
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs",
            className
          )}
        >
          <Send className="w-3.5 h-3.5 shrink-0 text-blue-500" aria-hidden="true" />
          <span>Issued</span>
        </span>
      );

    case "cancelled":
      return (
        <span
          role="status"
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs",
            className
          )}
        >
          <XCircle className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>Cancelled</span>
        </span>
      );

    case "draft":
    default:
      return (
        <span
          role="status"
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs",
            className
          )}
        >
          <FileEdit className="w-3.5 h-3.5 shrink-0 text-amber-500" aria-hidden="true" />
          <span>Draft</span>
        </span>
      );
  }
};

export default StatusChip;
