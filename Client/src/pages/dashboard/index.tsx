import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Calculator,
  Receipt,
  Calendar,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/auth/useAuth";
import { getDashboardSummaryApi, DashboardSummaryData } from "@/features/calculations/api";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTaxYear, setActiveTaxYear] = useState<string>("2026-27");
  const [dashboardData, setDashboardData] = useState<DashboardSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchDashboard() {
      setIsLoading(true);
      try {
        const res = await getDashboardSummaryApi(activeTaxYear);
        if (isMounted && res.data) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, [user, activeTaxYear]);

  // Determine user greeting
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const userName = user?.name ? user.name.split(" ")[0] : "Vishakha";

  // Comparison Bar Chart Data (Old vs New across income slabs matching mockup)
  const regimeComparisonData = [
    { income: "₹5L", newTax: 0, oldTax: 0 },
    { income: "₹7.5L", newTax: 0, oldTax: 26000 },
    { income: "₹10L", newTax: 0, oldTax: 78000 },
    { income: "₹12L", newTax: 97500, oldTax: 257400 },
    { income: "₹15L", newTax: 104000, oldTax: 273000 },
    { income: "₹20L", newTax: 208000, oldTax: 429000 },
  ];

  // Income Donut Data
  const incomeDonutData = [
    { name: "Salary", value: 80, color: "#10B981" },
    { name: "Freelance", value: 15, color: "#34D399" },
    { name: "Other", value: 5, color: "#A7F3D0" },
  ];

  // Upcoming Deadlines
  const deadlines = [
    { title: "Advance Tax Q4", date: "15 Mar", status: "Upcoming", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { title: "GSTR-1 Return", date: "11 Apr", status: "Due soon", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { title: "ITR Filing", date: "31 Jul", status: "Annual", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  ];

  // Recent Activity items
  const recentActivities = [
    { id: "1", type: "invoice", title: "Invoice INV-0012", date: "Today", amount: "₹45,000", status: "Paid", statusColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" },
    { id: "2", type: "tax", title: "Tax Calculation FY26", date: "Yesterday", amount: "₹97,500", status: "Saved", statusColor: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300" },
    { id: "3", type: "gst", title: "GST Rate: 18% Supply", date: "18 Nov", amount: "₹18,450", status: "Done", statusColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Greeting & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {greeting}, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of your income tax calculations, regime savings, and GST status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tax Year Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] text-xs font-bold shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#0B3B2C] dark:text-[#34D399]" />
            <select
              value={activeTaxYear}
              onChange={(e) => setActiveTaxYear(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="2026-27" className="dark:bg-[#131F1C]">FY 2026-27 (New Rules)</option>
              <option value="2025-26" className="dark:bg-[#131F1C]">FY 2025-26</option>
              <option value="2024-25" className="dark:bg-[#131F1C]">FY 2024-25</option>
            </select>
          </div>

          <Link
            to="/income-tax"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0B3B2C] dark:bg-[#10B981] hover:opacity-95 shadow-sm transition-all"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>New calculation</span>
          </Link>
        </div>
      </div>

      {/* Main Top Grid (Matching Screen 2 & Screen 3 in Mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Deep Forest Green Hero Savings Card (7 cols) */}
        <div className="lg:col-span-7 bg-[#0B3B2C] dark:bg-[#0D3B2E] rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
              Tax Regime Optimization
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              You save ₹1,59,900 with the New regime
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80">
              Based on ₹12,00,000 salary & no deductions
            </p>
          </div>

          {/* Visual Regime Comparison Bar */}
          <div className="my-6 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-emerald-300">New Regime (₹97,500)</span>
              <span className="text-rose-300">Old Regime (₹2,57,400)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-emerald-950/60 overflow-hidden flex">
              <div className="bg-[#10B981] h-full" style={{ width: "27%" }} />
              <div className="bg-[#F87171] h-full" style={{ width: "73%" }} />
            </div>
            <p className="text-[11px] text-emerald-200/70 text-right">
              Old regime tax is 2.6x higher without ₹3.75L+ deductions
            </p>
          </div>

          <div>
            <Link
              to="/income-tax/result"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E5A823] hover:bg-[#C88F15] text-[#0B3B2C] font-extrabold text-xs shadow-md transition-all"
            >
              <span>See detailed breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: 2 Metric Cards (5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
          {/* Card 1: New regime tax ₹97,500 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                New regime tax
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F5EE] dark:bg-[#132B23] text-[#064E3B] dark:text-[#34D399] border border-[#A7F3D0] dark:border-[#1E4638]">
                Recommended
              </span>
            </div>
            <div className="my-2">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                ₹97,500
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Effective tax rate: 8.1% of gross income
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Standard deduction</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">₹75,000 applied</span>
            </div>
          </div>

          {/* Card 2: Advance tax due / tax saved ₹18,450 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Advance tax due (Q4)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Due 15 Mar
              </span>
            </div>
            <div className="my-2">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                ₹18,450
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Installment 4 of 4 for FY 2026-27
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Total calculated tax</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">₹97,500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Chart: Old vs New regime across income brackets (Matching Mockup) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Old vs New regime
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compare tax cost for different income slabs
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-[#10B981]">
              <span className="w-3 h-3 rounded-sm bg-[#10B981]" />
              New regime
            </span>
            <span className="flex items-center gap-1.5 text-[#F87171]">
              <span className="w-3 h-3 rounded-sm bg-[#F87171]" />
              Old regime
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regimeComparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
              <XAxis dataKey="income" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${val / 1000}k`}
              />
              <Tooltip
                formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Tax Payable"]}
                contentStyle={{
                  backgroundColor: "#0B3B2C",
                  borderRadius: "12px",
                  border: "none",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="newTax" fill="#10B981" radius={[6, 6, 0, 0]} name="New Regime" />
              <Bar dataKey="oldTax" fill="#F87171" radius={[6, 6, 0, 0]} name="Old Regime" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom 3-Card Row (Matching Mockup) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Upcoming deadlines */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0B3B2C] dark:text-[#34D399]" />
              Upcoming deadlines
            </h4>
            <Link to="/deadlines" className="text-[11px] font-bold text-[#0B3B2C] dark:text-[#34D399] hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {deadlines.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">{item.date}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.color}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Income split (Donut Chart) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Income split
            </h4>
            <span className="text-[11px] font-bold text-slate-400">Total ₹12.0L</span>
          </div>

          <div className="h-36 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={55}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {incomeDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val}%`, "Share"]}
                  contentStyle={{
                    backgroundColor: "#0B3B2C",
                    borderRadius: "8px",
                    border: "none",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              Salary (80%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
              Freelance (15%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A7F3D0]" />
              Other (5%)
            </span>
          </div>
        </div>

        {/* Card 3: Recent activity */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131F1C] border border-slate-200 dark:border-[#1E362E] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0B3B2C] dark:text-[#34D399]" />
              Recent activity
            </h4>
            <Link to="/history" className="text-[11px] font-bold text-[#0B3B2C] dark:text-[#34D399] hover:underline">
              History
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100/60 dark:border-slate-800/60 last:border-none">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{act.title}</p>
                  <p className="text-[10px] text-slate-400">{act.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 dark:text-white">{act.amount}</p>
                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${act.statusColor}`}>
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
