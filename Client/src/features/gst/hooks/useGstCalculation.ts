import { useState, useEffect, useRef, useCallback } from "react";
import { CalculateGstInput, GstResult, RecentCalculationItem } from "../types";
import { calculateGstApi } from "../api";
import { calculateLocalGst } from "../utils/money";

const HISTORY_STORAGE_KEY = "taxgenie_gst_history";
const MAX_HISTORY_ITEMS = 5;

export function getSessionHistory(): RecentCalculationItem[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveToSessionHistory(item: RecentCalculationItem): RecentCalculationItem[] {
  try {
    const existing = getSessionHistory();
    // Filter out identical amount+rate+mode from top
    const filtered = existing.filter(
      (h) =>
        !(
          h.amount === item.amount &&
          h.rate === item.rate &&
          h.mode === item.mode &&
          h.sellerState === item.sellerState &&
          h.buyerState === item.buyerState
        )
    );
    const updated = [item, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export interface UseGstCalculationOptions {
  debounceMs?: number;
  taxYear?: string;
}

export function useGstCalculation(
  input: CalculateGstInput | null,
  isValid: boolean,
  options: UseGstCalculationOptions = {}
) {
  const { debounceMs = 300, taxYear = "2026-27" } = options;

  const [result, setResult] = useState<GstResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string; code?: string; details?: any } | null>(
    null
  );
  const [history, setHistory] = useState<RecentCalculationItem[]>(() => getSessionHistory());

  const activeAbortController = useRef<AbortController | null>(null);
  const latestRequestId = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const executeCalculation = useCallback(
    async (calcInput: CalculateGstInput, isDebounced: boolean = false) => {
      // Abort any ongoing request
      if (activeAbortController.current) {
        activeAbortController.current.abort();
      }

      const controller = new AbortController();
      activeAbortController.current = controller;
      const requestId = ++latestRequestId.current;

      setIsLoading(true);
      setError(null);

      try {
        let calculatedResult: GstResult;
        try {
          calculatedResult = await calculateGstApi(
            {
              ...calcInput,
              taxYear,
            },
            controller.signal
          );
        } catch (apiErr: any) {
          if (controller.signal.aborted) {
            // Cancelled, do nothing
            return;
          }
          // If network failed (e.g. offline, backend unavailable in isolated client test),
          // fallback to client-side engine calculation
          if (apiErr?.name !== "AbortError" && !apiErr?.details && apiErr?.code !== "UNSUPPORTED_GST_RATE") {
            try {
              calculatedResult = calculateLocalGst(calcInput);
            } catch {
              throw apiErr;
            }
          } else {
            throw apiErr;
          }
        }

        // Verify this is still the newest request
        if (requestId !== latestRequestId.current) {
          return;
        }

        setResult(calculatedResult);
        setIsLoading(false);

        // Record to session history if amount is valid
        if (calcInput.amount > 0) {
          const historyItem: RecentCalculationItem = {
            id: `gst_calc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: Date.now(),
            amount: calcInput.amount,
            rate: calcInput.rate,
            mode: calcInput.mode,
            sellerState: calcInput.sellerState,
            buyerState: calcInput.buyerState,
            result: calculatedResult,
          };
          const newHistory = saveToSessionHistory(historyItem);
          setHistory(newHistory);
        }
      } catch (err: any) {
        if (controller.signal.aborted || err?.name === "AbortError") {
          return;
        }

        if (requestId === latestRequestId.current) {
          setIsLoading(false);
          setError({
            message: err?.message || "Failed to calculate GST",
            code: err?.code,
            details: err?.details,
          });
        }
      }
    },
    [taxYear]
  );

  useEffect(() => {
    if (!input || !isValid || input.amount <= 0) {
      if (activeAbortController.current) {
        activeAbortController.current.abort();
      }
      setIsLoading(false);
      if (!input || input.amount === 0) {
        setResult(null);
      }
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      executeCalculation(input, true);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [input?.amount, input?.rate, input?.mode, input?.sellerState, input?.buyerState, isValid, debounceMs, executeCalculation]);

  const calculateImmediate = useCallback(
    (calcInput?: CalculateGstInput) => {
      const target = calcInput ?? input;
      if (target && target.amount > 0) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        executeCalculation(target, false);
      }
    },
    [input, executeCalculation]
  );

  const clearHistory = useCallback(() => {
    sessionStorage.removeItem(HISTORY_STORAGE_KEY);
    setHistory([]);
  }, []);

  return {
    result,
    setResult,
    isLoading,
    error,
    history,
    calculateImmediate,
    clearHistory,
  };
}
