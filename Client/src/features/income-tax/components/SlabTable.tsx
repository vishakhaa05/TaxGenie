import React from "react";
import { useTranslation } from "react-i18next";
import { SlabBreakdownItem } from "../types";
import { formatINR } from "../utils/formatINR";

interface SlabTableProps {
  slabs: SlabBreakdownItem[];
  className?: string;
}

export const SlabTable: React.FC<SlabTableProps> = ({ slabs, className = "" }) => {
  const { t } = useTranslation();

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 ${className}`}>
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th scope="col" className="py-2.5 px-3">
              {t("incomeTax.slab.range", "Income Slab")}
            </th>
            <th scope="col" className="py-2.5 px-3 text-right">
              {t("incomeTax.slab.amountInSlab", "Taxable in Slab")}
            </th>
            <th scope="col" className="py-2.5 px-3 text-center">
              {t("incomeTax.slab.rate", "Rate")}
            </th>
            <th scope="col" className="py-2.5 px-3 text-right">
              {t("incomeTax.slab.tax", "Tax")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
          {slabs.map((item, idx) => {
            const rangeStr =
              item.upTo === null
                ? `Above ${formatINR(item.from, { prefixSymbol: true })}`
                : `${formatINR(item.from, { prefixSymbol: true })} - ${formatINR(item.upTo, { prefixSymbol: true })}`;

            return (
              <tr
                key={idx}
                className={
                  item.tax > 0
                    ? "bg-white dark:bg-slate-900"
                    : "bg-slate-50/40 dark:bg-slate-900/40 opacity-75"
                }
              >
                <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                  {rangeStr}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                  {formatINR(item.taxableAmount, { prefixSymbol: true })}
                </td>
                <td className="py-2.5 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                  {item.rate}%
                </td>
                <td className="py-2.5 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatINR(item.tax, { prefixSymbol: true })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SlabTable;
