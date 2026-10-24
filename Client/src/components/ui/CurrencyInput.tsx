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
      onBlur,
      onFocus,
      ...rest
    },
    ref
  ) => {
    // Format display string with Indian grouping
    const formatDisplay = (num: number | null | undefined): string => {
      if (num === null || num === undefined || num === 0) return "";
      return formatINR(num);
    };

    const [displayVal, setDisplayVal] = useState<string>(() => formatDisplay(value));

    useEffect(() => {
      setDisplayVal(formatDisplay(value));
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawText = e.target.value;
      // Extract digits only - strictly block negative signs, decimals, symbols
      const digitsOnly = rawText.replace(/[^0-9]/g, "");

      if (digitsOnly === "") {
        setDisplayVal("");
        onChange?.(0);
        onValueChange?.(0);
        return;
      }

      // Parse plain integer
      const numericVal = parseInt(digitsOnly, 10);
      if (Number.isNaN(numericVal)) {
        setDisplayVal("");
        onChange?.(0);
        onValueChange?.(0);
        return;
      }

      // Update formatted string
      setDisplayVal(formatINR(numericVal));
      onChange?.(numericVal);
      onValueChange?.(numericVal);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text");
      const digitsOnly = pastedText.replace(/[^0-9]/g, "");
      if (digitsOnly === "") return;

      const numericVal = parseInt(digitsOnly, 10);
      if (!Number.isNaN(numericVal)) {
        setDisplayVal(formatINR(numericVal));
        onChange?.(numericVal);
        onValueChange?.(numericVal);
      }
    };

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
          inputMode="numeric"
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
