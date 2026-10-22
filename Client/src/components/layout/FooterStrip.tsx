import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

export const FooterStrip = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full py-4 px-6 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-[#0F172A]/50 backdrop-blur-xs transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{t("common.disclaimer")}</span>
        </div>
        <div className="text-[11px] text-slate-400">
          TaxGenie v2.0 • Income Tax Act 2025 & CGST/SGST Compliant
        </div>
      </div>
    </footer>
  );
};

export default FooterStrip;
