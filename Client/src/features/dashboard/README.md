# TaxGenie Dashboard Formulas & Analytics Specification

## Overview
The TaxGenie Dashboard provides taxpayers with real-time tax optimization analytics, regime comparison metrics, and GST liability positions. When a user has not saved any calculations, a statutory baseline for Financial Year 2026-27 is displayed. Once calculations are saved, metrics are derived purely from user data with server-side engine recomputation.

---

## 1. Key Performance Indicators (KPIs)

### KPI 1: Estimated Tax Payable
- **Definition:** The minimum statutory tax liability computed for the user's active income profiles under the recommended regime for the selected Financial Year.
- **Formula:**
  $$\text{Estimated Tax} = \min(\text{Tax}_{\text{New Regime}}, \text{Tax}_{\text{Old Regime}})$$
- **Marginal Relief & Rebate:**
  Under FY 2026-27 New Tax Regime, Section 87A rebate provides up to **₹60,000** rebate on taxable income up to **₹12,00,000**, resulting in zero tax liability for income $\le ₹12,00,000$ (with standard deduction, up to $₹12,75,000$).

### KPI 2: Tax Saved
- **Definition:** Total tax saved by choosing the recommended regime over the alternative regime.
- **Formula:**
  $$\text{Tax Saved} = \max(0, |\text{Tax}_{\text{Old Regime}} - \text{Tax}_{\text{New Regime}}|)$$
- **Percentage Saved:**
  $$\text{Percent Saved} = \frac{\text{Tax Saved}}{\max(\text{Tax}_{\text{Old Regime}}, \text{Tax}_{\text{New Regime}})} \times 100$$

### KPI 3: GST Position / Tax Liability
- **Definition:** Total statutory Goods and Services Tax collected or payable across all intra-state and inter-state supplies in the tax period.
- **Formulas:**
  - **Exclusive (Add GST):**
    $$\text{GST Amount} = \text{Base Price} \times \left(\frac{\text{Rate}}{100}\right)$$
    $$\text{Final Total} = \text{Base Price} + \text{GST Amount}$$
  - **Inclusive (Remove GST):**
    $$\text{Base Price} = \frac{\text{Total Amount} \times 100}{100 + \text{Rate}}$$
    $$\text{GST Extracted} = \text{Total Amount} - \text{Base Price}$$
  - **Supply Type Split:**
    - Intra-State ($\text{State}_{\text{Supplier}} = \text{State}_{\text{Buyer}}$): $\text{CGST} = \frac{\text{GST Amount}}{2}, \text{SGST} = \frac{\text{GST Amount}}{2}$.
    - Inter-State ($\text{State}_{\text{Supplier}} \ne \text{State}_{\text{Buyer}}$): $\text{IGST} = \text{GST Amount}$.

---

## 2. Visual Component Chart Formulas

### Card 1: Concentric Racetrack Gauge (Tax Statistics)
- **Outer Track (A - Gross Income):**
  $$\text{Gauge}_{1} = \min\left(100, \frac{\text{Gross Income}}{₹25,00,000} \times 100\right)$$
- **Middle Track (B - Deductions):**
  $$\text{Gauge}_{2} = \min\left(100, \frac{\text{Total Deductions (80C + 80D + HRA)}}{₹4,00,000} \times 100\right)$$
- **Inner Track (C - Old Regime Tax):**
  $$\text{Gauge}_{3} = \min\left(100, \frac{\text{Old Regime Tax}}{₹5,00,000} \times 100\right)$$
- **Center Track (D - Net Savings):**
  $$\text{Gauge}_{4} = \min\left(100, \frac{\text{Tax Saved}}{₹2,00,000} \times 100\right)$$

### Card 2: Regime Transition Pillars (Brackets A through I)
Standard income slab distribution:
- **Bracket A:** ₹0 – ₹4 Lakh (0%)
- **Bracket B:** ₹4 Lakh – ₹8 Lakh (5%)
- **Bracket C:** ₹8 Lakh – ₹12 Lakh (10%)
- **Bracket D:** ₹12 Lakh – ₹16 Lakh (15%)
- **Bracket E:** ₹16 Lakh – ₹20 Lakh (20%)
- **Bracket F:** ₹20 Lakh – ₹24 Lakh (25%)
- **Bracket G:** ₹24 Lakh – ₹30 Lakh (30%)
- **Bracket H:** ₹30 Lakh – ₹50 Lakh (30% + Surcharge)
- **Bracket I:** ₹50 Lakh+ (30% + Surcharge + Cess)

### Card 4: Clustered Income Bubbles
Proportional radii for income streams:
- $R_{\text{salary}} \propto \sqrt{\text{Salary Income}}$
- $R_{\text{business}} \propto \sqrt{\text{Business Profits}}$
- $R_{\text{capitalGains}} \propto \sqrt{\text{Capital Gains}}$
- $R_{\text{deductions}} \propto \sqrt{\text{Deductions (80C, 80D)}}$

### Card 5: Radial Sunburst Activity
32 equalizer rays representing calculation activity and statutory verification runs across the financial year.

### Card 6: Segmented Donut Ratio
$$\text{Slice Percentage} = \frac{\text{Category Amount}}{\text{Total Taxable Volume}} \times 100$$
Center metric displays the normalized composite optimization index.
