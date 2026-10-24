import React from "react";
import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoBannerProps {
  type?: "info" | "warning" | "success";
  title?: string;
  message: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const InfoBanner: React.FC<InfoBannerProps> = ({
  type = "info",
  title,
  message,
  action,
  className = "",
}) => {
  const styles = {
    info: {
      container:
        "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/40 text-indigo-950 dark:text-indigo-200",
      icon: <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />,
      titleColor: "text-indigo-900 dark:text-indigo-300",
    },
    warning: {
      container:
        "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-800/50 text-amber-950 dark:text-amber-200",
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
      titleColor: "text-amber-900 dark:text-amber-300",
    },
    success: {
      container:
        "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-200",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
      titleColor: "text-emerald-900 dark:text-emerald-300",
    },
  }[type];

  return (
    <div
      role="region"
      aria-label="Important information"
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm",
        styles.container,
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        {styles.icon}
        <div className="space-y-0.5">
          {title && <p className={cn("font-semibold", styles.titleColor)}>{title}</p>}
          <div className="leading-relaxed opacity-90">{message}</div>
        </div>
      </div>
      {action && <div className="shrink-0 self-end sm:self-auto">{action}</div>}
    </div>
  );
};

export default InfoBanner;
