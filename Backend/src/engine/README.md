# TaxGenie Calculation Engines (Phase 2)

Pure, deterministic, and fully tested calculation engines for Indian Income Tax and Goods & Services Tax (GST).

---

## 1. Architecture & Core Principles

- **Location**: `Backend/src/engine/` (mirrored transparently at `server/src/engine/`).
- **Purity**: All engine functions are pure. They have **zero** dependencies on Express, MongoDB, HTTP status codes, `Date.now`, randomness, or console output.
- **Rules as Arguments**: All statutory numbers, slabs, rates, limits, and thresholds are passed as an explicit `rules` argument. **Nothing numeric is hard-coded in engine logic**.
- **Strict Integer Money Arithmetic**:
  - **Income Tax Engine**: Operates exclusively in **whole rupees** (`number` integers).
  - **GST Engine**: Operates exclusively in **integer PAISE** (`amount * 100`) to eliminate floating-point representation drift. Converts back to rupees with 2-decimal precision strictly at boundary edges.
- **Unified Rounding**: Standard **Round Half-Up** (`roundHalfUp(num)`) is defined in **one shared helper** (`shared/rounding.ts`) using `Number.EPSILON` to prevent IEEE 754 binary floating-point representation quirks.
- **Auditability**: Every engine result returns itemized calculation steps with **i18n translation keys** and structured parameter objects rather than hard-coded English strings.

---

## 2. Directory Structure

```
Backend/src/engine/ (also accessible via server/src/engine/)
├── index.ts                  # Root export of tax, gst, and shared modules
├── shared/
│   ├── errors.ts             # Typed domain errors (EngineValidationError, TaxCalculationError, GstCalculationError)
│   ├── rounding.ts           # Shared roundHalfUp and roundToNearestTen
│   ├── formatINR.ts          # Indian currency digit grouping (e.g., 12,34,567)
│   └── index.ts
├── tax/
│   ├── types.ts              # TaxYearRules, TaxInput, RegimeResult, ComparisonResult, TaxStep, TaxWarning
│   ├── slabs.ts              # Pure slab tax calculator with detailed slab breakdowns
│   ├── hra.ts                # Section 10(13A) HRA exemption calculator (metro vs non-metro)
│   ├── newRegime.ts          # Section 115BAC calculator with 87A rebate & marginal relief
│   ├── oldRegime.ts          # Old regime calculator with 80C/80CCD/80D/24b caps and age-based slabs
│   ├── breakEven.ts          # Binary search calculator for break-even deduction point
│   ├── compare.ts            # Comparison engine (recommends new/old/same with savings)
│   └── index.ts
├── gst/
│   ├── types.ts              # CalculateGstInput, GstResult, InvoiceInput, InvoiceResult, GstinValidationResult
│   ├── money.ts              # rupeesToPaise, paiseToRupees, formatPaise
│   ├── states.ts             # 37 Indian State and UT GST codes, state normalizer, intra vs inter
│   ├── calculate.ts          # Add/remove GST calculator with odd-paise split guarantee
│   ├── invoice.ts            # Full invoice engine with per-rate tax summary and rupee round-off
│   ├── amountInWords.ts      # Indian numbering system amount-in-words (Crore, Lakh, Thousand)
│   ├── gstin.ts              # 15-character GSTIN validator (Luhn Mod-36 checksum) and test generator
│   └── index.ts
└── __tests__/
    ├── tax.test.ts           # 24 unit & property tests covering all statutory scenarios
    ├── gst.test.ts           # 15 unit & property tests covering GST, invoices, and GSTIN
    ├── shared.test.ts        # 6 unit tests for rounding and formatINR
    └── api.test.ts           # 12 supertest integration tests for all REST API endpoints
```

---

## 3. Tax Rules Shape

Rules are loaded from `Backend/src/seed/taxRulesFY2026_27.json` or MongoDB, cached in memory with a 5-minute TTL:

