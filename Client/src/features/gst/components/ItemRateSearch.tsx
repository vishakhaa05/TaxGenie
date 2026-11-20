import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, ChevronDown, Check, X, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { commonGstItems } from "../data/commonGstItems";
import { CommonGstItem } from "../types";

interface ItemRateSearchProps {
  onSelectItem: (item: CommonGstItem) => void;
  selectedItemId?: string;
  disabled?: boolean;
}

export const ItemRateSearch: React.FC<ItemRateSearchProps> = ({
  onSelectItem,
  selectedItemId,
  disabled = false,
}) => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === "hi";

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const items: CommonGstItem[] = commonGstItems;

  const selectedItem = items.find((i) => i.id === selectedItemId);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      item.name_en.toLowerCase().includes(term) ||
      item.name_hi.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      (item.hsn && item.hsn.toLowerCase().includes(term))
    );
  });

  const handleSelect = (item: CommonGstItem) => {
    onSelectItem(item);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <div className="flex items-center justify-between gap-2">
        <label
          id="item-search-label"
          className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>{t("gst.findRateForItem", "Find the rate for my item")}</span>
        </label>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="hidden sm:inline">
            {t("gst.rateGuideNote", "Rates shown are a guide. Please confirm for your exact item.")}
          </span>
          <span className="sm:hidden">{t("gst.rateGuideNoteShort", "Guide only")}</span>
        </span>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby="item-search-label"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "w-full h-11 px-3.5 rounded-xl border flex items-center justify-between text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
            isOpen
              ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-900"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700",
            disabled && "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
          )}
        >
          <div className="flex items-center gap-2 truncate pr-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            {selectedItem ? (
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {isHindi ? selectedItem.name_hi : selectedItem.name_en}{" "}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 ml-1.5">
                  {selectedItem.rate}% GST
                </span>
              </span>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500">
                {t(
                  "gst.searchItemPlaceholder",
                  "Search goods or services (e.g. IT services, software, consulting, medicines)..."
                )}
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-indigo-500"
            )}
          />
        </button>

        {isOpen && (
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 max-h-72 flex flex-col"
          >
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/40">
              <Search className="w-4 h-4 text-slate-400 ml-1.5 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("gst.filterPlaceholder", "Type to search...")}
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
              {filteredItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  {t("gst.noItemsFound", "No matching items found. Please select a rate chip directly.")}
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isCurrent = item.id === selectedItemId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isCurrent}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs sm:text-sm transition-colors cursor-pointer",
                        isCurrent
                          ? "bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <div className="space-y-0.5 truncate pr-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {isHindi ? item.name_hi : item.name_en}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                          <span>{item.category}</span>
                          {item.hsn && <span>• HSN {item.hsn}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-bold tabular-nums",
                            item.rate === 18
                              ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                              : item.rate === 5
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : item.rate === 40
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          {item.rate}%
                        </span>
                        {isCurrent && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemRateSearch;
