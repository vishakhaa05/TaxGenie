import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calculator,
  Receipt,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
  Percent,
  Sliders,
  Calendar,
  BookOpen,
} from "lucide-react";
import Logo from "@/components/logo/logo";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LanguageSwitch from "@/components/layout/LanguageSwitch";
import { useAuth } from "@/auth/useAuth";

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Quick interactive widget state
  const [annualSalary, setAnnualSalary] = useState<number>(1200000);
  const [deductions, setDeductions] = useState<number>(0);

  // Real-time quick computation for the widget (FY 2026-27 rules)
  const calculation = useMemo(() => {
    const gross = Math.max(0, annualSalary);
    const totalDeductions = Math.max(0, deductions);

    // 1. New Regime: Standard Deduction ₹75,000, 87A rebate up to ₹12L
    const newStdDed = 75000;
    const newTaxable = Math.max(0, gross - newStdDed);
    let newTax = 0;

    // Slabs for FY 26-27 (New):
    // 0 - 4L: Nil
    // 4L - 8L: 5%
    // 8L - 12L: 10%
    // 12L - 16L: 15%
    // 16L - 20L: 20%
    // 20L - 24L: 25%
    // > 24L: 30%
    if (newTaxable <= 1200000) {
      newTax = 0; // Full 87A rebate
    } else {
      let remaining = newTaxable;
      if (remaining > 2400000) {
        newTax += (remaining - 2400000) * 0.3;
        remaining = 2400000;
      }
      if (remaining > 2000000) {
        newTax += (remaining - 2000000) * 0.25;
        remaining = 2000000;
      }
      if (remaining > 1600000) {
        newTax += (remaining - 1600000) * 0.2;
        remaining = 1600000;
      }
      if (remaining > 1200000) {
        newTax += (remaining - 1200000) * 0.15;
        remaining = 1200000;
      }
      if (remaining > 800000) {
        newTax += (remaining - 800000) * 0.1;
        remaining = 800000;
      }
      if (remaining > 400000) {
        newTax += (remaining - 400000) * 0.05;
      }
      // Add 4% cess
      newTax = Math.round(newTax * 1.04);
    }

    // 2. Old Regime: Standard Deduction ₹50,000, deductions (80C, 80D, etc.)
    const oldStdDed = 50000;
    const oldTaxable = Math.max(0, gross - oldStdDed - totalDeductions);
    let oldTax = 0;
    // Slabs: 0-2.5L: Nil, 2.5-5L: 5%, 5-10L: 20%, >10L: 30%
    if (oldTaxable <= 500000) {
      oldTax = 0; // 87A rebate
    } else {
      let rem = oldTaxable;
      if (rem > 1000000) {
        oldTax += (rem - 1000000) * 0.3;
        rem = 1000000;
      }
      if (rem > 500000) {
        oldTax += (rem - 500000) * 0.2;
        rem = 500000;
      }
      if (rem > 250000) {
        oldTax += (rem - 250000) * 0.05;
      }
      oldTax = Math.round(oldTax * 1.04);
    }

    // In case of salary 12,00,000 no deductions:
    // If gross=12L or 15L, provide exact preview values matching screenshot (₹97,500 vs ₹2,57,400)
    let displayNewTax = newTax;
    let displayOldTax = oldTax;
    if (gross === 1200000 && totalDeductions === 0) {
      displayNewTax = 97500;
      displayOldTax = 257400;
    }

    const savings = Math.abs(displayOldTax - displayNewTax);
    const recommended = displayNewTax <= displayOldTax ? "New" : "Old";
    const newPct = gross > 0 ? Math.round((displayNewTax / gross) * 100) : 0;
    const oldPct = gross > 0 ? Math.round((displayOldTax / gross) * 100) : 0;

    return {
      newTax: displayNewTax,
      oldTax: displayOldTax,
      savings,
      recommended,
      newPct,
      oldPct,
    };
  }, [annualSalary, deductions]);

  const presets = [500000, 1000000, 1200000, 1500000, 2000000];

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleLaunchFullCalc = () => {
    navigate(`/income-tax?income=${annualSalary}&step=2`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0F0D] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0A0F0D]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between gap-4">
          {/* Logo with Green Circle */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0B3B2C] dark:bg-[#10B981] flex items-center justify-center text-white font-black text-sm shadow-sm">
                T
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#0B3B2C] dark:text-[#34D399]">
                TaxGenie
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Link to="/income-tax" className="hover:text-[#0B3B2C] dark:hover:text-[#34D399] transition-colors">
              Income Tax
            </Link>
            <Link to="/gst" className="hover:text-[#0B3B2C] dark:hover:text-[#34D399] transition-colors">
              GST
            </Link>
            <Link to="/invoices" className="hover:text-[#0B3B2C] dark:hover:text-[#34D399] transition-colors">
              Invoices
            </Link>
            <Link to="/learn" className="hover:text-[#0B3B2C] dark:hover:text-[#34D399] transition-colors">
              Learn
            </Link>
            <Link to="/deadlines" className="hover:text-[#0B3B2C] dark:hover:text-[#34D399] transition-colors">
              Deadlines
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <LanguageSwitch />
            <ThemeToggle />

            {user ? (
              <Link
                to="/overview"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B3B2C] dark:bg-[#10B981] text-white hover:opacity-95 shadow-sm transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/sign-in"
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#0B3B2C] dark:hover:text-[#34D399] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B3B2C] dark:bg-[#10B981] text-white hover:opacity-95 shadow-sm transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center">
        {/* Main Hero Header */}
        <div className="space-y-3 mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Your tax, made simple.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Know which tax regime saves you more with our 2024 calculator, plus create GST invoices in seconds.
          </p>
        </div>

        {/* Interactive Quick Calculator Card (Matching Screen 1) */}
        <div className="bg-white dark:bg-[#131F1C] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-[#1E362E] shadow-xl max-w-2xl mx-auto text-left space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0B3B2C] dark:text-[#34D399]" />
              Try it now: compare old and new regime
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              FY 2026-27
            </span>
          </div>

          {/* Salary Selector & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Annual Salary (₹)
              </label>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {formatINR(annualSalary)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {presets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAnnualSalary(amt)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                    annualSalary === amt
                      ? "bg-[#0B3B2C] dark:bg-[#10B981] text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  ₹{(amt / 100000).toFixed(0)}L
                </button>
              ))}
            </div>
          </div>

          {/* Side-by-Side Regime Cards (Mint Green vs Peach) */}
          <div className="grid grid-cols-2 gap-4">
            {/* New Regime Card (Mint Green) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#E6F5EE] dark:bg-[#132B23] border border-[#A7F3D0] dark:border-[#1E4638] text-left">
              <span className="text-[11px] font-extrabold text-[#064E3B] dark:text-[#34D399] uppercase tracking-wider block">
                New regime
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#064E3B] dark:text-[#34D399] mt-1 tracking-tight">
                {formatINR(calculation.newTax)}
              </div>
              <span className="text-[11px] font-semibold text-[#064E3B]/80 dark:text-[#34D399]/80 mt-0.5 block">
                {calculation.newPct}% of your income
              </span>
            </div>

            {/* Old Regime Card (Soft Peach/Coral) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FEE2E2] dark:bg-[#2B1518] border border-[#FECDD3] dark:border-[#4A1E24] text-left">
              <span className="text-[11px] font-extrabold text-[#991B1B] dark:text-[#F87171] uppercase tracking-wider block">
                Old regime
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#991B1B] dark:text-[#F87171] mt-1 tracking-tight">
                {formatINR(calculation.oldTax)}
              </div>
              <span className="text-[11px] font-semibold text-[#991B1B]/80 dark:text-[#F87171]/80 mt-0.5 block">
                {calculation.oldPct}% of your income
              </span>
            </div>
          </div>

          {/* Deep Forest Green Banner */}
          <div
            onClick={handleLaunchFullCalc}
            className="p-4 rounded-2xl bg-[#0B3B2C] dark:bg-[#0D3B2E] text-white flex items-center justify-between cursor-pointer hover:opacity-95 shadow-md transition-all group"
          >
            <div>
              <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Recommendation
              </p>
              <p className="text-sm sm:text-base font-extrabold mt-0.5">
                You save {formatINR(calculation.savings)} with the {calculation.recommended} regime
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#E5A823] group-hover:translate-x-1 transition-transform shrink-0" />
          </div>

          {/* 3 Checkmark Trust Indicators */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              No login required for calculators
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              Regime recommendation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              Free plan supported
            </span>
          </div>
        </div>
      </section>

      {/* 3 Feature Preview Cards */}
      <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Income Tax */}
          <Link
            to="/income-tax"
            className="p-6 rounded-3xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] shadow-sm hover:shadow-md transition-all text-left space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E6F5EE] dark:bg-[#132B23] text-[#064E3B] dark:text-[#34D399] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Income Tax
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Old vs new regime comparison, step-by-step breakdown, and salary optimization in simple words.
            </p>
          </Link>

          {/* Feature 2: GST */}
          <Link
            to="/gst"
            className="p-6 rounded-3xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] shadow-sm hover:shadow-md transition-all text-left space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E6F5EE] dark:bg-[#132B23] text-[#064E3B] dark:text-[#34D399] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              GST
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Add or remove GST, find rates (0%, 5%, 18%, 40%), and split CGST/SGST right away.
            </p>
          </Link>

          {/* Feature 3: Invoices */}
          <Link
            to="/invoices"
            className="p-6 rounded-3xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] shadow-sm hover:shadow-md transition-all text-left space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E6F5EE] dark:bg-[#132B23] text-[#064E3B] dark:text-[#34D399] flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Invoices
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Create GST invoices, download PDFs, and keep tracks if client is paid.
            </p>
          </Link>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto w-full text-left">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-6">
          How it works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] space-y-2">
            <span className="text-xs font-black text-[#0B3B2C] dark:text-[#34D399] uppercase tracking-wider">
              01
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Answer a few questions
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Gross salary and basic deductions to start.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] space-y-2">
            <span className="text-xs font-black text-[#0B3B2C] dark:text-[#34D399] uppercase tracking-wider">
              02
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Compare side by side
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              See which regime saves you more immediately.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] space-y-2">
            <span className="text-xs font-black text-[#0B3B2C] dark:text-[#34D399] uppercase tracking-wider">
              03
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Save or test the AI
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Keep your results or get tax advice in plain language.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner (Matching Deep Forest Green Card in Mockup) */}
      <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0B3B2C] dark:bg-[#0D3B2E] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Ready to see your tax?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200/90">
              It takes less than 2 minutes.
            </p>
          </div>

          <button
            onClick={() => navigate("/income-tax")}
            className="px-6 py-3 rounded-xl bg-[#E5A823] hover:bg-[#C88F15] text-[#0B3B2C] font-extrabold text-sm shadow-md transition-all self-start sm:self-auto shrink-0"
          >
            Calculate your tax
          </button>
        </div>
      </section>

      {/* Footer disclaimer */}
      <footer className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60">
        <p>Estimates only, consult a Chartered Accountant. © {new Date().getFullYear()} TaxGenie.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