```json
{
  "taxYear": "2026-27",
  "financialYear": "2026-2027",
  "assessmentYear": "2027-2028",
  "cess": 4,
  "roundingToNearestTen": false,
  "newRegime": {
    "slabs": [
      { "upTo": 400000, "rate": 0 },
      { "upTo": 800000, "rate": 5 },
      { "upTo": 1200000, "rate": 10 },
      { "upTo": 1600000, "rate": 15 },
      { "upTo": 2000000, "rate": 20 },
      { "upTo": 2400000, "rate": 25 },
      { "upTo": null, "rate": 30 }
    ],
    "standardDeduction": 75000,
    "rebate": {
      "incomeLimit": 1200000,
      "maxRebate": "equal to tax payable up to the limit",
      "marginalRelief": true
    }
  },
  "oldRegime": {
    "slabsByAge": {
      "below60": [
        { "upTo": 250000, "rate": 0 },
        { "upTo": 500000, "rate": 5 },
        { "upTo": 1000000, "rate": 20 },
        { "upTo": null, "rate": 30 }
      ],
      "senior": [
        { "upTo": 300000, "rate": 0 },
        { "upTo": 500000, "rate": 5 },
        { "upTo": 1000000, "rate": 20 },
        { "upTo": null, "rate": 30 }
      ],
      "superSenior": [
        { "upTo": 500000, "rate": 0 },
        { "upTo": 1000000, "rate": 20 },
        { "upTo": null, "rate": 30 }
      ]
    },
    "standardDeduction": 50000,
    "rebate": {
      "incomeLimit": 500000,
      "maxRebate": 12500
    },
    "deductionLimits": {
      "sec80C": 150000,
      "sec80CCD1B": 50000,
      "sec80D_selfFamily": { "normal": 25000, "senior": 50000 },
      "sec80D_parents": { "normal": 25000, "senior": 50000 },
      "homeLoanInterestSelfOccupied": 200000
    },
    "hra": {
      "metroPercent": 50,
      "nonMetroPercent": 40,
      "rentMinusBasicPercent": 10
    }
  },
  "gst": {
    "supportedRates": [0, 5, 18, 40],
    "defaultRate": 18
  },
  "surcharge": null
}
```

---

## 4. How to Add a New Tax Year

1. **Create the Seed JSON**:
   - Create `Backend/src/seed/taxRulesFY{YYYY_YY}.json` (e.g. `taxRulesFY2027_28.json`).
   - Populate slabs, rebate limits, and deduction caps according to the relevant Union Budget.
2. **Register in RulesService**:
   - In `Backend/src/services/rules.service.ts`, add the new year to `normalizeTaxYear()` and `getSeedRules()`.
3. **Database Seed (Optional)**:
   - Call `seedTaxRules()` or insert into the `TaxSlabConfig` collection in MongoDB. The engine automatically reads from cache, database, or seed JSON.

---

## 5. Items to Verify Against Official Sources (`// TODO: verify`)

The following statutory parameters must be verified against official portals ([incometax.gov.in](https://www.incometax.gov.in) and [gst.gov.in](https://www.gst.gov.in)):

1. **FY 2026-27 Marginal Relief for New Regime**:
   - *Status*: Modeled as tax before cess cannot exceed taxable income minus ₹12,00,000 threshold.
   - *Action*: Confirm against CBDT notification and official Income Tax calculator when AY 2027-28 utility is released.
2. **Senior Citizen Old Regime Slabs (60 to <80 years)**:
   - *Status*: Configured as Nil up to ₹3,00,000; 5% up to ₹5,00,000; 20% up to ₹10,00,000; 30% above.
   - *Action*: Verify whether any amendments were introduced for seniors choosing the Old Regime.
3. **Super Senior Citizen Old Regime Slabs (80+ years)**:
   - *Status*: Configured as Nil up to ₹5,00,000; 20% up to ₹10,00,000; 30% above.
   - *Action*: Verify against official notifications for AY 2027-28.
4. **Rounding to Nearest Rs. 10 (`roundingToNearestTen`)**:
   - *Status*: Under Sections 288A and 288B, rounding to nearest Rs. 10 is prescribed in official filing. In TaxGenie, this flag defaults to `false` (OFF) for transparency.
   - *Action*: Verify if user preferences or e-filing export should toggle this flag automatically.
5. **GST State Codes List**:
   - *Status*: 37 state/UT codes (01 to 38 plus 97 Other Territory) are mapped in `states.ts`.
   - *Action*: Verify against the latest master list on the GST Portal (e.g. merger of codes 25 and 26 for DNH & DD).

---

## 6. Thin API Layer Endpoints & Example cURL Commands

All calculation and rules endpoints work **without authentication** and are rate-limited to 300 requests per 15 minutes.

### 1. Get Active Rules for Tax Year
```bash
curl -X GET http://localhost:8000/api/rules/2026-27
```
**Sample Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "taxYear": "2026-27",
    "cess": 4,
    "roundingToNearestTen": false,
    "newRegime": { "standardDeduction": 75000, "rebate": { "incomeLimit": 1200000, "marginalRelief": true } },
    "oldRegime": { "standardDeduction": 50000, "rebate": { "incomeLimit": 500000, "maxRebate": 12500 } }
  }
}
```

### 2. Compare Income Tax Regimes
```bash
curl -X POST http://localhost:8000/api/tax/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "ageGroup": "below60",
    "salaryIncome": 1500000,
    "otherIncome": 0,
    "taxYear": "2026-27",
    "deductions": {
      "sec80C": 150000,
      "sec80D_selfFamily": 25000
    }
  }'
