import React from "react";
import { useTranslation } from "react-i18next";
import { PlusCircle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GstMode } from "../types";

interface ModeToggleProps {
  value: GstMode;
  onChange: (mode: GstMode) => void;
  disabled?: boolean;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label={t("gst.modeLabel", "Calculation Mode")}
        className="relative grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 select-none"
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === "add"}
          disabled={disabled}
          onClick={() => onChange("add")}
          className={cn(
            "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            value === "add"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>{t("gst.addGst", "Add GST")}</span>
          <span className="hidden sm:inline text-[11px] font-normal text-slate-400 dark:text-slate-500">
            ({t("gst.exclusive", "Exclusive")})
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={value === "remove"}
          disabled={disabled}
          onClick={() => onChange("remove")}
          className={cn(
            "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            value === "remove"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          <MinusCircle className="w-4 h-4 shrink-0" />
          <span>{t("gst.removeGst", "Remove GST")}</span>
          <span className="hidden sm:inline text-[11px] font-normal text-slate-400 dark:text-slate-500">
            ({t("gst.inclusive", "Inclusive")})
          </span>
        </button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 px-1 leading-relaxed">
        {value === "add"
          ? t(
              "gst.addModeExplanation",
              "Price is without GST. Calculates tax to add to your base price."
            )
          : t(
              "gst.removeModeExplanation",
              "Price already includes GST. Calculates the base price and extracted tax."
            )}
      </p>
    </div>
  );
};

export default ModeToggle;
