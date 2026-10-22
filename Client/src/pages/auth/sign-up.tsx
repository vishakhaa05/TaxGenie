import SignUpForm from "./_component/signup-form";
import Logo from "@/components/logo/logo";
import { ShieldCheck, TrendingDown, Receipt, Sparkles } from "lucide-react";

const SignUp = () => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-slate-50 dark:bg-slate-950">
      {/* Left Column: Sign Up Form with Logo */}
      <div className="flex flex-col gap-4 p-6 md:p-10 md:pt-6">
        <div className="flex justify-center md:justify-start">
          <Logo url="/" size="lg" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <SignUpForm />
          </div>
        </div>
      </div>

      {/* Right Column: Modern SaaS Welcome Showcase */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#1E1B4B] text-white border-l border-slate-800">
        <div className="absolute top-1/4 right-10 w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Income Tax Act 2025 Ready</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Indian Income Tax & GST, explained in plain language.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Create an account to save your tax computations, download GST invoices, and track your deductions all year round.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Save & Compare Calculations</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Keep a history of your salaried and freelance tax scenarios across financial years.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Regime Optimization & Marginal Relief</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automated relief calculations for incomes right above ₹12 Lakhs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Professional PDF Invoicing</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Issue clean, GST-compliant invoices for your clients and vendors.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-4 border-t border-slate-800/60 text-[11px] text-slate-400">
          Estimates only. Please consult a CA before filing.
        </div>
      </div>
    </div>
  );
};

export default SignUp;