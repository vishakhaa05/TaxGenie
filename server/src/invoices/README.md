# TaxGenie Invoice Engine & Invoicing Subsystem (Phase 6)

## 1. Overview
The TaxGenie Invoicing subsystem empowers freelancers, consultants, and small businesses in India to create, issue, and manage statutory Goods and Services Tax (GST) invoices and Bills of Supply.

Key design principles:
- **Server-Authoritative Math**: Totals, taxes, and round-offs are computed on the backend using integer paise. Client-supplied totals are discarded.
- **Strict Immutability**: Once an invoice is issued, it is locked. The seller and buyer snapshots, line items, and computed taxes cannot be edited or deleted.
- **Statutory Document Types**:
  - **Tax Invoice**: Issued exclusively by GST-registered sellers with a validated GSTIN. Displays full CGST, SGST, or IGST tax splits and per-rate summary.
  - **Bill of Supply**: Issued by unregistered sellers or composition scheme taxpayers. No tax is levied, and tax columns are suppressed.

---

## 2. Sequential Numbering Architecture

### Atomic Sequence Generation
Sequential numbering is managed through the `Counter` collection using atomic MongoDB operations:
```ts
const counter = await Counter.findOneAndUpdate(
  { userId, key: counterKey },
  { $inc: { nextNumber: 1 } },
  { new: true, upsert: true }
);
```

### Key Formatting Rules:
1. **Prefix**: Defaults to `INV`, configurable per business profile (alphanumeric, max 6 characters).
2. **Financial Year Reset**: When `resetEachFinancialYear: true`, the sequence resets to 0001 on April 1st of each Indian Financial Year:
   - Example FY 2026-27 format: `INV-2026-27-0001`
   - Example without FY reset: `INV-0001`
3. **Statutory Length Limit**: Under Rule 46(b) of the CGST Rules, invoice numbers must not exceed **16 characters** (consisting of letters, digits, hyphens, and slashes).
   - If a generated number exceeds 16 characters, the server immediately returns `INVOICE_NUMBER_TOO_LONG` before persisting.
   - *TODO: Verify exact statutory character set restrictions and edge-case prefix combinations with GSTN guidelines before production launch.*

---

## 3. Immutability & Lifecycle Rules

```
       [Create Draft]
             │
             ▼
       ┌───────────┐
       │   Draft   │ ◄─── Editable, No Invoice Number assigned
       └─────┬─────┘
             │ (Issue Action)
             ▼
       ┌───────────┐
       │  Issued   │ ◄─── IMMUTABLE: Number allocated, Buyer/Seller snapshotted
       └──┬──────┬─┘
          │      │
(Mark Paid│      │(Cancel)
          ▼      ▼
       ┌──────┐ ┌───────────┐
       │ Paid │ │ Cancelled │ ◄── Retains number for audit; excluded from revenue
       └──────┘ └───────────┘
```

1. **Drafts**:
   - Do not have an invoice number (`invoiceNumber = null`).
   - Can be updated via `PATCH /api/invoices/:id` or deleted via `DELETE /api/invoices/:id`.
2. **Issuing**:
   - Assigns the next sequential invoice number atomically.
   - Takes immutable snapshots of the seller's active `BusinessProfile` and buyer details.
   - Recomputes all totals and statutory tax breakdowns with the Phase 2 GST engine.
   - Sets status to `issued`.
3. **Issued Invoices**:
   - Cannot be edited or deleted (`INVOICE_NOT_EDITABLE` error code 400).
   - Can be marked as `paid` or reverted to `issued` (`mark-unpaid`).
   - Can be `cancelled`.
4. **Cancelled Invoices**:
   - Keep their sequential invoice number permanently to avoid gaps in statutory books.
   - Are excluded from monthly tax summaries, GST return preparation helpers, and dashboard KPI revenue.
5. **Overdue Status**:
   - `overdue` is computed dynamically: `status === "issued" && dueDate < now`. It is never stored as an editable database field.

---

## 4. PDF Generation Architecture

- **Engine**: Built server-side using `pdfkit` (streaming directly to HTTP response, avoiding headless browser overhead).
- **Format**: Standard A4 portrait, print-friendly monochrome and slate palette.
- **Embedded Fonts**:
  - `NotoSans-Regular.ttf` and `NotoSans-Bold.ttf` embedded natively.
  - Full Unicode support including the Indian Rupee symbol (`₹` / U+20B9).
  - License: SIL Open Font License (OFL 1.1) located at `Backend/src/pdf/fonts/OFL.txt`.
- **Statutory Multi-Page Handling**:
  - Invoices with up to 50 line items dynamically paginate.
  - Table headers are repeated at the top of every subsequent page.
  - Long item descriptions wrap gracefully without cutting text rows in half.
- **Guest PDF Endpoint**:
  - `POST /api/invoices/pdf` allows unauthenticated users to generate and download PDFs statelessly.
  - Rate limited to 5 requests per hour per IP.
  - No customer, business, or financial data is persisted.

---

## 5. CGST Rule 46 Mandatory Fields Checklist

| Rule 46 Field | TaxGenie Implementation | Status | Notes |
|:---|:---|:---:|:---|
| (a) Name, address, GSTIN of supplier | `seller.legalName`, `seller.address`, `seller.gstin` | ✅ | Required for Tax Invoices |
| (b) Consecutive serial number (max 16 chars) | `invoiceNumber` (atomic `Counter`) | ✅ | Verified $\le 16$ chars |
| (c) Date of issue | `invoiceDate` (YYYY-MM-DD) | ✅ | |
| (d) Name, address, GSTIN of recipient | `buyer.name`, `buyer.address`, `buyer.gstin` | ✅ | If registered |
| (e) Place of supply & state code | `buyer.state` (code + name, e.g., 27-Maharashtra) | ✅ | |
| (f) HSN / SAC code | `item.hsnSac` | ✅ | Optional for $\le 5$ Cr turnover |
| (g) Description of goods/services | `item.description` | ✅ | |
| (h) Quantity and Unit | `item.quantity`, `item.unit` (PCS, HRS, KGS, etc.) | ✅ | |
| (i) Total value of supply | `engineResult.subtotal` | ✅ | |
| (j) Taxable value after discount | `engineResult.taxableValue` | ✅ | |
| (k) Rate of tax (CGST, SGST, IGST) | `item.gstRate` (0%, 5%, 18%, 40%) | ✅ | |
| (l) Amount of tax charged | Split by CGST/SGST/IGST | ✅ | Intra vs Inter state logic |
| (m) Place of delivery if different | `buyer.address` | ✅ | |
| (n) Reverse charge applicable | OUT OF SCOPE | ⚠️ | Shown with disclaimer |
| (o) Signature of supplier / authorised rep | `seller.signatureLabel` | ✅ | Text signature box |

### Statutory TODOs & Verification Items for Launch:
- [ ] **TODO-VERIFY-1**: Verify current e-invoicing turnover threshold under Notification No. 10/2023-Central Tax (currently ₹5 Crore aggregate turnover in any preceding financial year).
- [ ] **TODO-VERIFY-2**: Verify if 6-digit HSN is mandatory for B2B supplies above ₹5 Crore turnover under Notification No. 78/2020.
- [ ] **TODO-VERIFY-3**: Verify Devanagari/Hindi font rendering support for bilingual invoices in Phase 7.
- [ ] **TODO-VERIFY-4**: Verify state code mapping for newly designated Union Territories (Dadra & Nagar Haveli and Daman & Diu unified code 26, Ladakh code 38).
