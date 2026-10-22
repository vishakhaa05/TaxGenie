import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Printer,
  RotateCcw,
  Zap,
  Coins,
  AlertTriangle,
  Loader2,
  Tag,
  FileCheck,
  Layers,
  ClipboardPaste,
  Briefcase,
} from "lucide-react";
import { usePapaParse } from "react-papaparse";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useBulkImportTransactionMutation } from "@/features/transaction/transactionAPI";
import { useAppSelector } from "@/app/hook";

export interface ExtractedStatementTx {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  isTaxDeductible: boolean;
  deductionSection?: "80C" | "80D" | "HRA" | "HOME_LOAN" | "OTHER";
  confidenceScore: number;
}

export interface StatementAuditReport {
  fileName: string;
  statementPeriod: string;
  totalTransactions: number;
  totalInflow: number;
  totalOutflow: number;
  netSavings: number;
  savingsRate: number;
  deductions: {
    sec80C: number;
    sec80D: number;
    hra: number;
    homeLoan: number;
    totalEligible: number;
  };
  taxComparison: {
    newRegimeTax: number;
    oldRegimeTax: number;
    recommended: "NEW" | "OLD";
    taxSaved: number;
  };
  categoryTotals: Record<string, number>;
  anomalies: string[];
  transactions: ExtractedStatementTx[];
}

const DEMO_CSV_DATA = `Date,Description,Withdrawal,Deposit,Category
2026-10-01,Salary Credit TechCorp India,,165000,Salary
2026-10-03,Client Consulting Web Services,,45000,Freelance
2026-10-05,HDFC Life Insurance Premium (LIC Policy 80C),25000,,Investment
2026-10-07,SBI Public Provident Fund (PPF Contribution 80C),50000,,Investment
2026-10-10,Star Health Comprehensive Mediclaim (80D),22000,,Insurance
2026-10-12,House Rent Payment to Landlord (HRA Exemption),32000,,Housing
2026-10-15,SBI Home Loan EMI Principal & Interest,42000,,Loans
2026-10-16,Swiggy Bangalore Online Food,2400,,Food & Dining
2026-10-18,Amazon India Festive Shopping,8400,,Shopping
2026-10-20,Tata Power Electricity Utility Bill,2100,,Utilities
2026-10-22,Netflix and Spotify Monthly Subscription,1198,,Entertainment
2026-10-24,Apollo Pharmacy Prescription Meds,1650,,Healthcare
2026-10-25,Freelance UI Consulting Inflow,,30000,Freelance
2026-10-28,Uber Rides Commute Travels,3200,,Travel`;

const FREELANCER_CSV_DATA = `Date,Narration,Debit,Credit,Category
2026-10-01,Upwork Escrow Global Payout (Consulting Inflow),,280000,Freelance
2026-10-04,Direct Client Wire Transfer Tech Architecture,,145000,Freelance
2026-10-06,Amazon Web Services Cloud Server Infrastructure,34500,,Cloud/Hosting
2026-10-09,GitHub Enterprise and Figma Design Subscription,7200,,Software
2026-10-12,HDFC Ergo Optima Secure Mediclaim (80D),28000,,Insurance
2026-10-15,SBI PPF Tax Saver Scheme Deposit (80C),150000,,Investment
2026-10-18,WeWork Coworking Office Desk Space Rent,22000,,Office
2026-10-21,Apple MacBook Pro M3 Purchase Hardware Asset,149900,,Electronics
2026-10-24,Domestic Flight Ticket for Client Meeting Delhi,9800,,Travel
2026-10-27,CA Audit & Tax Genies Platform Subscription,4500,,Professional Fees`;

