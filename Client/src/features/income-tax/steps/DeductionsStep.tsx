import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step3Schema, Step3FormValues } from "../schema";
import { useWizard } from "../context/WizardContext";
import CurrencyInput from "@/components/ui/CurrencyInput";
import FieldWithTooltip from "@/components/ui/FieldWithTooltip";
import LimitMeter from "@/components/ui/LimitMeter";
import InfoBanner from "@/components/ui/InfoBanner";
import { calculateHraExemption } from "../utils/calculateHraExemption";
import { formatINR } from "../utils/formatINR";
import {
  ArrowLeft,
  Sparkles,
  Home,
  HeartPulse,
  PiggyBank,
  ShieldCheck,
  Building2,
  FastForward,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const DeductionsStep: React.FC = () => {
  const { t } = useTranslation();
  const {
    formData,
    updateFormData,
    prevStep,
    activeRules,
    calculate,
    skipDeductionsAndCalculate,
    isCalculating,
    calcError,
    calcErrorDetails,
  } = useWizard();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step3FormValues>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      sec80C: formData.sec80C || 0,
      sec80CCD1B: formData.sec80CCD1B || 0,
      sec80D_selfFamily: formData.sec80D_selfFamily || 0,
      sec80D_parents: formData.sec80D_parents || 0,
      parentsAreSenior: formData.parentsAreSenior || false,
      homeLoanInterest: formData.homeLoanInterest || 0,
      hasHra: formData.hasHra || false,
      hraBasicSalary: formData.hraBasicSalary || 0,
      hraReceived: formData.hraReceived || 0,
      hraRentPaid: formData.hraRentPaid || 0,
      hraIsMetro: formData.hraIsMetro || false,
    },
    mode: "onBlur",
  });

  // Dynamic limits from activeRules (API-driven, not hardcoded)
  const limits = activeRules?.oldRegime?.deductionLimits;
  const isTaxpayerSenior =
    formData.ageGroup === "senior" || formData.ageGroup === "superSenior";

  const sec80CLimit = limits?.sec80C ?? 150000;
  const sec80CCD1BLimit = limits?.sec80CCD1B ?? 50000;
  const sec80DSelfLimit = isTaxpayerSenior
    ? limits?.sec80D_selfFamily?.senior ?? 50000
    : limits?.sec80D_selfFamily?.normal ?? 25000;

  const parentsAreSeniorWatch = watch("parentsAreSenior");
  const sec80DParentsLimit = parentsAreSeniorWatch
    ? limits?.sec80D_parents?.senior ?? 50000
    : limits?.sec80D_parents?.normal ?? 25000;

  const homeLoanLimit = limits?.homeLoanInterestSelfOccupied ?? 200000;

  // Watch field values for dynamic meters and live HRA
  const sec80C = watch("sec80C") || 0;
  const sec80CCD1B = watch("sec80CCD1B") || 0;
  const sec80D_selfFamily = watch("sec80D_selfFamily") || 0;
  const sec80D_parents = watch("sec80D_parents") || 0;
  const homeLoanInterest = watch("homeLoanInterest") || 0;

  const hasHra = watch("hasHra");
  const hraBasicSalary = watch("hraBasicSalary") || 0;
  const hraReceived = watch("hraReceived") || 0;
  const hraRentPaid = watch("hraRentPaid") || 0;
  const hraIsMetro = watch("hraIsMetro") || false;

  // Live HRA exemption calculation
  const liveHraExemption = useMemo(() => {
    if (!hasHra) return 0;
    return calculateHraExemption(
      {
        basicSalary: hraBasicSalary,
        hraReceived,
        rentPaid: hraRentPaid,
        isMetro: hraIsMetro,
      },
      activeRules?.oldRegime?.hra
    );
  }, [hasHra, hraBasicSalary, hraReceived, hraRentPaid, hraIsMetro, activeRules]);

  const onSubmit = async (values: Step3FormValues) => {
    updateFormData(values);
    await calculate(values);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 sm:space-y-8 animate-in fade-in duration-200"
      noValidate
    >
      {/* Step Heading */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t("incomeTax.step3.title", "Step 3: Deductions & Allowances")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {t(
            "incomeTax.step3.subtitle",
            "Investments and expenses that reduce your taxable income under the Old Tax Regime."
          )}
        </p>
      </div>

      {/* Info Banner at top with Skip Button */}
      <InfoBanner
        type="info"
        title={t("incomeTax.deductions.bannerTitle", "Important Note")}
        message={t(
          "incomeTax.deductions.bannerMsg",
          "Deductions only help in the OLD regime. We will calculate both and compare for you."
        )}
        action={
          <button
            type="button"
            disabled={isCalculating}
            onClick={skipDeductionsAndCalculate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-800 hover:bg-white dark:hover:bg-slate-900 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>
              {t("incomeTax.deductions.skipBtn", "Skip - I have no deductions")}
            </span>
          </button>
        }
      />

      {/* Calculation Error Alert */}
      {calcError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{t("common.calculationFailed", "Calculation Failed")}</p>
              <p className="text-xs opacity-90 mt-0.5">{calcError}</p>
              {calcErrorDetails && (
                <div className="mt-2 text-[11px] font-mono bg-white/60 dark:bg-slate-900/60 p-2 rounded">
                  {JSON.stringify(calcErrorDetails)}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("common.retry", "Retry")}</span>
          </button>
        </div>
      )}

      {/* Deduction Fields Grid */}
      <div className="space-y-5">
        {/* Field 1: Section 80C */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <FieldWithTooltip
            id="sec80C"
            label={t("incomeTax.deductions.sec80C.label", "Section 80C Investments")}
            tooltip={t(
              "incomeTax.deductions.sec80C.tooltip",
              "Covers Employee PF (EPF), PPF, ELSS mutual funds, Life Insurance Premiums, National Savings Certificate (NSC), SSY, and Children Tuition Fees."
            )}
            example={t(
              "incomeTax.deductions.sec80C.example",
              "e.g. ₹1,50,000 for EPF contribution + PPF investment"
            )}
            limit={sec80CLimit}
            error={errors.sec80C?.message ? t(errors.sec80C.message) : undefined}
          >
            <Controller
              name="sec80C"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="sec80C"
                  name="sec80C"
                  data-testid="currency-input-sec80c"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0"
                  hasError={Boolean(errors.sec80C)}
                />
              )}
            />
          </FieldWithTooltip>
          <LimitMeter current={sec80C} limit={sec80CLimit} />
        </div>

        {/* Field 2: Section 80D - Self & Family */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <FieldWithTooltip
            id="sec80D_selfFamily"
            label={t(
              "incomeTax.deductions.sec80D_self.label",
              "Section 80D - Health Insurance (Self & Family)"
            )}
            tooltip={t(
              "incomeTax.deductions.sec80D_self.tooltip",
              "Medical insurance premiums and preventive health check-up (up to ₹5,000) for yourself, spouse, and dependent children."
            )}
            example={t(
              "incomeTax.deductions.sec80D_self.example",
              "e.g. ₹25,000 yearly premium for family health cover"
            )}
            limit={sec80DSelfLimit}
            badge={isTaxpayerSenior ? "Senior: ₹50,000 limit" : "₹25,000 limit"}
            error={
              errors.sec80D_selfFamily?.message
                ? t(errors.sec80D_selfFamily.message)
                : undefined
            }
          >
            <Controller
              name="sec80D_selfFamily"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="sec80D_selfFamily"
                  name="sec80D_selfFamily"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0"
                  hasError={Boolean(errors.sec80D_selfFamily)}
                />
              )}
            />
          </FieldWithTooltip>
          <LimitMeter current={sec80D_selfFamily} limit={sec80DSelfLimit} />
        </div>

        {/* Field 3: Section 80D - Parents with Senior Citizen toggle */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("incomeTax.deductions.parentsSeniorToggle", "My parents are senior citizens (age 60+)")}
            </span>
            <Controller
              name="parentsAreSenior"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Parents are senior citizens"
                />
              )}
            />
          </div>

          <FieldWithTooltip
            id="sec80D_parents"
            label={t(
              "incomeTax.deductions.sec80D_parents.label",
              "Section 80D - Health Insurance (Parents)"
            )}
            tooltip={t(
              "incomeTax.deductions.sec80D_parents.tooltip",
              "Medical insurance premiums for parents. Limit is ₹25,000 (normal) or ₹50,000 if either parent is 60 years or older."
            )}
            example={t(
              "incomeTax.deductions.sec80D_parents.example",
              "e.g. ₹50,000 for senior citizen parents' insurance"
            )}
            limit={sec80DParentsLimit}
            badge={parentsAreSeniorWatch ? "Senior Parents: ₹50,000" : "Normal: ₹25,000"}
            error={
              errors.sec80D_parents?.message
                ? t(errors.sec80D_parents.message)
                : undefined
            }
          >
            <Controller
              name="sec80D_parents"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="sec80D_parents"
                  name="sec80D_parents"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0"
                  hasError={Boolean(errors.sec80D_parents)}
                />
              )}
            />
          </FieldWithTooltip>
          <LimitMeter current={sec80D_parents} limit={sec80DParentsLimit} />
        </div>

        {/* Field 4: NPS Section 80CCD(1B) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <FieldWithTooltip
            id="sec80CCD1B"
            label={t(
              "incomeTax.deductions.sec80CCD1B.label",
              "NPS Contribution - Section 80CCD(1B)"
            )}
            tooltip={t(
              "incomeTax.deductions.sec80CCD1B.tooltip",
              "Exclusive additional deduction for voluntary contribution to Tier 1 National Pension Scheme (NPS), above the Section 80C ₹1.5L limit."
            )}
            example={t(
              "incomeTax.deductions.sec80CCD1B.example",
              "e.g. ₹50,000 deposited in NPS Tier-1 account"
            )}
            limit={sec80CCD1BLimit}
            error={errors.sec80CCD1B?.message ? t(errors.sec80CCD1B.message) : undefined}
          >
            <Controller
              name="sec80CCD1B"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="sec80CCD1B"
                  name="sec80CCD1B"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0"
                  hasError={Boolean(errors.sec80CCD1B)}
                />
              )}
            />
          </FieldWithTooltip>
          <LimitMeter current={sec80CCD1B} limit={sec80CCD1BLimit} />
        </div>

        {/* Field 5: Home Loan Interest (Section 24(b)) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <FieldWithTooltip
            id="homeLoanInterest"
            label={t(
              "incomeTax.deductions.homeLoan.label",
              "Home Loan Interest - Section 24(b) (Self-occupied House)"
            )}
            tooltip={t(
              "incomeTax.deductions.homeLoan.tooltip",
              "Interest paid on home loan borrowed for purchase or construction of a self-occupied residential property. Capped at ₹2,00,000."
            )}
            example={t(
              "incomeTax.deductions.homeLoan.example",
              "e.g. ₹2,00,000 interest portion shown on bank home loan certificate"
            )}
            limit={homeLoanLimit}
            error={
              errors.homeLoanInterest?.message
                ? t(errors.homeLoanInterest.message)
                : undefined
            }
          >
            <Controller
              name="homeLoanInterest"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="homeLoanInterest"
                  name="homeLoanInterest"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0"
                  hasError={Boolean(errors.homeLoanInterest)}
                />
              )}
            />
          </FieldWithTooltip>
          <LimitMeter current={homeLoanInterest} limit={homeLoanLimit} />
        </div>

        {/* Field 6: HRA (House Rent Allowance) Section 10(13A) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t("incomeTax.deductions.hra.title", "House Rent Allowance (HRA)")}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {t(
                    "incomeTax.deductions.hra.subtitle",
                    "Claim tax exemption on rent paid under Section 10(13A)"
                  )}
                </p>
              </div>
            </div>

            <Controller
              name="hasHra"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {field.value ? t("common.yes", "Yes") : t("common.no", "No")}
                  </span>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="I get House Rent Allowance toggle"
                  />
                </div>
              )}
            />
          </div>

          {/* Conditional HRA Fields */}
          {hasHra && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Basic Salary */}
                <FieldWithTooltip
                  id="hraBasicSalary"
                  label={t("incomeTax.deductions.hra.basicLabel", "Basic Salary (Yearly)")}
                  tooltip={t(
                    "incomeTax.deductions.hra.basicTooltip",
                    "Basic salary component of your CTC for the full year."
                  )}
                  example="e.g. ₹6,00,000"
                  error={
                    errors.hraBasicSalary?.message
                      ? t(errors.hraBasicSalary.message)
                      : undefined
                  }
                >
                  <Controller
                    name="hraBasicSalary"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        id="hraBasicSalary"
                        name="hraBasicSalary"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="0"
                        hasError={Boolean(errors.hraBasicSalary)}
                      />
                    )}
                  />
                </FieldWithTooltip>

                {/* HRA Received */}
                <FieldWithTooltip
                  id="hraReceived"
                  label={t("incomeTax.deductions.hra.receivedLabel", "HRA Received (Yearly)")}
                  tooltip={t(
                    "incomeTax.deductions.hra.receivedTooltip",
                    "Total HRA received from your employer in Form 16 / salary slips."
                  )}
                  example="e.g. ₹2,40,000"
                  error={
                    errors.hraReceived?.message
                      ? t(errors.hraReceived.message)
                      : undefined
                  }
                >
                  <Controller
                    name="hraReceived"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        id="hraReceived"
                        name="hraReceived"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="0"
                        hasError={Boolean(errors.hraReceived)}
                      />
                    )}
                  />
                </FieldWithTooltip>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rent Paid */}
                <FieldWithTooltip
                  id="hraRentPaid"
                  label={t("incomeTax.deductions.hra.rentLabel", "Rent Paid (Yearly)")}
                  tooltip={t(
                    "incomeTax.deductions.hra.rentTooltip",
                    "Actual total rent paid to landlord during the financial year."
                  )}
                  example="e.g. ₹2,16,000 (₹18,000/mo)"
                  error={
                    errors.hraRentPaid?.message
                      ? t(errors.hraRentPaid.message)
                      : undefined
                  }
                >
                  <Controller
                    name="hraRentPaid"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        id="hraRentPaid"
                        name="hraRentPaid"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="0"
                        hasError={Boolean(errors.hraRentPaid)}
                      />
                    )}
                  />
                </FieldWithTooltip>

                {/* Metro City Toggle */}
                <div className="flex flex-col justify-center space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {t("incomeTax.deductions.hra.metroLabel", "Metro city?")}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Delhi, Mumbai, Kolkata, Chennai (50% vs 40%)
                      </p>
                    </div>
                    <Controller
                      name="hraIsMetro"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Metro city toggle"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Live HRA Exemption Callout */}
              <div
                role="status"
                aria-live="polite"
                className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                    {t(
                      "incomeTax.deductions.hra.calculatedExemption",
                      "Calculated HRA Exemption"
                    )}
                  </span>
                </div>
                <span className="font-bold text-sm text-indigo-700 dark:text-indigo-300 tabular-nums">
                  {formatINR(liveHraExemption, { prefixSymbol: true })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          disabled={isCalculating}
          onClick={() => {
            updateFormData({
              sec80C,
              sec80CCD1B,
              sec80D_selfFamily,
              sec80D_parents,
              parentsAreSenior: parentsAreSeniorWatch,
              homeLoanInterest,
              hasHra,
              hraBasicSalary,
              hraReceived,
              hraRentPaid,
              hraIsMetro,
            });
            prevStep();
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{t("common.back", "Back")}</span>
        </button>

        <button
          type="submit"
          disabled={isCalculating}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-md shadow-indigo-500/25 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("incomeTax.calculating", "Calculating...")}</span>
            </>
          ) : (
            <>
              <span>{t("incomeTax.calculateAndCompare", "Calculate & Compare Regimes")}</span>
              <Sparkles className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default DeductionsStep;
