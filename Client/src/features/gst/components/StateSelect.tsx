import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, ChevronDown, Check, ArrowRightLeft, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { GstState } from "../types";
import { FALLBACK_GST_STATES } from "../api";

interface StateDropdownProps {
  id: string;
  label: string;
  value: string; // state code or name
  states: readonly GstState[];
  onChange: (code: string) => void;
  disabled?: boolean;
  error?: string;
}

const StateDropdown: React.FC<StateDropdownProps> = ({
  id,
  label,
  value,
  states,
  onChange,
  disabled = false,
  error,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = states.find(
    (s) => s.code === value || s.name.toLowerCase() === value.toLowerCase()
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filtered = states.filter((s) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase().trim();
    return s.name.toLowerCase().includes(term) || s.code.includes(term);
  });

  return (
    <div className="space-y-1" ref={containerRef}>
      <label
        htmlFor={id}
        className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
      >
        <MapPin className="w-3.5 h-3.5 text-slate-400" />
        <span>{label}</span>
      </label>

      <div className="relative">
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "w-full h-10 px-3 rounded-xl border flex items-center justify-between text-left text-xs sm:text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
            error
              ? "border-rose-500 text-rose-900 dark:text-rose-200"
              : isOpen
              ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700",
            disabled && "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/60"
          )}
        >
          <span className="truncate pr-2">
            {selected ? (
              <span>
                {selected.name}{" "}
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  ({selected.code})
                </span>
              </span>
            ) : (
              <span className="text-slate-400">{t("gst.selectState", "Select state...")}</span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-150 shrink-0",
              isOpen && "rotate-180 text-indigo-500"
            )}
          />
        </button>

        {isOpen && (
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-60 flex flex-col animate-in fade-in-50 zoom-in-95 duration-100"
          >
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("gst.searchStatePlaceholder", "Type state name or code...")}
                className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 flex-1">
              {filtered.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  {t("gst.noStateFound", "No state matching")}
                </div>
              ) : (
                filtered.map((s) => {
                  const isCurrent = s.code === (selected?.code ?? value);
                  return (
                    <button
                      key={s.code}
                      type="button"
                      role="option"
                      aria-selected={isCurrent}
                      onClick={() => {
                        onChange(s.code);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-xs flex items-center justify-between text-left transition-colors cursor-pointer",
                        isCurrent
                          ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <span>{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-400">{s.code}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">{error}</p>
      )}
    </div>
  );
};

interface StateSelectProps {
  sellerState: string;
  buyerState: string;
  sameState: boolean;
  states?: readonly GstState[];
  onSellerStateChange: (code: string) => void;
  onBuyerStateChange: (code: string) => void;
  onSameStateChange: (checked: boolean) => void;
  sellerStateError?: string;
  buyerStateError?: string;
  disabled?: boolean;
}

const SELLER_STATE_STORAGE_KEY = "taxgenie_gst_seller_state";

export const StateSelect: React.FC<StateSelectProps> = ({
  sellerState,
  buyerState,
  sameState,
  states = FALLBACK_GST_STATES,
  onSellerStateChange,
  onBuyerStateChange,
  onSameStateChange,
  sellerStateError,
  buyerStateError,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const handleSellerChange = (code: string) => {
    onSellerStateChange(code);
    try {
      sessionStorage.setItem(SELLER_STATE_STORAGE_KEY, code);
    } catch {}
    if (sameState) {
      onBuyerStateChange(code);
    }
  };

  const handleSameStateToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onSameStateChange(checked);
    if (checked) {
      onBuyerStateChange(sellerState);
    }
  };

  return (
    <div className="space-y-3 p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <StateDropdown
          id="seller-state-select"
          label={t("gst.sellerState", "Seller State (Supplier)")}
          value={sellerState}
          states={states}
          onChange={handleSellerChange}
          disabled={disabled}
          error={sellerStateError}
        />

        <StateDropdown
          id="buyer-state-select"
          label={t("gst.buyerState", "Buyer State (Place of Supply)")}
          value={sameState ? sellerState : buyerState}
          states={states}
          onChange={onBuyerStateChange}
          disabled={disabled || sameState}
          error={buyerStateError}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            id="same-state-checkbox"
            type="checkbox"
            checked={sameState}
            onChange={handleSameStateToggle}
            disabled={disabled}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
          />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {t("gst.buyerInSameState", "Buyer is in the same state (Intra-state)")}
          </span>
        </label>

        <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900 inline-flex items-center gap-1 w-fit">
          <ArrowRightLeft className="w-3 h-3" />
          <span>
            {sameState
              ? t("gst.intraExplanation", "Same state = CGST + SGST")
              : t("gst.interExplanation", "Different state = IGST")}
          </span>
        </span>
      </div>
    </div>
  );
};

export default StateSelect;
