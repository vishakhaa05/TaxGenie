export function sanitizeCsvCell(val: any): string {
  if (val === null || val === undefined) return "";
  let str = String(val);

  // CSV Formula Injection mitigation: prefix any value starting with =, +, -, @, or tab
  if (/^[=+\-@\t]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes and enclose in quotes if it contains comma, quotes, or newlines
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export class CsvExportService {
  public static generateInvoicesCsv(invoices: any[]): string {
    const headers = [
      "Invoice Number",
      "Date",
      "Due Date",
      "Document Type",
      "Status",
      "Customer Name",
      "Customer GSTIN",
      "Customer State",
      "Taxable Value (INR)",
      "CGST (INR)",
      "SGST (INR)",
      "IGST (INR)",
      "Total GST (INR)",
      "Grand Total (INR)",
    ];

    const rows: string[] = [headers.map(sanitizeCsvCell).join(",")];

    for (const inv of invoices) {
      const res = inv.engineResult || {};
      const buyer = inv.buyer || {};

      const row = [
        inv.invoiceNumber || "DRAFT",
        inv.invoiceDate || "",
        inv.dueDate || "",
        inv.documentType === "bill_of_supply" ? "Bill of Supply" : "Tax Invoice",
        inv.status ? inv.status.toUpperCase() : "DRAFT",
        buyer.name || "",
        buyer.gstin || "",
        buyer.state || "",
        (res.subtotal ?? 0).toFixed(2),
        (res.totalCgst ?? 0).toFixed(2),
        (res.totalSgst ?? 0).toFixed(2),
        (res.totalIgst ?? 0).toFixed(2),
        (res.totalGst ?? 0).toFixed(2),
        (res.grandTotal ?? 0).toFixed(2),
      ];

      rows.push(row.map(sanitizeCsvCell).join(","));
    }

    return rows.join("\r\n");
  }
}
