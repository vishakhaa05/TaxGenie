import TransactionModel from "../models/transaction.model";
import { findUserById } from "../utils/userStore";
import { GoogleGenAI } from "@google/genai";
import { Env } from "../config/env.config";
import mongoose from "mongoose";

export class AiAdvisorService {
  private static getGenAI() {
    const apiKey = Env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    try {
      return new GoogleGenAI({ apiKey });
    } catch {
      return null;
    }
  }

  public static async askYourFinances(userId?: string, question = "") {
    let user = null;
    if (userId) {
      try {
        user = await findUserById(userId);
      } catch {
        user = null;
      }
    }

    let transactions: any[] = [];
    if (userId && mongoose.connection.readyState === 1) {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        transactions = await TransactionModel.find({
          userId,
          date: { $gte: thirtyDaysAgo },
        })
          .sort({ date: -1 })
          .limit(50);
      } catch (err) {
        console.warn("Could not query transactions for AI Advisor:", err);
      }
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};

    transactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "INCOME") {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
      }
    });

    const txSummary = transactions.length > 0
      ? transactions
          .map(
            (t) =>
              `Date: ${new Date(t.date).toISOString().split("T")[0]}, Title: ${
                t.title
              }, Category: ${t.category}, Type: ${t.type}, Amount: INR ${t.amount}`
          )
          .join("\n")
      : "No recent transactions recorded yet.";

    const prompt = `
You are TaxGenie AI, an expert, encouraging, and highly precise Indian tax advisor and personal finance assistant.
User Profile: Name: ${user?.name || "Taxpayer"}, Account Mode: ${user?.mode || "INDIVIDUAL"}.
Applicable Tax Law: Income Tax Act 2025 / FY 2026-27 (AY 2027-28) and FY 2025-26.
Recent 30-Day Metrics:
- Total Income: INR ${totalIncome}
- Total Expenses: INR ${totalExpense}
- Net Balance: INR ${totalIncome - totalExpense}
- Spending Breakdown by Category: ${JSON.stringify(categoryTotals)}

Recent Transactions:
${txSummary}

User's Question: "${question}"

Provide a concise, practical, and data-backed response directly addressing their question in plain, clear English. Include exact sections (80C, 80D, 87A, 10(13A), 24b), deduction caps, and actionable tips where relevant.
`;

    // Attempt Gemini call if available
    try {
      const ai = this.getGenAI();
      if (ai) {
        let responseText = "";
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
          });
          responseText = response.text || "";
        } catch {
          try {
            const response = await ai.models.generateContent({
              model: "gemini-1.5-flash",
              contents: prompt,
            });
            responseText = response.text || "";
          } catch {
            // fall through to expert rules
          }
        }

        if (responseText && responseText.trim().length > 10) {
          return {
            answer: responseText,
            metrics: {
              totalIncome,
              totalExpense,
              netSavings: totalIncome - totalExpense,
              transactionCount: transactions.length,
            },
          };
        }
      }
    } catch (error) {
      console.warn("AI Advisor Gemini API skipped:", error);
    }

    // Expert Tax & Finance Domain Knowledge Engine (Comprehensive Fallback)
    const qLower = question.toLowerCase();
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0] ? `${sortedCategories[0][0]} (₹${sortedCategories[0][1].toLocaleString("en-IN")})` : "None";
    const netBalance = totalIncome - totalExpense;

    let dynamicAnswer = "";

    if (qLower.includes("80c") || qLower.includes("eighty c") || (qLower.includes("reduce") && qLower.includes("tax"))) {
      dynamicAnswer = `### Maximizing Deductions under Section 80C (Old Regime)\n\n` +
        `Under **Section 80C**, you can claim up to **₹1,50,000** per financial year to reduce your taxable income. Here are the most effective eligible instruments:\n\n` +
        `1. **ELSS Mutual Funds**: 3-year lock-in (shortest among all 80C options) with high long-term equity growth potential.\n` +
        `2. **EPF & VPF**: Employee Provident Fund contributions with government-backed returns.\n` +
        `3. **PPF (Public Provident Fund)**: 15-year tenure with triple tax exemption (EEE: Exempt at investment, interest, and maturity).\n` +
        `4. **Life Insurance & Term Plans**: Annual premiums paid for yourself, spouse, and children.\n` +
        `5. **Home Loan Principal**: The principal portion of your EMI repayments.\n` +
        `6. **Children's Tuition Fees**: School/college tuition fees for up to 2 children.\n\n` +
        `💡 *Pro-Tip*: You can save an **extra ₹50,000** over and above the ₹1.5L limit by investing in **NPS (Section 80CCD(1B))**!`;
    } else if (qLower.includes("old vs new") || qLower.includes("which regime") || qLower.includes("compare regime")) {
      dynamicAnswer = `### Old vs. New Tax Regime: Which Should You Choose?\n\n` +
        `• **New Tax Regime (FY 2026-27 / Income Tax Act 2025)**:\n` +
        `  - **Zero Tax** for taxable income up to **₹12 Lakhs** thanks to the enhanced Section 87A rebate.\n` +
        `  - Flat **₹75,000 Standard Deduction** for salaried individuals.\n` +
        `  - Lower slab rates (5% to 30%) without the need to lock money in investments.\n\n` +
        `• **Old Tax Regime**:\n` +
        `  - Allows all traditional deductions: Section 80C (₹1.5L), 80D (₹25k-₹50k), HRA, and Home Loan interest (₹2L).\n` +
        `  - Best if your total deductions exceed **₹3.75 Lakhs - ₹4 Lakhs**.\n\n` +
        `💡 *Recommendation*: Use our **Tax Optimizer** calculator to see exact side-by-side figures tailored to your salary!`;
    } else if (qLower.includes("87a") || qLower.includes("rebate") || qLower.includes("marginal relief")) {
      dynamicAnswer = `### Section 87A Rebate & Marginal Relief\n\n` +
        `• **Under the New Regime (FY 2026-27)**:\n` +
        `  - Taxpayers with taxable income up to **₹12,00,000** receive a **100% tax rebate** (up to ₹60,000), making net tax payable **₹0**.\n` +
        `  - For salaried individuals with the ₹75,000 standard deduction, salary up to **₹12,75,000** is effectively tax-free!\n` +
        `  - **Marginal Relief**: If income slightly exceeds ₹12 Lakhs (e.g., ₹12,10,000), tax payable cannot exceed the excess income over ₹12 Lakhs.\n\n` +
        `• **Under the Old Regime**:\n` +
        `  - Full rebate of up to **₹12,500** for taxable income up to **₹5,00,000**.`;
    } else if (qLower.includes("hra") || qLower.includes("rent")) {
      dynamicAnswer = `### House Rent Allowance (HRA) Exemption Rules\n\n` +
        `HRA exemption is calculated under **Section 10(13A)** (applicable only in the **Old Tax Regime**). The exempt amount is the **minimum** of the following three:\n\n` +
        `1. Actual HRA received from your employer.\n` +
        `2. 50% of Basic Salary + DA (for metro cities: Delhi, Mumbai, Kolkata, Chennai) or 40% (for non-metro cities).\n` +
        `3. Actual rent paid minus 10% of Basic Salary.\n\n` +
        `💡 *Note*: If annual rent exceeds ₹1,00,000, your landlord's PAN must be reported to your employer.`;
    } else if (qLower.includes("80d") || qLower.includes("health") || qLower.includes("medical")) {
      dynamicAnswer = `### Section 80D: Health Insurance Deductions\n\n` +
        `You can claim deductions under **Section 80D** for health insurance premiums:\n\n` +
        `• **Self, Spouse & Dependent Children**: Up to **₹25,000** (₹50,000 if self/spouse is a Senior Citizen aged 60+).\n` +
        `• **Parents (below 60 years)**: Additional **₹25,000**.\n` +
        `• **Parents (Senior Citizens 60+)**: Additional **₹50,000**.\n` +
        `• **Preventive Health Check-up**: Up to **₹5,000** included within the overall limits.\n\n` +
        `*Maximum Potential Deduction*: Up to **₹1,00,000** per financial year if both you and your parents are senior citizens!`;
    } else if (qLower.includes("gst") || qLower.includes("invoice")) {
      dynamicAnswer = `### Goods & Services Tax (GST) Guide\n\n` +
        `• **Mandatory Thresholds**:\n` +
        `  - Service Providers: Annual turnover exceeding **₹20 Lakhs** (₹10L for Special Category states).\n` +
        `  - Goods Suppliers: Annual turnover exceeding **₹40 Lakhs** (₹20L in select states).\n` +
        `• **Standard Tax Rates**: 0%, 5%, 12%, 18%, and 28%.\n` +
        `• **Invoicing Requirements**: A valid tax invoice must include Business GSTIN, Customer GSTIN, HSN/SAC code, and separate CGST + SGST (intra-state) or IGST (inter-state).\n\n` +
        `Use our **GST Calculator / Invoice Generator** tab to issue compliant PDF invoices instantly!`;
    } else if (qLower.includes("slab") || qLower.includes("rate") || qLower.includes("2026") || qLower.includes("2025")) {
      dynamicAnswer = `### New Tax Regime Slabs (FY 2026-27 / AY 2027-28)\n\n` +
        `• **₹0 to ₹4,00,000**: Nil (0%)\n` +
        `• **₹4,00,001 to ₹8,00,000**: 5%\n` +
        `• **₹8,00,001 to ₹12,00,000**: 10%\n` +
        `• **₹12,00,001 to ₹16,00,000**: 15%\n` +
        `• **₹16,00,001 to ₹20,00,000**: 20%\n` +
        `• **₹20,00,001 to ₹24,00,000**: 25%\n` +
        `• **Above ₹24,00,000**: 30%\n\n` +
        `*Key Benefits*: ₹75,000 Standard Deduction for salaried employees + Section 87A rebate for taxable income up to ₹12 Lakhs!`;
    } else if (qLower.includes("emergency") || qLower.includes("fund") || qLower.includes("invest")) {
      dynamicAnswer = `### Smart Financial Planning & Asset Allocation\n\n` +
        `1. **Emergency Buffer**: Maintain **3 to 6 months** of essential fixed expenses in high-liquidity accounts (Savings account + Sweep-in FD or Liquid Mutual Fund).\n` +
        `2. **Core Growth (Equity)**: Low-cost Nifty 50 Index Funds or Flexi-cap mutual funds for 7-10+ year goals.\n` +
        `3. **Capital Preservation (Debt)**: PPF, EPF, and Debt funds for stability and tax-efficient compounding.\n` +
        `4. **Hedging (Gold)**: Allocate 5-10% in Sovereign Gold Bonds (SGBs) or Gold ETFs.\n\n` +
        `Check the **Savings & Emergency Advisor** tab right here to calculate your personal target deficit!`;
    } else if (qLower.includes("where") || qLower.includes("spending") || qLower.includes("expense")) {
      dynamicAnswer = `### Spending & Outflow Analysis\n\n` +
        (transactions.length > 0
          ? `Over the past 30 days, your highest expense category is **${topCategory}**. Your total spending across recorded transactions is **₹${totalExpense.toLocaleString("en-IN")}** with a net balance of **₹${netBalance.toLocaleString("en-IN")}**.`
          : `You haven't logged any transactions in the last 30 days yet. As you add your expenses, TaxGenie AI will automatically categorize them, detect spending spikes, and highlight tax-deductible items!`);
    } else {
      dynamicAnswer = `### TaxGenie AI Insights for "${question}"\n\n` +
        `Under Indian Income Tax (FY 2026-27 / Income Tax Act 2025):\n\n` +
        `• **New Tax Regime** offers zero tax up to ₹12 Lakhs taxable income (effective ₹12.75 Lakhs for salaried individuals with Standard Deduction).\n` +
        `• **Old Tax Regime** is optimal if you claim major deductions under Section 80C (up to ₹1.5L), Section 80D health insurance (up to ₹50k), and HRA or Home Loan interest (Section 24b up to ₹2L).\n` +
        `• Check the **Tax Optimizer** tab for instant slab comparison and the **GST Invoices** tab for billing.`;
    }

    return {
      answer: dynamicAnswer,
      metrics: {
        totalIncome,
        totalExpense,
        netSavings: netBalance,
        transactionCount: transactions.length,
      },
    };
  }

  public static async analyzeSavingsAndInvestments(
    userId?: string,
    input: {
      monthlyIncome: number;
      fixedExpenses: number;
      existingSavings: number;
      riskAppetite?: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
      goal?: string;
    } = { monthlyIncome: 100000, fixedExpenses: 45000, existingSavings: 150000 }
  ) {
    const risk = input.riskAppetite || "MODERATE";
    const disposableIncome = Math.max(0, input.monthlyIncome - input.fixedExpenses);

    const emergencyFundTarget = input.fixedExpenses * 6;
    const emergencyFundDeficit = Math.max(
      0,
      emergencyFundTarget - input.existingSavings
    );

    let allocation = {
      emergencyOrFd: 30,
      debtOrGovt: 30,
      equity: 30,
      goldOrLiquid: 10,
    };

    if (risk === "CONSERVATIVE") {
      allocation = {
        emergencyOrFd: 40,
        debtOrGovt: 40,
        equity: 10,
        goldOrLiquid: 10,
      };
    } else if (risk === "AGGRESSIVE") {
      allocation = {
        emergencyOrFd: 20,
        debtOrGovt: 15,
        equity: 55,
        goldOrLiquid: 10,
      };
    }

    const recommendedMonthlySavings = Math.round(disposableIncome * 0.5);

    return {
      monthlyIncome: input.monthlyIncome,
      fixedExpenses: input.fixedExpenses,
      disposableIncome,
      recommendedMonthlySavings,
      emergencyFund: {
        target6Months: emergencyFundTarget,
        currentSavings: input.existingSavings,
        deficit: emergencyFundDeficit,
        monthsCovered:
          input.fixedExpenses > 0
            ? (input.existingSavings / input.fixedExpenses).toFixed(1)
            : "6+",
      },
      suggestedAssetAllocation: {
        riskProfile: risk,
        breakdownPercent: allocation,
        monthlyAllocationAmount: {
          emergencyOrFd: (recommendedMonthlySavings * allocation.emergencyOrFd) / 100,
          debtOrGovt: (recommendedMonthlySavings * allocation.debtOrGovt) / 100,
          equity: (recommendedMonthlySavings * allocation.equity) / 100,
          goldOrLiquid: (recommendedMonthlySavings * allocation.goldOrLiquid) / 100,
        },
      },
      disclaimer:
        "TaxGenie AI guidance is for educational purposes only and does not constitute licensed SEBI financial advice.",
    };
  }

  public static async detectSpendingAnomalies(userId?: string) {
    if (!userId || mongoose.connection.readyState !== 1) {
      return { anomalyCount: 0, anomalies: [] };
    }

    try {
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const transactions = await TransactionModel.find({
        userId,
        type: "EXPENSE",
        date: { $gte: sixtyDaysAgo },
      });

      const anomalies: Array<{
        title: string;
        category: string;
        amount: number;
        reason: string;
      }> = [];

      const categoryAmounts: Record<string, number[]> = {};

      transactions.forEach((t) => {
        const amt = Number(t.amount) || 0;
        if (!categoryAmounts[t.category]) {
          categoryAmounts[t.category] = [];
        }
        categoryAmounts[t.category]!.push(amt);
      });

      transactions.forEach((t) => {
        const amt = Number(t.amount) || 0;
        const catAmts = categoryAmounts[t.category] || [];
        const avg = catAmts.reduce((a, b) => a + b, 0) / (catAmts.length || 1);

        if (amt > avg * 2.5 && amt > 2000) {
          anomalies.push({
            title: t.title,
            category: t.category,
            amount: amt,
            reason: `Higher than typical spending in ${t.category} (avg: INR ${Math.round(
              avg
            )})`,
          });
        }
      });

      return {
        anomalyCount: anomalies.length,
        anomalies: anomalies.slice(0, 10),
      };
    } catch {
      return { anomalyCount: 0, anomalies: [] };
    }
  }
}
