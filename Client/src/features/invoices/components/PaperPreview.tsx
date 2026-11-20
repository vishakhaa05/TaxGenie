import React from "react";
import { formatRupeesINR } from "@/features/gst/utils/money";
import {
  InvoiceDocumentType,
  InvoiceStatus,
  InvoiceEngineResult,
  InvoiceItem,
  InvoiceSellerSnapshot,
  InvoiceBuyerSnapshot,
} from "../types";
import { StatusChip } from "./StatusChip";

interface PaperPreviewProps {
  documentType: InvoiceDocumentType;
  status?: InvoiceStatus;
  invoiceNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  seller: InvoiceSellerSnapshot;
  buyer: InvoiceBuyerSnapshot;
  items: InvoiceItem[];
  engineResult?: InvoiceEngineResult | null;
  notes?: string;
  terms?: string;
  paymentDetailsText?: string;
  isOverdue?: boolean;
}

export const PaperPreview: React.FC<PaperPreviewProps> = ({
  documentType,
  status = "draft",
  invoiceNumber,
  invoiceDate,
  dueDate,
  seller,
  buyer,
  items,
  engineResult,
  notes,
  terms,
  paymentDetailsText,
  isOverdue,
}) => {
  const isBillOfSupply = documentType === "bill_of_supply";
  const isIntra = engineResult?.supplyType === "intra";

  return (
    <div
      role="region"
      aria-label="Invoice paper preview"
      className="w-full bg-white text-slate-900 border border-slate-200 dark:border-slate-300 rounded-2xl shadow-lg p-6 sm:p-8 space-y-6 select-text overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
            {isBillOfSupply ? "Bill of Supply" : "Tax Invoice"}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {isBillOfSupply
              ? "Issued under GST composition / non-taxable supply (No tax charged)"
              : "Issued under Section 31 of CGST Act (Original for Recipient)"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusChip status={status} isOverdue={isOverdue} />
        </div>
      </div>

      {/* Seller & Details Meta Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
        {/* Left: Supplier Info */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Supplier / Seller
          </span>
          <h3 className="text-sm font-bold text-slate-900">
            {seller.legalName || "Your Business Name"}
          </h3>
          {seller.tradeName && (
            <p className="text-slate-600 font-medium italic">
              Trade: {seller.tradeName}
            </p>
          )}
          <p className="text-slate-600 leading-relaxed whitespace-pre-line">
            {seller.address || "Business Address"}
          </p>
          <p className="text-slate-700 font-medium">
            State: <span className="font-semibold">{seller.state || "Maharashtra"}</span>
            {seller.pincode ? ` - ${seller.pincode}` : ""}
          </p>
          {seller.gstin && (
            <p className="text-slate-800 font-medium font-mono text-[11px]">
              GSTIN: <span className="font-bold">{seller.gstin}</span>
            </p>
          )}
          {seller.pan && (
            <p className="text-slate-700 font-medium font-mono text-[11px]">
              PAN: <span>{seller.pan}</span>
            </p>
          )}
          {seller.phone && <p className="text-slate-600">Phone: {seller.phone}</p>}
          {seller.email && <p className="text-slate-600">Email: {seller.email}</p>}
        </div>

        {/* Right: Invoice & Buyer Details */}
        <div className="space-y-3 sm:border-l sm:border-slate-100 sm:pl-6">
          <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Invoice No:</span>
              <span className="font-bold font-mono text-slate-900">
                {invoiceNumber || "Assigned when you issue"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Invoice Date:</span>
              <span className="font-semibold text-slate-900">{invoiceDate || "Today"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Due Date:</span>
              <span className="font-semibold text-slate-900">{dueDate || "Immediate"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Place of Supply:</span>
              <span className="font-semibold text-indigo-700">
                {buyer.state || seller.state || "Maharashtra"}
              </span>
            </div>
          </div>

          {/* Billed To / Recipient */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Billed To / Recipient
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              {buyer.name || "Customer Name"}
            </h4>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {buyer.address || "Customer Address"}
            </p>
            <p className="text-slate-700 font-medium">
              State: <span className="font-semibold">{buyer.state || "Maharashtra"}</span>
            </p>
            {buyer.gstin && (
              <p className="text-slate-800 font-medium font-mono text-[11px]">
                GSTIN: <span className="font-bold">{buyer.gstin}</span>
              </p>
            )}
            {buyer.phone && <p className="text-slate-600">Phone: {buyer.phone}</p>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <table className="w-full text-left text-xs divide-y divide-slate-200 border-y border-slate-200">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th scope="col" className="py-2.5 px-2 text-center w-8">#</th>
              <th scope="col" className="py-2.5 px-3 min-w-[140px]">Description</th>
              <th scope="col" className="py-2.5 px-2 text-center w-16">HSN</th>
              <th scope="col" className="py-2.5 px-2 text-right w-14">Qty</th>
              <th scope="col" className="py-2.5 px-2 text-right min-w-[70px]">Rate (₹)</th>
              <th scope="col" className="py-2.5 px-2 text-right min-w-[60px]">Disc</th>
              <th scope="col" className="py-2.5 px-2 text-right min-w-[80px]">Taxable</th>
              {!isBillOfSupply && (
                <>
                  <th scope="col" className="py-2.5 px-2 text-center w-14">GST%</th>
                  {isIntra ? (
                    <>
                      <th scope="col" className="py-2.5 px-2 text-right min-w-[65px]">CGST</th>
                      <th scope="col" className="py-2.5 px-2 text-right min-w-[65px]">SGST</th>
                    </>
                  ) : (
                    <th scope="col" className="py-2.5 px-2 text-right min-w-[75px]">IGST</th>
                  )}
                </>
              )}
              <th scope="col" className="py-2.5 px-3 text-right min-w-[85px]">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {items.map((item, idx) => {
              const calcItem = engineResult?.items?.[idx];
              const taxable = calcItem?.taxableValue ?? item.quantity * item.unitPrice;
              const lineTotal = calcItem?.total ?? taxable;
              const discAmount = calcItem?.discount ?? item.discountValue ?? 0;

              return (
                <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-2 text-center text-slate-400 text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    <div>{item.description || "Line Item"}</div>
                    {item.unit && item.unit !== "NOS" && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        Unit: {item.unit}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                    {item.hsnSac || "-"}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-slate-700">
                    {formatRupeesINR(item.unitPrice).replace("₹", "")}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-slate-500">
                    {discAmount > 0 ? formatRupeesINR(discAmount).replace("₹", "") : "-"}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-slate-800">
                    {formatRupeesINR(taxable).replace("₹", "")}
                  </td>
                  {!isBillOfSupply && (
                    <>
                      <td className="py-2.5 px-2 text-center tabular-nums text-slate-600">
                        {item.gstRate}%
                      </td>
                      {isIntra ? (
                        <>
                          <td className="py-2.5 px-2 text-right tabular-nums text-slate-700">
                            {formatRupeesINR(calcItem?.cgst ?? 0).replace("₹", "")}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-slate-700">
                            {formatRupeesINR(calcItem?.sgst ?? 0).replace("₹", "")}
                          </td>
                        </>
                      ) : (
                        <td className="py-2.5 px-2 text-right tabular-nums text-slate-700">
                          {formatRupeesINR(calcItem?.igst ?? 0).replace("₹", "")}
                        </td>
                      )}
                    </>
                  )}
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900">
                    {formatRupeesINR(lineTotal).replace("₹", "")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Tables & Grand Total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        {/* Left: Tax Summary Grouping (Tax Invoice only) */}
        <div>
          {!isBillOfSupply && engineResult?.taxSummary && engineResult.taxSummary.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tax Summary By Rate
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
                <table className="w-full text-left divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="py-1.5 px-2">Rate</th>
                      <th className="py-1.5 px-2 text-right">Taxable</th>
                      {isIntra ? (
                        <>
                          <th className="py-1.5 px-2 text-right">CGST</th>
                          <th className="py-1.5 px-2 text-right">SGST</th>
                        </>
                      ) : (
                        <th className="py-1.5 px-2 text-right">IGST</th>
                      )}
                      <th className="py-1.5 px-2 text-right">Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {engineResult.taxSummary.map((s) => (
                      <tr key={s.rate}>
                        <td className="py-1 px-2 font-semibold">{s.rate}%</td>
                        <td className="py-1 px-2 text-right">
                          {formatRupeesINR(s.taxableAmount).replace("₹", "")}
                        </td>
                        {isIntra ? (
                          <>
                            <td className="py-1 px-2 text-right">
                              {formatRupeesINR(s.cgst).replace("₹", "")}
                            </td>
                            <td className="py-1 px-2 text-right">
                              {formatRupeesINR(s.sgst).replace("₹", "")}
                            </td>
                          </>
                        ) : (
                          <td className="py-1 px-2 text-right">
                            {formatRupeesINR(s.igst).replace("₹", "")}
                          </td>
                        )}
                        <td className="py-1 px-2 text-right font-semibold text-slate-800">
                          {formatRupeesINR(s.totalGst).replace("₹", "")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Totals Box */}
        <div className="space-y-2 text-xs divide-y divide-slate-100 sm:pl-6">
          <div className="flex justify-between items-center text-slate-600 pt-1">
            <span>{isBillOfSupply ? "Subtotal" : "Taxable Subtotal"}:</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {formatRupeesINR(engineResult?.subtotal ?? 0)}
            </span>
          </div>

          {!isBillOfSupply && (
            <>
              {isIntra ? (
                <>
                  <div className="flex justify-between items-center text-slate-600 pt-1.5">
                    <span>Central GST (CGST):</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {formatRupeesINR(engineResult?.totalCgst ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 pt-1.5">
                    <span>State GST (SGST):</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {formatRupeesINR(engineResult?.totalSgst ?? 0)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center text-slate-600 pt-1.5">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {formatRupeesINR(engineResult?.totalIgst ?? 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-indigo-700 font-semibold pt-1.5">
                <span>Total GST:</span>
                <span className="tabular-nums font-bold">
                  {formatRupeesINR(engineResult?.totalGst ?? 0)}
                </span>
              </div>
            </>
          )}

          {engineResult?.roundOff !== undefined && engineResult.roundOff !== 0 && (
            <div className="flex justify-between items-center text-slate-500 pt-1.5 text-[11px]">
              <span>Round-off:</span>
              <span className="tabular-nums font-mono">
                {engineResult.roundOff > 0 ? "+" : ""}
                {formatRupeesINR(engineResult.roundOff)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-extrabold text-sm sm:text-base text-slate-900">
              Grand Total:
            </span>
            <span className="font-extrabold text-base sm:text-lg text-indigo-700 tabular-nums">
              {formatRupeesINR(engineResult?.grandTotal ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      {engineResult?.amountInWords && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
          <span className="font-bold text-slate-700">Amount in Words: </span>
          <span className="font-medium text-slate-800 italic">
            {engineResult.amountInWords}
          </span>
        </div>
      )}

      {/* Footer Meta: Payment Details, Terms & Signature */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
        <div className="space-y-3">
          {paymentDetailsText && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payment Details / Bank Info
              </span>
              <p className="text-slate-700 whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[11px]">
                {paymentDetailsText}
              </p>
            </div>
          )}

          {terms && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Terms & Conditions
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px] whitespace-pre-line">
                {terms}
              </p>
            </div>
          )}

          {notes && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Notes
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px] whitespace-pre-line">
                {notes}
              </p>
            </div>
          )}
        </div>

        {/* Right: Signature */}
        <div className="flex flex-col justify-end items-center sm:items-end text-center sm:text-right pt-6 sm:pt-0">
          <div className="w-48 border-t border-slate-400 pt-1.5 text-center">
            <p className="text-xs font-bold text-slate-800">
              {seller.signatureLabel || "Authorised Signatory"}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {seller.legalName || "Seller Name"}
            </p>
          </div>
        </div>
      </div>

      {/* Computer Generated Footer */}
      <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
        This is a computer-generated invoice created with TaxGenie. Valid without physical stamp.
      </div>
    </div>
  );
};

export default PaperPreview;