```
**Sample Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "newRegime": {
      "grossIncome": 1500000,
      "standardDeductionApplied": 75000,
      "taxableIncome": 1425000,
      "totalTax": 97500,
      "effectiveRatePercent": 6.5,
      "monthlyTax": 8125
    },
    "oldRegime": {
      "grossIncome": 1500000,
      "standardDeductionApplied": 50000,
      "taxableIncome": 1275000,
      "totalTax": 202800,
      "effectiveRatePercent": 13.52,
      "monthlyTax": 16900
    },
    "recommended": "new",
    "savings": 105300,
    "savingsPercent": 51.92,
    "breakEven": 543750
  }
}
```

### 3. Calculate GST (Add or Remove Mode)
```bash
curl -X POST http://localhost:8000/api/gst/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "rate": 18,
    "mode": "add",
    "sellerState": "27",
    "buyerState": "27",
    "taxYear": "2026-27"
  }'
```
**Sample Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "base": 50000,
    "gstAmount": 9000,
    "cgst": 4500,
    "sgst": 4500,
    "igst": 0,
    "total": 59000,
    "supplyType": "intra",
    "rate": 18,
    "basePaise": 5000000,
    "gstPaise": 900000,
    "cgstPaise": 450000,
    "sgstPaise": 450000,
    "igstPaise": 0,
    "totalPaise": 5900000
  }
}
```

### 4. Preview GST Invoice
```bash
curl -X POST http://localhost:8000/api/gst/invoice-preview \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "name": "Web Development", "quantity": 2, "unitPrice": 1000, "rate": 18 },
      { "name": "Hosting Setup", "quantity": 1, "unitPrice": 500, "rate": 5 }
    ],
    "sellerState": "Maharashtra",
    "buyerState": "Maharashtra",
    "priceIncludesGst": false
  }'
```
**Sample Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "subtotal": 2500,
    "totalCgst": 192.5,
    "totalSgst": 192.5,
    "totalIgst": 0,
    "totalGst": 385,
    "totalBeforeRoundOff": 2885,
    "roundOff": 0,
    "grandTotal": 2885,
    "amountInWords": "Two Thousand Eight Hundred Eighty Five Rupees Only",
    "supplyType": "intra"
  }
}
```

### 5. Validate GSTIN
```bash
curl -X POST http://localhost:8000/api/gst/validate-gstin \
  -H "Content-Type: application/json" \
  -d '{
    "gstin": "27ABCDE1234F1Z5"
  }'
```
**Sample Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "valid": false,
    "reason": "INVALID_CHECKSUM"
  }
}
```
*(If valid, returns `{"valid": true, "details": { "stateCode": "27", "stateName": "Maharashtra", "pan": "ABCDE1234F", "entityNumber": "1", "checksum": "..." }}`)*
