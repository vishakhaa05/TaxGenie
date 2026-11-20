import React from "react";
import { Plus, Trash2, Copy, Percent, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupeesINR } from "@/features/gst/utils/money";
import { cn } from "@/lib/utils";
import { InvoiceItem } from "../types";

interface LineItemsTableProps {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
  documentType: "tax_invoice" | "bill_of_supply";
  priceIncludesGst?: boolean;
  onPriceIncludesGstChange?: (val: boolean) => void;
}

const UNIT_OPTIONS = ["NOS", "PCS", "HOURS", "DAYS", "KG", "MTR", "BOX", "SET", "LTR"];
const GST_RATES = [0, 5, 18, 40];

export const LineItemsTable: React.FC<LineItemsTableProps> = ({
  items,
  onChange,
  documentType,
  priceIncludesGst = false,
  onPriceIncludesGstChange,
}) => {
  const isBillOfSupply = documentType === "bill_of_supply";

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index]!, [field]: value };
    updated[index] = item;
    onChange(updated);
  };

  const handleAddItem = () => {
    if (items.length >= 50) return;
    onChange([
      ...items,
      {
        id: `item_${Date.now()}`,
        description: "",
        hsnSac: "",
        quantity: 1,
        unit: "NOS",
        unitPrice: 0,
        discountType: "amount",
        discountValue: 0,
        gstRate: isBillOfSupply ? 0 : 18,
      },
    ]);
  };

  const handleDuplicateItem = (index: number) => {
    if (items.length >= 50) return;
    const itemToDup = items[index];
    if (!itemToDup) return;
    const duplicated = {
      ...itemToDup,
      id: `item_${Date.now()}`,
    };
    const updated = [...items];
    updated.splice(index + 1, 0, duplicated);
    onChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View (Hidden on mobile < 768px) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
            <tr>
              <th scope="col" className="py-3 px-2 text-center w-8">#</th>
              <th scope="col" className="py-3 px-3 min-w-[180px]">Item Description *</th>
              <th scope="col" className="py-3 px-2 w-24">HSN/SAC</th>
              <th scope="col" className="py-3 px-2 w-20">Qty</th>
              <th scope="col" className="py-3 px-2 w-22">Unit</th>
              <th scope="col" className="py-3 px-2 w-28">Price (₹)</th>
              <th scope="col" className="py-3 px-2 w-32">Discount</th>
              {!isBillOfSupply && (
                <th scope="col" className="py-3 px-2 w-44">GST Rate</th>
              )}
              <th scope="col" className="py-3 px-3 text-right w-28">Est. Total</th>
              <th scope="col" className="py-3 px-2 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {items.map((item, index) => {
              const gross = item.quantity * item.unitPrice;
              let disc = item.discountValue || 0;
              if (item.discountType === "percent") {
                disc = (gross * (item.discountValue || 0)) / 100;
              }
              const taxable = Math.max(0, gross - disc);
              const gst = isBillOfSupply ? 0 : (taxable * (item.gstRate || 0)) / 100;
              const estTotal = taxable + gst;

              return (
                <tr
                  key={item.id || index}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-2 text-center font-bold text-slate-400">
                    {index + 1}
                  </td>

                  {/* Description */}
                  <td className="py-3 px-3">
                    <Input
                      type="text"
                      placeholder="e.g. Consulting Services / Laptop"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      className="h-8 text-xs bg-slate-50 dark:bg-slate-800/40"
                      maxLength={200}
                      required
                    />
                  </td>

                  {/* HSN/SAC */}
                  <td className="py-3 px-2">
                    <Input
                      type="text"
                      placeholder="998314"
                      value={item.hsnSac || ""}
                      onChange={(e) => handleItemChange(index, "hsnSac", e.target.value)}
                      className="h-8 text-xs font-mono bg-slate-50 dark:bg-slate-800/40"
                      maxLength={20}
                    />
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-2">
                    <Input
                      type="number"
                      min={0.01}
                      step="any"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      className="h-8 text-xs text-right bg-slate-50 dark:bg-slate-800/40"
                    />
                  </td>

                  {/* Unit */}
                  <td className="py-3 px-2">
                    <select
                      value={item.unit || "NOS"}
                      onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                      className="h-8 w-full px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Unit Price */}
                  <td className="py-3 px-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        handleItemChange(index, "unitPrice", Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      className="h-8 text-xs text-right bg-slate-50 dark:bg-slate-800/40 font-mono"
                    />
                  </td>

                  {/* Discount with Type Toggle */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        step={item.discountType === "percent" ? "1" : "0.01"}
                        placeholder="0"
                        value={item.discountValue || ""}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "discountValue",
                            Math.max(0, parseFloat(e.target.value) || 0)
                          )
                        }
                        className="h-8 text-xs text-right bg-slate-50 dark:bg-slate-800/40"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleItemChange(
                            index,
                            "discountType",
                            item.discountType === "percent" ? "amount" : "percent"
                          )
                        }
                        title={`Switch discount to ${
                          item.discountType === "percent" ? "Rupees" : "Percentage"
                        }`}
                        className="h-8 px-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        {item.discountType === "percent" ? (
                          <Percent className="w-3.5 h-3.5" />
                        ) : (
                          <IndianRupee className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* GST Rate Chips */}
                  {!isBillOfSupply && (
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        {GST_RATES.map((rate) => {
                          const isSelected = (item.gstRate ?? 18) === rate;
                          return (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => handleItemChange(index, "gstRate", rate)}
                              className={cn(
                                "px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer",
                                isSelected
                                  ? "bg-indigo-600 text-white shadow-2xs"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                              )}
                            >
                              {rate}%
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}

                  {/* Line Total */}
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {formatRupeesINR(estTotal)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicateItem(index)}
                        title="Duplicate Row"
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        title="Delete Row"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards (< 768px) */}
      <div className="block md:hidden space-y-4">
        {items.map((item, index) => {
          const gross = item.quantity * item.unitPrice;
          let disc = item.discountValue || 0;
          if (item.discountType === "percent") {
            disc = (gross * (item.discountValue || 0)) / 100;
          }
          const taxable = Math.max(0, gross - disc);
          const gst = isBillOfSupply ? 0 : (taxable * (item.gstRate || 0)) / 100;
          const estTotal = taxable + gst;

          return (
            <div
              key={item.id || index}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400">Item #{index + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicateItem(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length <= 1}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-30"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                  Description *
                </label>
                <Input
                  type="text"
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, "description", e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    HSN/SAC
                  </label>
                  <Input
                    type="text"
                    placeholder="HSN"
                    value={item.hsnSac || ""}
                    onChange={(e) => handleItemChange(index, "hsnSac", e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Unit
                  </label>
                  <select
                    value={item.unit || "NOS"}
                    onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                    className="h-9 w-full px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Qty
                  </label>
                  <Input
                    type="number"
                    min={0.01}
                    value={item.quantity || ""}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="text-xs text-right"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                    Price (₹)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPrice || ""}
                    onChange={(e) =>
                      handleItemChange(index, "unitPrice", Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="text-xs text-right font-mono"
                  />
                </div>
              </div>

              {!isBillOfSupply && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
                    GST Rate
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {GST_RATES.map((rate) => {
                      const isSelected = (item.gstRate ?? 18) === rate;
                      return (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleItemChange(index, "gstRate", rate)}
                          className={cn(
                            "py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            isSelected
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          {rate}%
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Line Total:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {formatRupeesINR(estTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Row Button */}
      <div className="flex justify-between items-center pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={items.length >= 50}
          className="rounded-xl border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold gap-1.5 hover:border-indigo-500 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-indigo-500" />
          <span>Add Line Item ({items.length}/50)</span>
        </Button>
      </div>
    </div>
  );
};

export default LineItemsTable;
