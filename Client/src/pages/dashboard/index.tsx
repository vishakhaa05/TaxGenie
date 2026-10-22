import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, TrendingDown, Receipt, Calculator, FileText, Receipt as ReceiptIcon } from "lucide-react";
import GreetingBanner from "@/components/dashboard/GreetingBanner";
import ToolbarRow from "@/components/dashboard/ToolbarRow";
import KpiCard from "@/components/dashboard/KpiCard";
import RegimeBarChartCard from "@/components/dashboard/RegimeBarChartCard";
import TaxLineChartCard from "@/components/dashboard/TaxLineChartCard";
import IncomeDonutChartCard from "@/components/dashboard/IncomeDonutChartCard";
import RecentActivityTable, { ActivityItem } from "@/components/dashboard/RecentActivityTable";
import { useSummaryAnalyticsQuery } from "@/features/analytics/analyticsAPI";
import { useGetAllTransactionsQuery } from "@/features/transaction/transactionAPI";
import { useTypedSelector } from "@/app/hook";

export default function Dashboard() {
  const { t } = useTranslation();
  const [activeTaxYear, setActiveTaxYear] = useState<string>("2026-2027");

  const user = useTypedSelector((state) => state.auth.user);
  const { data: summaryData } = useSummaryAnalyticsQuery(
    { preset: "30days" },
    { skip: !user }
  );
  const { data: transactionData } = useGetAllTransactionsQuery(
    { pageSize: 5 },
    { skip: !user }
  );

  const totalIncome = summaryData?.data?.totalIncome || 0;
  const totalExpenses = summaryData?.data?.totalExpenses || 0;

  // Format dynamic activity list if user has real transactions in database
  const rawTxList = transactionData?.transactions || transactionData?.transations;
  const userActivities: ActivityItem[] | undefined = rawTxList?.length
    ? rawTxList.map((tx: any) => ({
        id: tx._id || tx.id,
        type: tx.title,
        icon: tx.mode === "BUSINESS" ? FileText : tx.isTaxDeductible ? Calculator : ReceiptIcon,
        category: (tx.gstRate ? "gst" : tx.isTaxDeductible ? "tax" : "invoice") as "tax" | "gst" | "invoice",
        date: new Date(tx.date || tx.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        amount: Number(tx.amount) || 0,
        taxOrGst: tx.gstAmount || 0,
        savingsOrRate: tx.isTaxDeductible ? `Sec ${tx.deductionSection || "80C"}` : tx.gstRate ? `${tx.gstRate}% GST` : undefined,
        status: (tx.status === "COMPLETED" ? "optimized" : "pending") as "optimized" | "settled" | "pending",
      }))
    : undefined;

  const estimatedTaxDisplay = user && totalIncome > 0 ? `₹${Math.round(totalIncome * 0.1).toLocaleString("en-IN")}` : "₹0";
  const taxSavedDisplay = user && totalIncome > 0 ? `₹${Math.round(totalIncome * 0.05).toLocaleString("en-IN")}` : "₹1,12,500";
  const gstPositionDisplay = user && totalExpenses > 0 ? `₹${Math.round(totalExpenses * 0.18).toLocaleString("en-IN")}` : "₹42,800";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Greeting Banner */}
      <GreetingBanner />

      {/* 2. Toolbar Row (Filters, Tax Year selector, New Calculation button) */}
      <ToolbarRow
        activeTaxYear={activeTaxYear}
        onTaxYearChange={(year) => setActiveTaxYear(year)}
      />

      {/* 3. Row of 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* KPI 1: Estimated Tax */}
        <KpiCard
          title={t("kpis.estimatedTax.title")}
          caption={t("kpis.estimatedTax.caption")}
          value={estimatedTaxDisplay}
          tooltip={t("kpis.estimatedTax.tooltip")}
          badgeText={t("kpis.estimatedTax.badge")}
          badgeType="positive"
          icon={ShieldCheck}
          sparklineData={[35000, 28000, 20000, 15000, 8000, 0, 0]}
          comparisonData={[45000, 42000, 39000, 36000, 35000, 32000, 30000]}
        />

        {/* KPI 2: Tax Saved */}
        <KpiCard
          title={t("kpis.taxSaved.title")}
          caption={t("kpis.taxSaved.caption")}
          value={taxSavedDisplay}
          tooltip={t("kpis.taxSaved.tooltip")}
          badgeText={t("kpis.taxSaved.badge")}
          badgeType="savings"
          icon={TrendingDown}
          sparklineData={[20000, 40000, 65000, 80000, 95000, 105000, 112500]}
          comparisonData={[15000, 25000, 40000, 50000, 60000, 75000, 80000]}
        />

        {/* KPI 3: GST Position */}
        <KpiCard
          title={t("kpis.gstCollected.title")}
          caption={t("kpis.gstCollected.caption")}
          value={gstPositionDisplay}
          tooltip={t("kpis.gstCollected.tooltip")}
          badgeText={t("kpis.gstCollected.badge")}
          badgeType="neutral"
          icon={Receipt}
          sparklineData={[25000, 32000, 28000, 39000, 34000, 41000, 42800]}
          comparisonData={[20000, 24000, 26000, 30000, 32000, 35000, 38000]}
        />
      </div>

      {/* 4. Row of 2 Chart Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Old vs New Regime Grouped Bar Chart */}
        <RegimeBarChartCard />

        {/* Tax over time Line Chart with Dotted Comparison */}
        <TaxLineChartCard />
      </div>

      {/* 5. Row of 2 Cards: Income Donut Chart & Recent Activity Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Where your income comes from (1 col) */}
        <div className="lg:col-span-1">
          <IncomeDonutChartCard />
        </div>

        {/* Recent Activity Table (2 cols) */}
        <div className="lg:col-span-2">
          <RecentActivityTable activities={userActivities} />
        </div>
      </div>
    </div>
  );
}
