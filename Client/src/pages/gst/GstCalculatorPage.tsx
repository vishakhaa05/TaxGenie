import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Receipt, RotateCcw, ArrowUpDown, Sparkles, AlertCircle } from "lucide-react";
import PageLayout from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { FieldWithTooltip } from "@/components/ui/FieldWithTooltip";
import { ModeToggle } from "@/features/gst/components/ModeToggle";
import { RateChips } from "@/features/gst/components/RateChips";
import { ItemRateSearch } from "@/features/gst/components/ItemRateSearch";
import { StateSelect } from "@/features/gst/components/StateSelect";
import { GstResultCard } from "@/features/gst/components/GstResultCard";
import { useGstCalculation } from "@/features/gst/hooks/useGstCalculation";
import { createGstFormSchema, GstFormData, DEFAULT_ALLOWED_RATES } from "@/features/gst/schema";
import { fetchGstMeta, FALLBACK_GST_STATES, FALLBACK_GST_RATES, DEFAULT_GST_RATE } from "@/features/gst/api";
import { amountInWords } from "@/features/gst/utils/money";
import { CommonGstItem, GstMode, GstState, RecentCalculationItem } from "@/features/gst/types";

const SELLER_STATE_STORAGE_KEY = "taxgenie_gst_seller_state";

