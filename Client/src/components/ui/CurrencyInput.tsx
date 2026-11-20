import React, { forwardRef, useState, useEffect } from "react";
import { formatINR } from "@/features/income-tax/utils/formatINR";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: number | null;
  onChange?: (val: number) => void;
  onValueChange?: (val: number) => void;
  hasError?: boolean;
  prefix?: string;
  allowDecimals?: boolean;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      id,
      name,
      value,
      onChange,
      onValueChange,
      hasError = false,
      placeholder = "0",
      className = "",
      prefix = "₹",
      disabled = false,
      allowDecimals = false,
      inputMode,
      onBlur,
      onFocus,
      ...rest
    },
    ref
  ) => {
    // Helper to group integer part using Indian grouping
    const groupIndianDigits = (intStr: string): string => {
      if (!intStr) return "";
      // Strip leading zeros unless it's just "0"
      const normalized = intStr.replace(/^0+(?=\d)/, "");
      if (normalized.length <= 3) return normalized;
      const lastThree = normalized.slice(-3);
      const otherDigits = normalized.slice(0, -3);
      const formattedOthers = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
      return `${formattedOthers},${lastThree}`;
    };

    // Format display string from number
    const formatDisplay = (num: number | null | undefined): string => {
      if (num === null || num === undefined || num === 0) return "";
      if (!allowDecimals) {
        return formatINR(num);
      }
      const parts = num.toString().split(".");
      const formattedInt = groupIndianDigits(parts[0] || "0");
      if (parts[1] !== undefined) {
        return `${formattedInt}.${parts[1].slice(0, 2)}`;
      }
      return formattedInt;
    };

    const [displayVal, setDisplayVal] = useState<string>(() => formatDisplay(value));

    useEffect(() => {
      // Avoid clobbering in-progress typing if the parsed value equals the incoming value
      if (allowDecimals) {
        const rawDigits = displayVal.replace(/,/g, "");
        const currentNumeric = parseFloat(rawDigits) || 0;
        if (value === currentNumeric && (displayVal.endsWith(".") || displayVal.endsWith(".0"))) {
          return;
        }
      }
      setDisplayVal(formatDisplay(value));
    }, [value, allowDecimals]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawText = e.target.value;

      if (!allowDecimals) {
        // Extract digits only - strictly block negative signs, decimals, symbols
        const digitsOnly = rawText.replace(/[^0-9]/g, "");

        if (digitsOnly === "") {
          setDisplayVal("");
          onChange?.(0);
          onValueChange?.(0);
          return;
        }

        const numericVal = parseInt(digitsOnly, 10);
        if (Number.isNaN(numericVal)) {
          setDisplayVal("");
          onChange?.(0);
          onValueChange?.(0);
          return;
        }

        setDisplayVal(formatINR(numericVal));
        onChange?.(numericVal);
        onValueChange?.(numericVal);
        return;
      }

      // allowDecimals === true
      // Strip any characters other than digits and decimal point
      const cleaned = rawText.replace(/[^0-9.]/g, "");
      if (cleaned === "" || cleaned === ".") {
        if (cleaned === ".") {
          setDisplayVal("0.");
          onChange?.(0);
          onValueChange?.(0);
          return;
        }
        setDisplayVal("");
        onChange?.(0);
        onValueChange?.(0);
        return;
      }

      const dotIndex = cleaned.indexOf(".");
      let intPart = "";
      let decPart: string | null = null;

      if (dotIndex !== -1) {
        intPart = cleaned.slice(0, dotIndex);
        // Take up to 2 decimal places, ignore any extra dots
        decPart = cleaned.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2);
      } else {
        intPart = cleaned;
      }

      const formattedInt = groupIndianDigits(intPart || "0");
      let nextDisplay = formattedInt;
      if (dotIndex !== -1) {
        nextDisplay = `${formattedInt}.${decPart ?? ""}`;
      }

      const cleanNumString = decPart !== null ? `${intPart || "0"}.${decPart}` : intPart;
      const parsed = parseFloat(cleanNumString);
      const numericVal = Number.isNaN(parsed) ? 0 : parsed;

      setDisplayVal(nextDisplay);
      onChange?.(numericVal);
      onValueChange?.(numericVal);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text");

      if (!allowDecimals) {
        const digitsOnly = pastedText.replace(/[^0-9]/g, "");
        if (digitsOnly === "") return;
        const numericVal = parseInt(digitsOnly, 10);
        if (!Number.isNaN(numericVal)) {
          setDisplayVal(formatINR(numericVal));
          onChange?.(numericVal);
          onValueChange?.(numericVal);
        }
        return;
      }

      // allowDecimals === true
      const cleaned = pastedText.replace(/[^0-9.]/g, "");
      if (!cleaned) return;
      const dotIndex = cleaned.indexOf(".");
      let intPart = "";
      let decPart: string | null = null;
      if (dotIndex !== -1) {
        intPart = cleaned.slice(0, dotIndex);
        decPart = cleaned.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2);
      } else {
        intPart = cleaned;
      }
      const formattedInt = groupIndianDigits(intPart || "0");
      const nextDisplay = decPart !== null ? `${formattedInt}.${decPart}` : formattedInt;
      const parsed = parseFloat(decPart !== null ? `${intPart || "0"}.${decPart}` : intPart);
      if (!Number.isNaN(parsed)) {
        setDisplayVal(nextDisplay);
        onChange?.(parsed);
        onValueChange?.(parsed);
      }
    };

    const resolvedInputMode = inputMode ?? (allowDecimals ? "decimal" : "numeric");

    return (
      <div className="relative flex items-center w-full">
        {prefix && (
          <span
            className={cn(
              "absolute left-3.5 select-none text-sm font-semibold pointer-events-none transition-colors",
              disabled ? "text-slate-400" : "text-slate-500 dark:text-slate-400",
              hasError && "text-rose-500 dark:text-rose-400"
            )}
            aria-hidden="true"
          >
            {prefix}
          </span>
        )}
        <input
          {...rest}
          ref={ref}
          id={id}
          name={name}
          type="text"
          inputMode={resolvedInputMode}
          autoComplete="off"
          disabled={disabled}
          value={displayVal}
          placeholder={placeholder}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onBlur={onBlur}
          onFocus={onFocus}
          aria-invalid={hasError ? "true" : "false"}
          className={cn(
            "w-full h-11 rounded-xl text-base font-medium transition-all outline-none",
            "bg-white dark:bg-slate-900 border",
            prefix ? "pl-8 pr-3.5" : "px-3.5",
            hasError
              ? "border-rose-500 text-rose-900 dark:text-rose-100 focus:ring-2 focus:ring-rose-500/30"
              : "border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20",
            disabled && "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800",
            className
          )}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;
