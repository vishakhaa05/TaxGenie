import React from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step2Schema, Step2FormValues } from "../schema";
import { useWizard } from "../context/WizardContext";
import CurrencyInput from "@/components/ui/CurrencyInput";
import FieldWithTooltip from "@/components/ui/FieldWithTooltip";
import { formatINR } from "../utils/formatINR";
import { amountInWords } from "../utils/amountInWords";
import { ArrowLeft, ArrowRight, Wallet, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export const IncomeStep: React.FC = () => {
  const { t } = useTranslation();
  const { formData, updateFormData, nextStep, prevStep } = useWizard();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      salaryPeriod: formData.salaryPeriod || "yearly",
      salaryAmount: formData.salaryAmount || 0,
      otherIncome: formData.otherIncome || 0,
    },
    mode: "onBlur",
  });

  const salaryPeriod = watch("salaryPeriod");
  const salaryAmount = watch("salaryAmount") || 0;
  const otherIncome = watch("otherIncome") || 0;

  const annualSalaryEquivalent =
    salaryPeriod === "monthly" ? salaryAmount * 12 : salaryAmount;

  const onSubmit = (values: Step2FormValues) => {
    updateFormData(values);
    nextStep();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 sm:space-y-8 animate-in fade-in duration-200"
      noValidate
    >
      {/* Heading */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t("incomeTax.step2.title", "Step 2: Your Income")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {t(
            "incomeTax.step2.subtitle",
            "Enter your salary and other income sources for the full financial year."
          )}
        </p>
      </div>

      {/* Salary Section with Monthly / Yearly toggle */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t("incomeTax.salary.title", "Salary Income (CTC or Gross Salary)")}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {t(
                  "incomeTax.salary.desc",
                  "Income before deductions like PF, tax, and standard deduction"
                )}
              </p>
            </div>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setValue("salaryPeriod", "monthly", { shouldValidate: true })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                salaryPeriod === "monthly"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {t("incomeTax.salary.monthly", "Monthly")}
            </button>
            <button
              type="button"
              onClick={() => setValue("salaryPeriod", "yearly", { shouldValidate: true })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                salaryPeriod === "yearly"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {t("incomeTax.salary.yearly", "Yearly")}
            </button>
          </div>
        </div>

        {/* Currency Input for Salary */}
        <div className="space-y-1.5">
          <Controller
            name="salaryAmount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id="salary-amount"
                name="salaryAmount"
                aria-label={t("incomeTax.salary.title", "Salary Amount")}
                data-testid="salary-amount-input"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={
                  salaryPeriod === "monthly"
                    ? t("incomeTax.salary.monthlyPlaceholder", "e.g. 1,00,000")
                    : t("incomeTax.salary.yearlyPlaceholder", "e.g. 15,00,000")
                }
                hasError={Boolean(errors.salaryAmount)}
              />
            )}
          />

          {errors.salaryAmount && (
            <p role="alert" className="text-xs font-semibold text-rose-500">
              {t(errors.salaryAmount.message || "incomeTax.validation.salaryRequired")}
            </p>
          )}

          {/* Yearly Conversion Notice (if Monthly selected) */}
          {salaryPeriod === "monthly" && salaryAmount > 0 && (
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 pt-0.5">
              {t("incomeTax.salary.yearlyEquivalent", {
                amount: formatINR(annualSalaryEquivalent, { prefixSymbol: true }),
                defaultValue: `That is ${formatINR(annualSalaryEquivalent, {
                  prefixSymbol: true,
                })} a year`,
              })}
            </div>
          )}

          {/* Amount In Words Helper */}
          {salaryAmount > 0 && (
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-0.5">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {t("incomeTax.inWords", "In words")}:{" "}
              </span>
              <span>{amountInWords(salaryAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Other Income Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t(
                "incomeTax.otherIncome.title",
                "Other Income (Bank Interest, FD Interest, etc.)"
              )}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              {t(
                "incomeTax.otherIncome.helper",
                "Standard deduction does not apply to this."
              )}
            </p>
          </div>
        </div>

        <FieldWithTooltip
          id="other-income-input"
          label={t("incomeTax.otherIncome.label", "Annual Other Income")}
          tooltip={t(
            "incomeTax.otherIncome.tooltip",
            "Includes interest from savings accounts, fixed deposits, recurring deposits, or other taxable earnings."
          )}
          example={t(
            "incomeTax.otherIncome.example",
            "Example: ₹25,000 from savings bank and FD interest"
          )}
          error={errors.otherIncome?.message ? t(errors.otherIncome.message) : undefined}
        >
          <Controller
            name="otherIncome"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id="other-income-input"
                name="otherIncome"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="0"
                hasError={Boolean(errors.otherIncome)}
              />
            )}
          />
        </FieldWithTooltip>

        {otherIncome > 0 && (
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {t("incomeTax.inWords", "In words")}:{" "}
            </span>
            <span>{amountInWords(otherIncome)}</span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            updateFormData({ salaryPeriod, salaryAmount, otherIncome });
            prevStep();
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t("common.back", "Back")}</span>
        </button>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-md shadow-indigo-500/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <span>{t("common.next", "Next: Deductions")}</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </form>
  );
};

export default IncomeStep;
