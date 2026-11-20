import PDFDocument from "pdfkit";
import path from "path";
import { GST_STATES } from "../engine/gst/states";

function getStateNameAndCode(stateInput: string): string {
  if (!stateInput) return "Unknown";
  const clean = stateInput.trim().toLowerCase();
  const found = GST_STATES.find(
    (s) => s.code.toLowerCase() === clean || s.name.toLowerCase() === clean
  );
  if (found) {
    return `${found.name} (${found.code})`;
  }
  return stateInput;
}

export function formatINR(val: number): string {
  const isNegative = val < 0;
  const abs = Math.abs(val || 0);
  const [intPartRaw, decPart] = abs.toFixed(2).split(".");
  let intPart = intPartRaw || "0";

  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    intPart = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  }

  return `${isNegative ? "-" : ""}₹ ${intPart}.${decPart || "00"}`;
}

export class PdfService {
  public static async generateInvoicePdf(invoice: any): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const regularFont = path.join(__dirname, "../pdf/fonts/NotoSans-Regular.ttf");
        const boldFont = path.join(__dirname, "../pdf/fonts/NotoSans-Bold.ttf");

        const doc = new PDFDocument({
          size: "A4",
          margin: 36, // 0.5 inch margins
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (err) => reject(err));

        doc.registerFont("NotoSans", regularFont);
        doc.registerFont("NotoSans-Bold", boldFont);

        const isBillOfSupply = invoice.documentType === "bill_of_supply";
        const isTaxInvoice = !isBillOfSupply;
        const res = invoice.engineResult || {};
        const isIntra = res.supplyType === "intra";
        const seller = invoice.seller || {};
        const buyer = invoice.buyer || {};
        const items = invoice.items || [];

        const startX = 36;
        const pageWidth = 595.28 - 72; // A4 width 595.28 - 72 margin = 523.28

        // Header Title
        doc
          .font("NotoSans-Bold")
          .fontSize(18)
          .fillColor("#0f172a")
          .text(isTaxInvoice ? "TAX INVOICE" : "BILL OF SUPPLY", startX, 36, {
            align: "center",
          });

        if (invoice.status && invoice.status !== "issued") {
          const statusBadge = invoice.status.toUpperCase();
          const badgeColor =
            statusBadge === "PAID"
              ? "#16a34a"
              : statusBadge === "CANCELLED"
              ? "#dc2626"
              : "#64748b";

          doc
            .font("NotoSans-Bold")
            .fontSize(9)
            .fillColor(badgeColor)
            .text(`[ ${statusBadge} ]`, startX, 58, { align: "center" });
        }

        // Top separator
        let y = 74;
        doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(startX, y).lineTo(startX + pageWidth, y).stroke();
        y += 8;

        // Seller Block (Left) & Invoice Metadata (Right)
        const colWidth = pageWidth / 2;

        // Left: Seller
        doc.font("NotoSans-Bold").fontSize(10).fillColor("#1e293b").text("SUPPLIER / SELLER", startX, y);
        let leftY = y + 14;
        doc.font("NotoSans-Bold").fontSize(11).fillColor("#0f172a").text(seller.legalName || "Seller Name", startX, leftY);
        leftY += 14;

        if (seller.tradeName) {
          doc.font("NotoSans").fontSize(9).fillColor("#475569").text(`Trade Name: ${seller.tradeName}`, startX, leftY);
          leftY += 12;
        }

        doc.font("NotoSans").fontSize(8.5).fillColor("#334155").text(seller.address || "", startX, leftY, { width: colWidth - 20 });
        leftY += doc.heightOfString(seller.address || "", { width: colWidth - 20 }) + 3;

        doc.text(`State: ${getStateNameAndCode(seller.state || "")}`, startX, leftY);
        leftY += 11;

        if (seller.gstin) {
          doc.font("NotoSans-Bold").text(`GSTIN: `, startX, leftY, { continued: true });
          doc.font("NotoSans").text(seller.gstin);
          leftY += 11;
        }

        if (seller.pan) {
          doc.font("NotoSans-Bold").text(`PAN: `, startX, leftY, { continued: true });
          doc.font("NotoSans").text(seller.pan);
          leftY += 11;
        }

        if (seller.phone) {
          doc.font("NotoSans").text(`Phone: ${seller.phone}`, startX, leftY);
          leftY += 11;
        }

        // Right: Invoice Metadata & Buyer
        let rightX = startX + colWidth + 10;
        let rightY = y;

        doc.font("NotoSans-Bold").fontSize(10).fillColor("#1e293b").text("INVOICE DETAILS", rightX, rightY);
        rightY += 14;

        doc.font("NotoSans-Bold").fontSize(9).fillColor("#334155").text(`Invoice No: `, rightX, rightY, { continued: true });
        doc.font("NotoSans").text(invoice.invoiceNumber || "DRAFT (Assigned on Issue)");
        rightY += 12;

        doc.font("NotoSans-Bold").text(`Invoice Date: `, rightX, rightY, { continued: true });
        doc.font("NotoSans").text(invoice.invoiceDate || "");
        rightY += 12;

        doc.font("NotoSans-Bold").text(`Due Date: `, rightX, rightY, { continued: true });
        doc.font("NotoSans").text(invoice.dueDate || "Immediate");
        rightY += 12;

        doc.font("NotoSans-Bold").text(`Place of Supply: `, rightX, rightY, { continued: true });
        doc.font("NotoSans").text(getStateNameAndCode(buyer.state || seller.state || ""));
        rightY += 15;

        // Buyer Section
        doc.font("NotoSans-Bold").fontSize(10).fillColor("#1e293b").text("RECIPIENT / BILLED TO", rightX, rightY);
        rightY += 14;

        doc.font("NotoSans-Bold").fontSize(10.5).fillColor("#0f172a").text(buyer.name || "Customer", rightX, rightY);
        rightY += 13;

        doc.font("NotoSans").fontSize(8.5).fillColor("#334155").text(buyer.address || "", rightX, rightY, { width: colWidth - 20 });
        rightY += doc.heightOfString(buyer.address || "", { width: colWidth - 20 }) + 3;

        doc.text(`State: ${getStateNameAndCode(buyer.state || "")}`, rightX, rightY);
        rightY += 11;

        if (buyer.gstin) {
          doc.font("NotoSans-Bold").text(`GSTIN: `, rightX, rightY, { continued: true });
          doc.font("NotoSans").text(buyer.gstin);
          rightY += 11;
        }

        // Section divider
        y = Math.max(leftY, rightY) + 12;
        doc.strokeColor("#cbd5e1").lineWidth(0.75).moveTo(startX, y).lineTo(startX + pageWidth, y).stroke();
        y += 10;

        // Table Header & Rows
        // Columns setup
        // Tax Invoice Intra: #, Description, HSN, Qty, Rate, Disc, Taxable, GST %, CGST, SGST, Total
        // Tax Invoice Inter: #, Description, HSN, Qty, Rate, Disc, Taxable, GST %, IGST, Total
        // Bill of Supply: #, Description, HSN, Qty, Unit, Unit Price, Disc, Amount

        const drawTableHeader = (currY: number) => {
          doc.rect(startX, currY, pageWidth, 20).fill("#f8fafc");
          doc.strokeColor("#cbd5e1").lineWidth(0.5).rect(startX, currY, pageWidth, 20).stroke();

          doc.font("NotoSans-Bold").fontSize(8).fillColor("#334155");

          if (isBillOfSupply) {
            doc.text("#", startX + 4, currY + 6, { width: 18, align: "center" });
            doc.text("Description", startX + 24, currY + 6, { width: 190 });
            doc.text("HSN/SAC", startX + 218, currY + 6, { width: 50 });
            doc.text("Qty", startX + 272, currY + 6, { width: 40, align: "right" });
            doc.text("Unit", startX + 316, currY + 6, { width: 36 });
            doc.text("Rate", startX + 356, currY + 6, { width: 54, align: "right" });
            doc.text("Disc", startX + 414, currY + 6, { width: 44, align: "right" });
            doc.text("Amount", startX + 462, currY + 6, { width: 56, align: "right" });
          } else if (isIntra) {
            doc.text("#", startX + 2, currY + 6, { width: 16, align: "center" });
            doc.text("Description", startX + 20, currY + 6, { width: 124 });
            doc.text("HSN", startX + 146, currY + 6, { width: 38 });
            doc.text("Qty", startX + 186, currY + 6, { width: 28, align: "right" });
            doc.text("Price", startX + 216, currY + 6, { width: 48, align: "right" });
            doc.text("Disc", startX + 266, currY + 6, { width: 34, align: "right" });
            doc.text("Taxable", startX + 302, currY + 6, { width: 50, align: "right" });
            doc.text("GST%", startX + 354, currY + 6, { width: 28, align: "right" });
            doc.text("CGST", startX + 384, currY + 6, { width: 44, align: "right" });
            doc.text("SGST", startX + 430, currY + 6, { width: 44, align: "right" });
            doc.text("Total", startX + 476, currY + 6, { width: 44, align: "right" });
          } else {
            // Inter
            doc.text("#", startX + 2, currY + 6, { width: 16, align: "center" });
            doc.text("Description", startX + 20, currY + 6, { width: 140 });
            doc.text("HSN", startX + 162, currY + 6, { width: 44 });
            doc.text("Qty", startX + 208, currY + 6, { width: 32, align: "right" });
            doc.text("Price", startX + 242, currY + 6, { width: 54, align: "right" });
            doc.text("Disc", startX + 298, currY + 6, { width: 40, align: "right" });
            doc.text("Taxable", startX + 340, currY + 6, { width: 56, align: "right" });
            doc.text("GST%", startX + 398, currY + 6, { width: 32, align: "right" });
            doc.text("IGST", startX + 432, currY + 6, { width: 44, align: "right" });
            doc.text("Total", startX + 478, currY + 6, { width: 42, align: "right" });
          }
        };

        drawTableHeader(y);
        y += 20;

        // Table Rows Loop
        const pageBottomLimit = 750;

        for (let idx = 0; idx < items.length; idx++) {
          const it = items[idx];
          const calculatedItem = res.items?.[idx] || {};

          const desc = it.description || it.name || `Item ${idx + 1}`;
          const descWidth = isBillOfSupply ? 190 : isIntra ? 124 : 140;
          doc.font("NotoSans").fontSize(8);
          const descHeight = Math.max(18, doc.heightOfString(desc, { width: descWidth }) + 6);

          // Page break check
          if (y + descHeight > pageBottomLimit) {
            doc.addPage();
            y = 36;
            drawTableHeader(y);
            y += 20;
          }

          // Row background alternate
          if (idx % 2 === 1) {
            doc.rect(startX, y, pageWidth, descHeight).fill("#fafafa");
          }
          doc.strokeColor("#e2e8f0").lineWidth(0.5).rect(startX, y, pageWidth, descHeight).stroke();

          doc.font("NotoSans").fontSize(8).fillColor("#0f172a");

          const textY = y + 4;
          const qtyText = `${it.quantity} ${it.unit || ""}`.trim();
          const unitPriceRupees =
            typeof it.unitPrice === "number"
              ? it.unitPrice
              : (it.unitPricePaise || 0) / 100;

          if (isBillOfSupply) {
            doc.text(String(idx + 1), startX + 4, textY, { width: 18, align: "center" });
            doc.text(desc, startX + 24, textY, { width: 190 });
            doc.text(it.hsnSac || "-", startX + 218, textY, { width: 50 });
            doc.text(String(it.quantity), startX + 272, textY, { width: 40, align: "right" });
            doc.text(it.unit || "NOS", startX + 316, textY, { width: 36 });
            doc.text(formatINR(unitPriceRupees).replace("₹ ", ""), startX + 356, textY, { width: 54, align: "right" });
            doc.text(formatINR(calculatedItem.discount || 0).replace("₹ ", ""), startX + 414, textY, { width: 44, align: "right" });
            doc.text(formatINR(calculatedItem.total || calculatedItem.taxableValue || 0).replace("₹ ", ""), startX + 462, textY, { width: 56, align: "right" });
          } else if (isIntra) {
            doc.text(String(idx + 1), startX + 2, textY, { width: 16, align: "center" });
            doc.text(desc, startX + 20, textY, { width: 124 });
            doc.text(it.hsnSac || "-", startX + 146, textY, { width: 38 });
            doc.text(qtyText, startX + 186, textY, { width: 28, align: "right" });
            doc.text(formatINR(unitPriceRupees).replace("₹ ", ""), startX + 216, textY, { width: 48, align: "right" });
            doc.text(formatINR(calculatedItem.discount || 0).replace("₹ ", ""), startX + 266, textY, { width: 34, align: "right" });
            doc.text(formatINR(calculatedItem.taxableValue || 0).replace("₹ ", ""), startX + 302, textY, { width: 50, align: "right" });
            doc.text(`${it.gstRate || 0}%`, startX + 354, textY, { width: 28, align: "right" });
            doc.text(formatINR(calculatedItem.cgst || 0).replace("₹ ", ""), startX + 384, textY, { width: 44, align: "right" });
            doc.text(formatINR(calculatedItem.sgst || 0).replace("₹ ", ""), startX + 430, textY, { width: 44, align: "right" });
            doc.text(formatINR(calculatedItem.total || 0).replace("₹ ", ""), startX + 476, textY, { width: 44, align: "right" });
          } else {
            // Inter
            doc.text(String(idx + 1), startX + 2, textY, { width: 16, align: "center" });
            doc.text(desc, startX + 20, textY, { width: 140 });
            doc.text(it.hsnSac || "-", startX + 162, textY, { width: 44 });
            doc.text(qtyText, startX + 208, textY, { width: 32, align: "right" });
            doc.text(formatINR(unitPriceRupees).replace("₹ ", ""), startX + 242, textY, { width: 54, align: "right" });
            doc.text(formatINR(calculatedItem.discount || 0).replace("₹ ", ""), startX + 298, textY, { width: 40, align: "right" });
            doc.text(formatINR(calculatedItem.taxableValue || 0).replace("₹ ", ""), startX + 340, textY, { width: 56, align: "right" });
            doc.text(`${it.gstRate || 0}%`, startX + 398, textY, { width: 32, align: "right" });
            doc.text(formatINR(calculatedItem.igst || 0).replace("₹ ", ""), startX + 432, textY, { width: 44, align: "right" });
            doc.text(formatINR(calculatedItem.total || 0).replace("₹ ", ""), startX + 478, textY, { width: 42, align: "right" });
          }

          y += descHeight;
        }

        y += 10;

        // Check page break for Totals & Summaries
        if (y + 160 > pageBottomLimit) {
          doc.addPage();
          y = 36;
        }

        // Totals Box & Tax Summary Box
        const totalsBoxWidth = 220;
        const totalsX = startX + pageWidth - totalsBoxWidth;

        // Left of Totals: Tax Summary Table (for Tax Invoice)
        if (isTaxInvoice && Array.isArray(res.taxSummary) && res.taxSummary.length > 0) {
          const taxTableWidth = 270;
          doc.font("NotoSans-Bold").fontSize(8.5).fillColor("#1e293b").text("TAX SUMMARY", startX, y);
          let tY = y + 12;

          doc.rect(startX, tY, taxTableWidth, 16).fill("#f1f5f9");
          doc.strokeColor("#cbd5e1").lineWidth(0.5).rect(startX, tY, taxTableWidth, 16).stroke();
          doc.font("NotoSans-Bold").fontSize(7.5).fillColor("#334155");

          if (isIntra) {
            doc.text("Rate", startX + 4, tY + 4, { width: 36 });
            doc.text("Taxable", startX + 44, tY + 4, { width: 66, align: "right" });
            doc.text("CGST", startX + 114, tY + 4, { width: 48, align: "right" });
            doc.text("SGST", startX + 166, tY + 4, { width: 48, align: "right" });
            doc.text("Total Tax", startX + 218, tY + 4, { width: 48, align: "right" });
          } else {
            doc.text("Rate", startX + 4, tY + 4, { width: 40 });
            doc.text("Taxable", startX + 50, tY + 4, { width: 76, align: "right" });
            doc.text("IGST", startX + 132, tY + 4, { width: 64, align: "right" });
            doc.text("Total Tax", startX + 202, tY + 4, { width: 64, align: "right" });
          }
          tY += 16;

          for (const s of res.taxSummary) {
            doc.rect(startX, tY, taxTableWidth, 14).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
            doc.font("NotoSans").fontSize(7.5).fillColor("#0f172a");

            if (isIntra) {
              doc.text(`${s.rate}%`, startX + 4, tY + 3, { width: 36 });
              doc.text(formatINR(s.taxableAmount || 0).replace("₹ ", ""), startX + 44, tY + 3, { width: 66, align: "right" });
              doc.text(formatINR(s.cgst || 0).replace("₹ ", ""), startX + 114, tY + 3, { width: 48, align: "right" });
              doc.text(formatINR(s.sgst || 0).replace("₹ ", ""), startX + 166, tY + 3, { width: 48, align: "right" });
              doc.text(formatINR(s.totalGst || 0).replace("₹ ", ""), startX + 218, tY + 3, { width: 48, align: "right" });
            } else {
              doc.text(`${s.rate}%`, startX + 4, tY + 3, { width: 40 });
              doc.text(formatINR(s.taxableAmount || 0).replace("₹ ", ""), startX + 50, tY + 3, { width: 76, align: "right" });
              doc.text(formatINR(s.igst || 0).replace("₹ ", ""), startX + 132, tY + 3, { width: 64, align: "right" });
              doc.text(formatINR(s.totalGst || 0).replace("₹ ", ""), startX + 202, tY + 3, { width: 64, align: "right" });
            }
            tY += 14;
          }
        }

        // Totals Box (Right)
        let curTotalsY = y;
        const drawTotalLine = (label: string, amountStr: string, isBold = false) => {
          doc.font(isBold ? "NotoSans-Bold" : "NotoSans").fontSize(isBold ? 9.5 : 8.5).fillColor("#1e293b");
          doc.text(label, totalsX, curTotalsY, { width: 110 });
          doc.text(amountStr, totalsX + 110, curTotalsY, { width: 110, align: "right" });
          curTotalsY += isBold ? 16 : 13;
        };

        drawTotalLine(isBillOfSupply ? "Subtotal:" : "Taxable Subtotal:", formatINR(res.subtotal || 0));

        if (isTaxInvoice) {
          if (isIntra) {
            drawTotalLine("CGST:", formatINR(res.totalCgst || 0));
            drawTotalLine("SGST:", formatINR(res.totalSgst || 0));
          } else {
            drawTotalLine("IGST:", formatINR(res.totalIgst || 0));
          }
          drawTotalLine("Total GST:", formatINR(res.totalGst || 0));
        }

        if (res.roundOff !== 0 && res.roundOff !== undefined) {
          drawTotalLine("Round-off:", formatINR(res.roundOff));
        }

        doc.strokeColor("#cbd5e1").lineWidth(0.75).moveTo(totalsX, curTotalsY).lineTo(totalsX + totalsBoxWidth, curTotalsY).stroke();
        curTotalsY += 5;

        doc.rect(totalsX - 4, curTotalsY - 2, totalsBoxWidth + 8, 22).fill("#f1f5f9");
        doc.font("NotoSans-Bold").fontSize(11).fillColor("#0f172a");
        doc.text("GRAND TOTAL:", totalsX, curTotalsY + 4, { width: 110 });
        doc.text(formatINR(res.grandTotal || 0), totalsX + 110, curTotalsY + 4, { width: 110, align: "right" });
        curTotalsY += 28;

        y = Math.max(y + 90, curTotalsY + 10);

        // Amount in Words
        if (res.amountInWords) {
          doc.font("NotoSans-Bold").fontSize(8.5).fillColor("#1e293b").text("Amount in Words: ", startX, y, { continued: true });
          doc.font("NotoSans").fillColor("#334155").text(res.amountInWords);
          y += 18;
        }

        // Notes, Terms & Payment Details
        const footerColWidth = pageWidth / 2;

        let leftFooterY = y;
        if (invoice.notes) {
          doc.font("NotoSans-Bold").fontSize(8).fillColor("#1e293b").text("Notes:", startX, leftFooterY);
          leftFooterY += 10;
          doc.font("NotoSans").fontSize(7.5).fillColor("#475569").text(invoice.notes, startX, leftFooterY, { width: footerColWidth - 20 });
          leftFooterY += doc.heightOfString(invoice.notes, { width: footerColWidth - 20 }) + 6;
        }

        if (invoice.terms) {
          doc.font("NotoSans-Bold").fontSize(8).fillColor("#1e293b").text("Terms & Conditions:", startX, leftFooterY);
          leftFooterY += 10;
          doc.font("NotoSans").fontSize(7.5).fillColor("#475569").text(invoice.terms, startX, leftFooterY, { width: footerColWidth - 20 });
          leftFooterY += doc.heightOfString(invoice.terms, { width: footerColWidth - 20 }) + 6;
        }

        let rightFooterY = y;
        if (invoice.paymentDetailsText) {
          doc.font("NotoSans-Bold").fontSize(8).fillColor("#1e293b").text("Payment Details / Bank Info:", startX + footerColWidth, rightFooterY);
          rightFooterY += 10;
          doc.font("NotoSans").fontSize(7.5).fillColor("#475569").text(invoice.paymentDetailsText, startX + footerColWidth, rightFooterY, { width: footerColWidth - 10 });
          rightFooterY += doc.heightOfString(invoice.paymentDetailsText, { width: footerColWidth - 10 }) + 8;
        }

        // Signature Area
        const sigY = Math.max(leftFooterY, rightFooterY) + 15;
        const sigX = startX + pageWidth - 160;

        doc.strokeColor("#94a3b8").lineWidth(0.5).moveTo(sigX, sigY + 30).lineTo(sigX + 150, sigY + 30).stroke();
        doc.font("NotoSans-Bold").fontSize(8).fillColor("#1e293b").text(seller.signatureLabel || "Authorised Signatory", sigX, sigY + 34, { width: 150, align: "center" });
        doc.font("NotoSans").fontSize(7.5).fillColor("#64748b").text(seller.legalName || "", sigX, sigY + 44, { width: 150, align: "center" });

        // Add Footers & Page Numbers across all pages in second pass
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);

          // Computer generated footer
          doc.font("NotoSans").fontSize(7).fillColor("#94a3b8").text(
            "This is a computer-generated invoice created with TaxGenie.",
            startX,
            800,
            { width: 350 }
          );

          // Page X of Y
          doc.text(
            `Page ${i + 1} of ${range.count}`,
            startX + pageWidth - 100,
            800,
            { width: 100, align: "right" }
          );
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
