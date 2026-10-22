import { useTranslation } from "react-i18next";
import { Sparkles, ArrowUpRight, Plus, Calculator, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { useTypedSelector } from "@/app/hook";

export const GreetingBanner = () => {
  const { t } = useTranslation();
  const { user } = useTypedSelector((state) => state.auth);

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("greeting.morning");
    if (hour < 17) return t("greeting.afternoon");
    return t("greeting.evening");
  };

  const name = user?.name ? user.name.split(" ")[0] : "Taxpayer";
  const greetingHeadline = `${getGreetingTime()}, ${name} 👋`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EDE9FE]/80 via-[#E0E7FF]/60 to-[#F8FAFC] dark:from-[#1E293B] dark:via-[#1E1B4B]/90 dark:to-[#0F172A] border border-indigo-200/60 dark:border-slate-800 p-6 sm:p-7 shadow-xs transition-all">
      {/* 3D Origami / Faceted Geometric Triangles SVG (mirrors reference image) */}
      <div className="absolute right-0 top-0 bottom-0 w-2/5 pointer-events-none overflow-hidden select-none">
        <svg
          viewBox="0 0 320 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute right-2 -top-4 w-72 sm:w-80 h-full opacity-60 dark:opacity-30"
        >
          {/* Main Faceted Triangle 1 */}
          <polygon
            points="180,20 280,60 210,130"
            fill="#818CF8"
            fillOpacity="0.7"
          />
          <polygon
            points="210,130 280,60 310,140"
            fill="#6366F1"
            fillOpacity="0.85"
          />
          <polygon
            points="180,20 210,130 140,110"
            fill="#A78BFA"
            fillOpacity="0.5"
          />

          {/* Floating Small Facet 2 */}
          <polygon
            points="120,40 160,25 145,80"
            fill="#38BDF8"
            fillOpacity="0.6"
          />

          {/* Floating Small Facet 3 */}
          <polygon
            points="240,140 290,120 270,180"
            fill="#C084FC"
            fillOpacity="0.65"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 dark:bg-white/10 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 mb-2.5 border border-indigo-500/20 dark:border-white/15">
          <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-300" />
          <span>Income Tax Act 2025 Ready (FY 2026-27)</span>
        </div>

        {/* Dynamic greeting header matching reference image: "Good afternoon, Acme Inc. 👋" */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {greetingHeadline}
        </h1>

        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
          Here is what's happening with your taxes and GST today (FY 2026-27):
        </p>

        {/* Taxpayer Profiles Row + Action Buttons (mirrors reference image avatars + actions) */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center -space-x-1.5">
            <div
              className="w-7 h-7 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#1E293B] shadow-xs cursor-pointer"
              title="Salaried Profile"
            >
              SP
            </div>
            <div
              className="w-7 h-7 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#1E293B] shadow-xs cursor-pointer"
              title="Business / Freelance"
            >
              BF
            </div>
            <div
              className="w-7 h-7 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#1E293B] shadow-xs cursor-pointer"
              title="Family HUF"
            >
              HF
            </div>
            <button
              type="button"
              className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center ring-2 ring-white dark:ring-[#1E293B] hover:bg-slate-300 transition-colors cursor-pointer"
              title="Add taxpayer profile"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

          {/* Quick Calculate CTAs */}
          <Link
            to="/tax-calculator"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-95"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Income Tax Calculator</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>

          <Link
            to="/gst-calculator"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-xs transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-indigo-500" />
            <span>GST Calculator</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GreetingBanner;