export default function GstCalculatorPage() {
  const { t, i18n } = useTranslation();

  const [states, setStates] = useState<readonly GstState[]>(FALLBACK_GST_STATES);
  const [allowedRates, setAllowedRates] = useState<number[]>([...FALLBACK_GST_RATES]);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);

  // Load seller state from session or default to Maharashtra "27"
  const initialSellerState = useMemo(() => {
    try {
      const saved = sessionStorage.getItem(SELLER_STATE_STORAGE_KEY);
      if (saved) return saved;
    } catch {}
    return "27";
  }, []);

  // Fetch allowed rates and states dynamically from API
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      try {
        const meta = await fetchGstMeta("2026-27");
        if (isMounted) {
          if (meta.states && meta.states.length > 0) {
            setStates(meta.states);
          }
          if (meta.supportedRates && meta.supportedRates.length > 0) {
            setAllowedRates(meta.supportedRates);
          }
        }
      } catch {
        // Fallback already defaults
      }
    }
    loadMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  const schema = useMemo(() => createGstFormSchema(allowedRates), [allowedRates]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<GstFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      mode: "add",
      amount: 0,
      rate: DEFAULT_GST_RATE,
      sellerState: initialSellerState,
      buyerState: initialSellerState,
      sameState: true,
    },
  });

  const formValues = watch();
  const currentAmount = formValues.amount;
  const currentRate = formValues.rate;
  const currentMode = formValues.mode;
  const currentSellerState = formValues.sellerState;
  const currentBuyerState = formValues.buyerState;
  const currentSameState = formValues.sameState;

  // Amount in words underneath amount input
  const amountWords = useMemo(() => {
    if (currentAmount && currentAmount > 0) {
      return amountInWords(currentAmount);
    }
    return "";
  }, [currentAmount]);

  // Hook handles debounce (~300ms) and cancellation
  const calcInput = useMemo(() => {
    if (!currentAmount || currentAmount <= 0) return null;
    return {
      amount: currentAmount,
      rate: currentRate,
      mode: currentMode,
      sellerState: currentSellerState,
      buyerState: currentSameState ? currentSellerState : currentBuyerState,
    };
  }, [currentAmount, currentRate, currentMode, currentSellerState, currentBuyerState, currentSameState]);

  const {
    result,
    setResult,
    isLoading,
    error,
    history,
    calculateImmediate,
    clearHistory,
  } = useGstCalculation(calcInput, isValid);

  // Map server validation errors back to form fields
  useEffect(() => {
    if (error?.details && typeof error.details === "object") {
      Object.entries(error.details).forEach(([field, msgs]) => {
        const errorMsg = Array.isArray(msgs) ? msgs[0] : String(msgs);
        setError(field as any, { type: "server", message: errorMsg });
      });
    }
  }, [error, setError]);

  // Handle Rate item select from searchable dropdown
  const handleItemSelect = (item: CommonGstItem) => {
    setSelectedItemId(item.id);
    setValue("rate", item.rate, { shouldValidate: true });
    calculateImmediate({
      amount: currentAmount,
      rate: item.rate,
      mode: currentMode,
      sellerState: currentSellerState,
      buyerState: currentSameState ? currentSellerState : currentBuyerState,
    });
  };

  // Swap Mode: switches Add/Remove and puts the previous result's total or base into amount field
  const handleSwapMode = () => {
    const nextMode: GstMode = currentMode === "add" ? "remove" : "add";
    let nextAmount = currentAmount;

    if (result && result.total > 0) {
      if (nextMode === "remove") {
        // Was add, now remove -> inclusive amount is previous total
        nextAmount = result.total;
      } else {
        // Was remove, now add -> exclusive base is previous base
        nextAmount = result.base;
      }
    }

    setValue("mode", nextMode, { shouldValidate: true });
    setValue("amount", nextAmount, { shouldValidate: true });
    calculateImmediate({
      amount: nextAmount,
      rate: currentRate,
      mode: nextMode,
      sellerState: currentSellerState,
      buyerState: currentSameState ? currentSellerState : currentBuyerState,
    });
  };

  // Clear inputs and reset
  const handleClear = () => {
    reset({
      mode: "add",
      amount: 0,
      rate: DEFAULT_GST_RATE,
      sellerState: initialSellerState,
      buyerState: initialSellerState,
      sameState: true,
    });
    setSelectedItemId(undefined);
    setResult(null);
  };

  // Quick Example filler
  const handleFillExample = () => {
    setValue("mode", "add", { shouldValidate: true });
    setValue("amount", 50000, { shouldValidate: true });
    setValue("rate", 18, { shouldValidate: true });
    setValue("sellerState", initialSellerState, { shouldValidate: true });
    setValue("buyerState", initialSellerState, { shouldValidate: true });
    setValue("sameState", true, { shouldValidate: true });
    calculateImmediate({
      amount: 50000,
      rate: 18,
      mode: "add",
      sellerState: initialSellerState,
      buyerState: initialSellerState,
    });
  };

  // Use again from Recent Calculations history
  const handleUseAgain = (item: RecentCalculationItem) => {
    setValue("mode", item.mode, { shouldValidate: true });
    setValue("amount", item.amount, { shouldValidate: true });
    setValue("rate", item.rate, { shouldValidate: true });
    setValue("sellerState", item.sellerState, { shouldValidate: true });
    setValue("buyerState", item.buyerState, { shouldValidate: true });
    setValue("sameState", item.sellerState === item.buyerState, { shouldValidate: true });
    calculateImmediate({
      amount: item.amount,
      rate: item.rate,
      mode: item.mode,
      sellerState: item.sellerState,
      buyerState: item.buyerState,
    });
  };

  // Select rate from Compare Rates table
  const handleSelectRateFromCompare = (newRate: number) => {
    setValue("rate", newRate, { shouldValidate: true });
    calculateImmediate({
      amount: currentAmount,
      rate: newRate,
      mode: currentMode,
      sellerState: currentSellerState,
      buyerState: currentSameState ? currentSellerState : currentBuyerState,
    });
  };

  const getTranslatedErrorMessage = (msgKey?: string) => {
    if (!msgKey) return undefined;
    if (msgKey.startsWith("errors.")) {
      return t(msgKey, msgKey);
    }
    return msgKey;
  };

  return (
    <PageLayout
      title={t("gst.pageTitle", "GST Calculator")}
      subtitle={t(
        "gst.pageSubtitle",
        "Add or remove GST from prices instantly with state-wise CGST, SGST, or IGST breakdowns."
      )}
      rightAction={
        <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/10">
          {t("gst.taxYearBadge", "FY 2026-27")}
        </span>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Card (7 cols on desktop) */}
        <div className="lg:col-span-7">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-5 sm:p-6 space-y-6">
              {/* 1. Mode Toggle (Segmented control) */}
              <Controller
                control={control}
                name="mode"
                render={({ field }) => (
                  <ModeToggle
                    value={field.value}
                    onChange={(mode) => {
                      field.onChange(mode);
                      if (currentAmount > 0) {
                        calculateImmediate({
                          amount: currentAmount,
                          rate: currentRate,
                          mode,
                          sellerState: currentSellerState,
                          buyerState: currentSameState ? currentSellerState : currentBuyerState,
                        });
                      }
                    }}
                  />
                )}
              />

              {/* 2. Amount Input with decimals and words underneath */}
              <div className="space-y-1.5">
                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <FieldWithTooltip
                      id="gst-amount-input"
                      label={
                        currentMode === "add"
                          ? t("gst.baseAmountLabel", "Base Price (without GST)")
                          : t("gst.inclusiveAmountLabel", "Total Price (with GST)")
                      }
                      tooltip={t(
                        "gst.amountTooltip",
                        "Enter the transaction price in rupees. Accepts paise up to 2 decimal places."
                      )}
                      example={t("gst.amountExample", "e.g. 50,000 or 999.99")}
                      error={getTranslatedErrorMessage(errors.amount?.message)}
                    >
                      <CurrencyInput
                        id="gst-amount-input"
                        name={field.name}
                        value={field.value}
                        allowDecimals={true}
                        hasError={!!errors.amount}
                        placeholder="0.00"
                        onValueChange={(val) => {
                          field.onChange(val);
                        }}
                      />
                    </FieldWithTooltip>
                  )}
                />

                {/* Amount in Words */}
                {amountWords && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 px-1 pt-0.5">
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {t("gst.inWords", "In words")}:
                    </span>
                    <span className="italic">{amountWords}</span>
                  </div>
                )}
              </div>

              {/* 3. GST Rate Chips */}
              <Controller
                control={control}
                name="rate"
                render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t("gst.selectGstRate", "GST Rate")}
                    </label>
                    <RateChips
                      rates={allowedRates}
                      selectedRate={field.value}
                      onChange={(r) => {
                        field.onChange(r);
                        setSelectedItemId(undefined);
                        if (currentAmount > 0) {
                          calculateImmediate({
                            amount: currentAmount,
                            rate: r,
                            mode: currentMode,
                            sellerState: currentSellerState,
                            buyerState: currentSameState ? currentSellerState : currentBuyerState,
                          });
                        }
                      }}
                    />
                  </div>
                )}
              />

              {/* 4. Find Rate for My Item (Searchable dropdown) */}
              <ItemRateSearch
                selectedItemId={selectedItemId}
                onSelectItem={handleItemSelect}
              />

              {/* 5. Seller State & Buyer State */}
              <StateSelect
                sellerState={currentSellerState}
                buyerState={currentBuyerState}
                sameState={currentSameState}
                states={states}
                onSellerStateChange={(code) => {
                  setValue("sellerState", code, { shouldValidate: true });
                }}
                onBuyerStateChange={(code) => {
                  setValue("buyerState", code, { shouldValidate: true });
                }}
                onSameStateChange={(checked) => {
                  setValue("sameState", checked, { shouldValidate: true });
                }}
                sellerStateError={getTranslatedErrorMessage(errors.sellerState?.message)}
                buyerStateError={getTranslatedErrorMessage(errors.buyerState?.message)}
              />

              {/* 6. Form Action Buttons: Clear and Swap Mode */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t("gst.clear", "Clear")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSwapMode}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    {t(
                      "gst.swapMode",
                      currentMode === "add" ? "Swap to Remove GST" : "Swap to Add GST"
                    )}
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Result Card (5 cols on desktop, right below inputs on mobile) */}
        <div className="lg:col-span-5">
          <GstResultCard
            result={result}
            isLoading={isLoading}
            error={error}
            mode={currentMode}
            amount={currentAmount}
            rate={currentRate}
            sellerState={currentSellerState}
            buyerState={currentSameState ? currentSellerState : currentBuyerState}
            onRetry={() => {
              if (calcInput) {
                calculateImmediate(calcInput);
              }
            }}
            onFillExample={handleFillExample}
            history={history}
            onUseAgain={handleUseAgain}
            onClearHistory={clearHistory}
            onSelectRate={handleSelectRateFromCompare}
            allowedRates={allowedRates}
          />
        </div>
      </div>
    </PageLayout>
  );
}
