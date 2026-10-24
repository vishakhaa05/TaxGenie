import React from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step1Schema, Step1FormValues } from "../schema";
import { useWizard } from "../context/WizardContext";
import { AgeGroup } from "../types";
import { User, Award, Crown, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const AgeStep: React.FC = () => {
  const { t } = useTranslation();
  const { formData, updateFormData, nextStep, activeRules, isLoadingRules } = useWizard();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      ageGroup: formData.ageGroup || "below60",
      taxYear: formData.taxYear || "2026-27",
    },
    mode: "onBlur",
  });

  const selectedAge = watch("ageGroup");

  const onSubmit = (values: Step1FormValues) => {
    updateFormData(values);
    nextStep();
  };

  const ageCards: {
    id: AgeGroup;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      id: "below60",
      title: t("incomeTax.age.below60.title", "Below 60"),
      subtitle: t(
        "incomeTax.age.below60.desc",
        "Individual taxpayers under 60 years of age"
      ),
      icon: User,
    },
    {
      id: "senior",
      title: t("incomeTax.age.senior.title", "60 to 79 (Senior citizen)"),
      subtitle: t(
        "incomeTax.age.senior.desc",
        "Higher exemption limit up to ₹3,00,000 in Old Regime"
      ),
      icon: Award,
      badge: t("incomeTax.age.senior.badge", "Higher Exemption"),
    },
    {
      id: "superSenior",
      title: t("incomeTax.age.superSenior.title", "80 or above (Super senior citizen)"),
      subtitle: t(
        "incomeTax.age.superSenior.desc",
        "Higher exemption limit up to ₹5,00,000 in Old Regime"
      ),
      icon: Crown,
      badge: t("incomeTax.age.superSenior.badge", "Max Exemption"),
    },
  ];

  const availableYears = [
    {
      id: "2026-27",
      label: t("incomeTax.years.fy2026_27", "FY 2026-27 (Budget 2025)"),
    },
  ];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 sm:space-y-8 animate-in fade-in duration-200"
      noValidate
    >
      {/* Step Heading */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t("incomeTax.step1.title", "Step 1: About You")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {t(
            "incomeTax.step1.subtitle",
            "Older taxpayers get a higher tax-free limit in the old regime."
          )}
        </p>
      </div>

      {/* Tax Year Selector */}
      <div className="space-y-2">
        <label
          htmlFor="taxYear-select"
          className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          {t("incomeTax.age.taxYearLabel", "Tax Year")}
        </label>
        <div className="relative max-w-sm">
          <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Controller
            name="taxYear"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="taxYear-select"
                disabled={isLoadingRules}
                className="w-full h-11 pl-10 pr-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer transition-all"
              >
                {availableYears.map((yr) => (
                  <option key={yr.id} value={yr.id}>
                    {yr.label}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      </div>

      {/* Age Group Big Cards */}
      <div className="space-y-3">
        <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("incomeTax.age.selectAgeGroup", "Select Your Age Group")}
        </label>

        <Controller
          name="ageGroup"
          control={control}
          render={({ field }) => (
            <div
              role="radiogroup"
              aria-label="Age Group"
              className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4"
            >
              {ageCards.map((card) => {
                const isSelected = field.value === card.id;
                const Icon = card.icon;

                return (
                  <button
                    key={card.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      field.onChange(card.id);
                      setValue("ageGroup", card.id, { shouldValidate: true });
                    }}
                    className={cn(
                      "relative p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group outline-none",
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {card.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {card.badge}
                          </span>
                        )}
                      </div>

                      <h3
                        className={cn(
                          "font-bold text-sm sm:text-base transition-colors",
                          isSelected
                            ? "text-indigo-950 dark:text-indigo-200"
                            : "text-slate-900 dark:text-slate-100"
                        )}
                      >
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {card.subtitle}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <span
                        className={cn(
                          "font-semibold",
                          isSelected
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                        )}
                      >
                        {isSelected
                          ? t("common.selected", "Selected ✓")
                          : t("common.select", "Click to select")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.ageGroup && (
          <p role="alert" className="text-xs font-semibold text-rose-500 mt-1">
            {t(errors.ageGroup.message || "incomeTax.validation.ageRequired")}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-md shadow-indigo-500/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <span>{t("common.next", "Next: Your Income")}</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </form>
  );
};

export default AgeStep;