export default function CsvStatementAnalyzer() {
  const { readString } = usePapaParse();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAppSelector((state) => state.auth.user);

  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<StatementAuditReport | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [pastedCsvText, setPastedCsvText] = useState("");

  const [bulkImportTransaction] = useBulkImportTransactionMutation();

  // Smart Tax & Category Classifier from Narration
  const classifyTransaction = (desc: string, defaultCat?: string) => {
    const text = (desc || "").toLowerCase();

    // Section 80C
    if (/(lic|life insurance|ppf|provident fund|elss|tax saver|nps|mutual fund|uti|dsp|nippon|mirae|axis long term)/i.test(text)) {
      return {
        category: "Investment",
        isTaxDeductible: true,
        deductionSection: "80C" as const,
      };
    }

    // Section 80D (Health Insurance)
    if (/(health insurance|mediclaim|star health|max bupa|hdfc ergo|care health|icici lombard|niva bupa)/i.test(text)) {
      return {
        category: "Insurance",
        isTaxDeductible: true,
        deductionSection: "80D" as const,
      };
    }

    // HRA (House Rent)
    if (/(house rent|rent payment|landlord|nobroker|nestaway)/i.test(text)) {
      return {
        category: "Housing",
        isTaxDeductible: true,
        deductionSection: "HRA" as const,
      };
    }

    // Home Loan Interest
    if (/(home loan|housing loan|sbi home|hdfc home|housing emi)/i.test(text)) {
      return {
        category: "Loans",
        isTaxDeductible: true,
        deductionSection: "HOME_LOAN" as const,
      };
    }

    // Standard Categories
    if (/(salary|techcorp|payroll|wages)/i.test(text)) return { category: "Salary", isTaxDeductible: false };
    if (/(consulting|freelance|client|project fee)/i.test(text)) return { category: "Freelance", isTaxDeductible: false };
    if (/(swiggy|zomato|starbucks|restaurant|cafe|dining|food)/i.test(text)) return { category: "Food & Dining", isTaxDeductible: false };
    if (/(amazon|flipkart|myntra|zara|shopping|retail)/i.test(text)) return { category: "Shopping", isTaxDeductible: false };
    if (/(uber|ola|fuel|petrol|metro|flight|travel)/i.test(text)) return { category: "Travel", isTaxDeductible: false };
    if (/(electricity|power|water|airtel|jio|wifi|utility)/i.test(text)) return { category: "Utilities", isTaxDeductible: false };
    if (/(netflix|spotify|prime|hotstar|entertainment)/i.test(text)) return { category: "Entertainment", isTaxDeductible: false };
    if (/(pharmacy|apollo|hospital|doctor|medic|clinic)/i.test(text)) return { category: "Healthcare", isTaxDeductible: false };

    return {
      category: defaultCat && defaultCat.trim() ? defaultCat.trim() : "General Expenses",
      isTaxDeductible: false,
    };
  };

  // FY 2026-27 Slabs Calculator
  const computeStatutoryTax = (grossIncome: number, deductionsTotal: number) => {
    // New Regime (Sec 115BAC): Standard deduction ₹75,000, 87A rebate up to ₹12L
    const newNetIncome = Math.max(0, grossIncome - 75000);
    let newTax = 0;
    if (newNetIncome <= 1200000) {
      newTax = 0; // Rebate u/s 87A
    } else {
      if (newNetIncome > 400000) newTax += Math.min(newNetIncome - 400000, 400000) * 0.05;
      if (newNetIncome > 800000) newTax += Math.min(newNetIncome - 800000, 400000) * 0.10;
      if (newNetIncome > 1200000) newTax += Math.min(newNetIncome - 1200000, 400000) * 0.15;
      if (newNetIncome > 1600000) newTax += Math.min(newNetIncome - 1600000, 400000) * 0.20;
      if (newNetIncome > 2000000) newTax += Math.min(newNetIncome - 2000000, 400000) * 0.25;
      if (newNetIncome > 2400000) newTax += (newNetIncome - 2400000) * 0.30;
      newTax = Math.round(newTax * 1.04); // 4% cess
    }

    // Old Regime: Standard deduction ₹50,000 + itemized deductions
    const oldNetIncome = Math.max(0, grossIncome - 50000 - deductionsTotal);
    let oldTax = 0;
    if (oldNetIncome > 250000) oldTax += Math.min(oldNetIncome - 250000, 250000) * 0.05;
    if (oldNetIncome > 500000) oldTax += Math.min(oldNetIncome - 500000, 500000) * 0.20;
    if (oldNetIncome > 1000000) oldTax += (oldNetIncome - 1000000) * 0.30;
    oldTax = Math.round(oldTax * 1.04);

    const recommended = newTax <= oldTax ? "NEW" : "OLD";
    const taxSaved = Math.abs(oldTax - newTax);

    return {
      newRegimeTax: newTax,
      oldRegimeTax: oldTax,
      recommended: recommended as "NEW" | "OLD",
      taxSaved,
    };
  };

  // Process CSV rows into structured report
  const processCsvRows = (rows: Record<string, any>[], fileName: string) => {
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const parsedTxs: ExtractedStatementTx[] = [];
        let totalInflow = 0;
        let totalOutflow = 0;
        let sec80C = 0;
        let sec80D = 0;
        let hra = 0;
        let homeLoan = 0;
        const categoryTotals: Record<string, number> = {};
        const dates: string[] = [];

        rows.forEach((row, idx) => {
          const keys = Object.keys(row);
          const dateKey = keys.find((k) => /date/i.test(k));
          const descKey = keys.find((k) => /desc|particular|narration|detail|remark/i.test(k));
          const creditKey = keys.find((k) => /credit|deposit|inflow/i.test(k));
          const debitKey = keys.find((k) => /debit|withdrawal|outflow/i.test(k));
          const amountKey = keys.find((k) => /amount|net/i.test(k));
          const typeKey = keys.find((k) => /type/i.test(k));
          const categoryKey = keys.find((k) => /cat/i.test(k));

          const rawDate = (dateKey ? row[dateKey] : new Date().toISOString().split("T")[0]) || new Date().toISOString().split("T")[0];
          const rawDesc = (descKey ? row[descKey] : `Transaction #${idx + 1}`) || `Transaction #${idx + 1}`;

          dates.push(rawDate);

          let amount = 0;
          let type: "INCOME" | "EXPENSE" = "EXPENSE";

          if (creditKey && row[creditKey] && Number(String(row[creditKey]).replace(/[^0-9.]/g, "")) > 0) {
            amount = Number(String(row[creditKey]).replace(/[^0-9.]/g, ""));
            type = "INCOME";
          } else if (debitKey && row[debitKey] && Number(String(row[debitKey]).replace(/[^0-9.]/g, "")) > 0) {
            amount = Number(String(row[debitKey]).replace(/[^0-9.]/g, ""));
            type = "EXPENSE";
          } else if (amountKey && row[amountKey]) {
            amount = Number(String(row[amountKey]).replace(/[^0-9.-]/g, ""));
            if (typeKey && /cr|credit|income|deposit/i.test(String(row[typeKey]))) {
              type = "INCOME";
            } else if (amount < 0) {
              amount = Math.abs(amount);
              type = "EXPENSE";
            } else {
              type = "EXPENSE";
            }
          }

          if (amount <= 0 || isNaN(amount)) return;

          const defaultCat = categoryKey ? row[categoryKey] : undefined;
          const { category, isTaxDeductible, deductionSection } = classifyTransaction(rawDesc, defaultCat);

          if (type === "INCOME") {
            totalInflow += amount;
          } else {
            totalOutflow += amount;
            categoryTotals[category] = (categoryTotals[category] || 0) + amount;

            if (isTaxDeductible) {
              if (deductionSection === "80C") sec80C += amount;
              if (deductionSection === "80D") sec80D += amount;
              if (deductionSection === "HRA") hra += amount;
              if (deductionSection === "HOME_LOAN") homeLoan += amount;
            }
          }

          parsedTxs.push({
            id: `tx-${idx + 1}`,
            title: rawDesc,
            date: rawDate,
            amount,
            type,
            category,
            isTaxDeductible,
            deductionSection,
            confidenceScore: isTaxDeductible ? 95 : 88,
          });
        });

        // Statutory deduction caps
        const capped80C = Math.min(sec80C, 150000);
        const capped80D = Math.min(sec80D, 25000);
        const totalEligibleDeductions = capped80C + capped80D + hra + homeLoan;

        // Tax comparison
        const taxComparison = computeStatutoryTax(totalInflow, totalEligibleDeductions);

        const netSavings = totalInflow - totalOutflow;
        const savingsRate = totalInflow > 0 ? Math.round((netSavings / totalInflow) * 100) : 0;

        // Anomalies & Opportunities
        const anomalies: string[] = [];
        if (sec80C < 150000) {
          anomalies.push(`💡 Section 80C Opportunity: You utilized ₹${sec80C.toLocaleString("en-IN")}. You have ₹${(150000 - sec80C).toLocaleString("en-IN")} unused deduction headroom to save more tax!`);
        }
        if (sec80D === 0) {
          anomalies.push("⚠️ Section 80D Missing: No Health Insurance premium found. You can claim up to ₹25,000 u/s 80D for medical cover.");
        }
        if (totalOutflow > totalInflow) {
          anomalies.push("🚨 Negative Cash Flow: Your monthly outflow exceeds inflow by ₹" + Math.abs(netSavings).toLocaleString("en-IN"));
        }

        const generatedReport: StatementAuditReport = {
          fileName,
          statementPeriod: dates.length > 0 ? `${dates[0]} — ${dates[dates.length - 1]}` : "Current Period",
          totalTransactions: parsedTxs.length,
          totalInflow,
          totalOutflow,
          netSavings,
          savingsRate,
          deductions: {
            sec80C: capped80C,
            sec80D: capped80D,
            hra,
            homeLoan,
            totalEligible: totalEligibleDeductions,
          },
          taxComparison,
          categoryTotals,
          anomalies,
          transactions: parsedTxs,
        };

        setReport(generatedReport);
        setCurrentPage(1);
        setIsProcessing(false);
        toast.success(`Successfully analyzed ${parsedTxs.length} transactions and generated financial report!`);
      } catch (err: any) {
        setIsProcessing(false);
        toast.error("Failed to parse statement CSV: " + (err?.message || "Unknown format"));
      }
    }, 600);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a valid .csv file");
      return;
    }

    try {
      const fileText = await file.text();
      readString(fileText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            toast.error("The CSV file is empty");
            return;
          }
          processCsvRows(results.data as Record<string, any>[], file.name);
        },
      });
    } catch {
      toast.error("Error reading CSV file");
    }
  };

  const handleLoadDemo = () => {
    readString(DEMO_CSV_DATA, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processCsvRows(results.data as Record<string, any>[], "HDFC_Bank_Statement_Demo.csv");
      },
    });
  };

  const handleLoadFreelancerDemo = () => {
    readString(FREELANCER_CSV_DATA, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processCsvRows(results.data as Record<string, any>[], "ICICI_Freelancer_Statement.csv");
      },
    });
  };

  const handleAnalyzePastedCsv = () => {
    if (!pastedCsvText.trim()) {
      toast.error("Please paste CSV data with columns (Date, Narration, Debit, Credit)");
      return;
    }
    readString(pastedCsvText.trim(), {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          toast.error("Could not parse CSV. Ensure the first line contains headers (e.g. Date,Narration,Debit,Credit)");
          return;
        }
        processCsvRows(results.data as Record<string, any>[], "Custom_Pasted_Statement.csv");
      },
    });
  };

  const handleSyncToAccount = async () => {
    if (!report || report.transactions.length === 0) return;

    if (!user) {
      toast.error("Please login to your TaxGenie account to sync these transactions!");
      return;
    }

    setIsSyncing(true);
    try {
      const payloadTransactions = report.transactions.map((tx) => {
        let parsedDate = new Date(tx.date);
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date();
        }

        return {
          title: tx.title,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          description: `Imported via Statement Analyzer (${report.fileName})`,
          date: parsedDate.toISOString(),
          paymentMethod: "BANK_TRANSFER" as const,
          isRecurring: false,
        };
      });

      await bulkImportTransaction({
        transactions: payloadTransactions,
      }).unwrap();

      setIsSyncing(false);
      toast.success(`✨ Successfully synced all ${payloadTransactions.length} transactions to your TaxGenie database! Your Dashboard and Tax Optimizer are now updated.`);
    } catch (err: any) {
      setIsSyncing(false);
      toast.error(err?.data?.message || "Failed to batch import transactions");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return `₹${Math.round(val).toLocaleString("en-IN")}`;
  };

  const itemsPerPage = 8;
  const paginatedTxs = report
    ? report.transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];
  const totalPages = report ? Math.ceil(report.transactions.length / itemsPerPage) : 1;

  return (
    <div className="space-y-8">
      {/* Upload & Dropzone Header */}
      {!report && (
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/90 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-inner">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Smart CSV Statement Analyzer & Instant Report
            </CardTitle>
            <CardDescription className="max-w-xl mx-auto text-sm text-slate-500 dark:text-slate-400">
              Upload your bank statement, credit card export, or transaction CSV. TaxGenie will automatically extract all inflows, categorize expenses, detect Indian tax deductions (80C, 80D, HRA), and compute your Old vs New Regime tax report in seconds.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-2 max-w-2xl mx-auto">
            {/* Dropzone Container */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 dark:border-indigo-900/60 hover:border-indigo-500 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all bg-indigo-50/30 dark:bg-slate-950/40 hover:bg-indigo-50/60 dark:hover:bg-slate-950/60 group flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  Click to browse or drop your bank statement CSV file here
                </p>
                <p className="text-xs text-slate-400">
                  Supports HDFC, ICICI, SBI, Axis, Kotak, credit card exports, and custom CSVs (Up to 10MB)
                </p>
              </div>
            </div>

            {/* Quick Demo & Paste Options */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadDemo}
                  disabled={isProcessing}
                  className="rounded-full border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-xs font-semibold gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Salaried Demo (HDFC)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadFreelancerDemo}
                  disabled={isProcessing}
                  className="rounded-full border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-xs font-semibold gap-1.5 shadow-xs"
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                  Freelancer & Business Demo (ICICI)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasteInput(!showPasteInput)}
                  className="rounded-full border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs gap-1.5 shadow-xs"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  {showPasteInput ? "Hide Paste Area" : "Paste Raw CSV"}
                </Button>
              </div>

              {showPasteInput && (
                <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-slate-950/40 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Paste CSV rows with headers (Date, Narration, Debit, Credit)
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[11px] h-7 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/50"
                      onClick={() =>
                        setPastedCsvText(`Date,Narration,Debit,Credit,Balance
2026-10-01,SALARY CREDIT TCS TECH SERVICES,,225000,225000
2026-10-03,DIVIDEND RECEIVED RELIANCE INDUSTRIES,,12500,237500
2026-10-05,TRANSFER TO SBI PPF ACCOUNT (SEC 80C),150000,,87500
2026-10-08,HDFC ERGO HEALTH INSURANCE MEDICLAIM PREMIUM (SEC 80D),42000,,45500
2026-10-10,MONTHLY HOUSE RENT FOR APARTMENT 501 (HRA),40000,,5500
2026-10-12,ICICI BANK HOME LOAN EMI PRINCIPAL AND INTEREST,68000,,-62500
2026-10-14,FREELANCE PAYMENT WEB ARCHITECTURE DESIGN,,85000,22500
2026-10-18,AWS CLOUD SERVER HOSTING BUSINESS EXPENSE,18500,,4000
2026-10-20,ZOMATO FOOD AND RESTAURANT ORDER,1850,,2150
2026-10-22,CHEVRON PETROL PUMP TRAVEL COMMUTE,4500,,-2350`)
                      }
                    >
                      Fill Test Sample
                    </Button>
                  </div>
                  <Textarea
                    placeholder={`Date,Narration,Debit,Credit\n2026-10-01,Salary Credit,,120000\n2026-10-05,LIC Premium 80C,25000,`}
                    value={pastedCsvText}
                    onChange={(e) => setPastedCsvText(e.target.value)}
                    rows={5}
                    className="font-mono text-xs bg-white dark:bg-slate-900"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={isProcessing || !pastedCsvText.trim()}
                    onClick={handleAnalyzePastedCsv}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                  >
                    Analyze Pasted CSV Data
                  </Button>
                </div>
              )}
            </div>
          </CardContent>

          {isProcessing && (
            <CardFooter className="flex flex-col items-center gap-2 pb-8">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-xs font-medium text-slate-500 animate-pulse">
                Analyzing statement rows, matching tax sections & calculating regime slabs...
              </p>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Generated Report View */}
      {report && (
        <div className="space-y-6 animate-in fade-in duration-300 print:m-0">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{report.fileName}</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300">
                    Audit Verified
                  </Badge>
                </h3>
                <p className="text-xs text-slate-500">
                  {report.totalTransactions} transactions analyzed • Period: {report.statementPeriod}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReport(null)}
                className="rounded-xl text-xs gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Upload Another
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="rounded-xl text-xs gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Export PDF
              </Button>

              <Button
                size="sm"
                onClick={handleSyncToAccount}
                disabled={isSyncing}
                className="rounded-xl text-xs font-semibold gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-sm"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Apply & Sync to TaxGenie Account
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 4 Executive Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Inflow / Salary</p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(report.totalInflow)}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Deposits & Income credits</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Outflow</p>
                  <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                    {formatCurrency(report.totalOutflow)}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Expenses & Deductions</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Monthly Surplus</p>
                  <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                    {formatCurrency(report.netSavings)}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Savings Rate: {report.savingsRate}%</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Coins className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tax Deductions Found</p>
                  <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
                    {formatCurrency(report.deductions.totalEligible)}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Eligible 80C, 80D, HRA</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tax Optimization & Regime Recommendation Banner */}
          <Card className="border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Income Tax (FY 2026-27 / AY 2027-28) Automated Regime Audit
                  </CardTitle>
                </div>
                <Badge className="bg-indigo-600 text-white font-semibold">
                  Recommended: {report.taxComparison.recommended === "NEW" ? "New Tax Regime (Section 115BAC)" : "Old Tax Regime"}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Based on your extracted income ({formatCurrency(report.totalInflow)}) and identified tax-saving deductions ({formatCurrency(report.deductions.totalEligible)}).
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase">New Regime Tax Liability</span>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {formatCurrency(report.taxComparison.newRegimeTax)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Standard deduction: ₹75,000 | 87A rebate included
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Old Regime Tax Liability</span>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {formatCurrency(report.taxComparison.oldRegimeTax)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Standard deduction: ₹50,000 + Itemized 80C/80D/HRA
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Net Tax Savings</span>
                  <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(report.taxComparison.taxSaved)} Saved
                  </p>
                  <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 mt-1">
                    By adopting the recommended regime
                  </p>
                </div>
              </div>

              {/* Deductions breakdown row */}
              <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Section 80C (PPF/LIC)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(report.deductions.sec80C)} / ₹1.5L</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Section 80D (Health Ins.)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(report.deductions.sec80D)} / ₹25k</span>
                </div>
                <div>
                  <span className="text-slate-400 block">HRA Rent Exemption</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(report.deductions.hra)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Home Loan Interest</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(report.deductions.homeLoan)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Smart Anomalies and Opportunities */}
          {report.anomalies.length > 0 && (
            <Card className="border border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10">
              <CardHeader className="py-3 px-5">
                <CardTitle className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Tax Optimization Insights & Statement Anomalies
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {report.anomalies.map((msg, i) => (
                  <p key={i} className="flex items-start gap-2">
                    <span>{msg}</span>
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Category Breakdown & Extracted Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Distribution (1 col) */}
            <Card className="lg:col-span-1 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-500" />
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(report.categoryTotals).map(([cat, amt]) => {
                  const pct = report.totalOutflow > 0 ? Math.round((amt / report.totalOutflow) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(amt)} ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Extracted Transactions List (2 cols) */}
            <Card className="lg:col-span-2 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    Statement Transactions ({report.totalTransactions})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Auto-classified with tax deduction markers
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-y border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] bg-slate-50/50 dark:bg-slate-950/30">
                        <th className="py-2.5 px-4 text-left">Description</th>
                        <th className="py-2.5 px-3 text-left">Date</th>
                        <th className="py-2.5 px-3 text-left">Category</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedTxs.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="font-medium text-slate-900 dark:text-white truncate max-w-[220px]">
                              {t.title}
                            </div>
                            {t.isTaxDeductible && (
                              <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                                Eligible {t.deductionSection}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{t.date}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              {t.category}
                            </span>
                          </td>
                          <td className={`py-2.5 px-4 text-right font-bold whitespace-nowrap ${t.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                            {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>

              {/* Table pagination */}
              <CardFooter className="py-3 px-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-7 text-xs px-2.5"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 text-xs px-2.5"
                  >
                    Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
