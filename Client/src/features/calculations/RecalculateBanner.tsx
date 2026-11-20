import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, RotateCcw, CheckCircle2, Loader2, X } from "lucide-react";
import { recalculateCalculationApi, RecalculateResponse } from "./api";
import { toast } from "sonner";

interface RecalculateBannerProps {
  calculationId: string;
  onRecalculated?: (data: RecalculateResponse) => void;
  className?: string;
}

export const RecalculateBanner: React.FC<RecalculateBannerProps> = ({
  calculationId,
  onRecalculated,
  className = "",
}) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [diff, setDiff] = useState<RecalculateResponse | null>(null);

  if (isDismissed) return null;

  const handleRecalculate = async () => {
    setIsLoading(true);
    try {
      const res = await recalculateCalculationApi(calculationId);
      setDiff(res.data);
      if (onRecalculated) {
        onRecalculated(res.data);
      }
      toast.success(t("calculations.recalculatedSuccess", "Calculation updated with current statutory rules!"));
    } catch (err: any) {
      toast.error(err?.message || t("calculations.recalcFailed", "Failed to recalculate with latest rules"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-amber-900 dark:text-amber-200">
            {t("calculations.rulesNoticeTitle", "Statutory Tax Rules Updated")}
          </p>
          <p className="text-amber-800/80 dark:text-amber-300/80">
            {t(
              "calculations.rulesNoticeDesc",
              "Statutory tax slabs or rebate rules have been refined since this calculation was saved."
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={handleRecalculate}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" />
          )}
          <span>{t("calculations.recalculateBtn", "Recalculate Now")}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg text-amber-600/70 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RecalculateBanner;
