import { useState } from "react";
import PageLayout from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Target, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react";
import { useSummaryAnalyticsQuery } from "@/features/analytics/analyticsAPI";
import { useGetAllTransactionsQuery } from "@/features/transaction/transactionAPI";

export default function ForecastingAndHealth() {
  const [timeframe, setTimeframe] = useState<"7days" | "30days" | "90days">("30days");
  
  const { data: summaryData, isLoading: isSummaryLoading } = useSummaryAnalyticsQuery({ preset: "30days" });
  const { data: recurringData, isLoading: isTxLoading } = useGetAllTransactionsQuery({
    recurringStatus: "RECURRING",
    pageSize: 50,
  });

  const totalIncome = summaryData?.data?.totalIncome || 0;
  const totalExpenses = summaryData?.data?.totalExpenses || 0;
  const savingsRate = summaryData?.data?.savingRate?.percentage || 0;
  const availableBalance = summaryData?.data?.availableBalance || 0;

  // Health Score Calculation based on real user data
  let savingsScore = Math.min(25, Math.max(0, (savingsRate / 25) * 25));
  let expenseScore = totalIncome > 0 ? Math.min(20, Math.max(0, (1 - totalExpenses / totalIncome) * 25)) : 10;
  let taxScore = 15; // default active tax planning
  let recurringScore = (recurringData?.transations?.length || 0) > 0 ? 20 : 10;
  let emergencyScore = availableBalance > totalExpenses * 3 ? 20 : 10;

  const totalHealthScore = Math.round(savingsScore + expenseScore + taxScore + recurringScore + emergencyScore);

  // Cash Flow Forecasting calculation
  const multiplier = timeframe === "7days" ? 0.25 : timeframe === "30days" ? 1 : 3;
  const projectedIncome = totalIncome * multiplier;
  const recurringTotal = (recurringData?.transations || []).reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const projectedExpense = (totalExpenses + recurringTotal) * multiplier;
  const projectedNetBalance = availableBalance + (projectedIncome - projectedExpense);

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <PageLayout
      title="Financial Health & Cash Flow Forecast"
      subtitle="Data-driven financial health scoring and 7/30/90-day cash flow projections."
      addMarginTop
    >
      <div className="space-y-6">
        {/* Health Score Overview Card */}
        <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-background border rounded-2xl shadow-sm text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">TaxGenie Financial Health Score</span>
                <div className="my-3 relative flex items-center justify-center">
                  <span className="text-5xl font-black text-emerald-600">{totalHealthScore}</span>
                  <span className="text-lg font-bold text-muted-foreground">/100</span>
                </div>
                <Badge className={totalHealthScore >= 75 ? "bg-emerald-600" : totalHealthScore >= 50 ? "bg-amber-600" : "bg-rose-600"}>
                  {totalHealthScore >= 75 ? "Excellent Health" : totalHealthScore >= 50 ? "Moderate Health" : "Needs Improvement"}
                </Badge>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Health Breakdown Metrics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1.5 p-3 bg-background/80 border rounded-xl">
                    <div className="flex justify-between font-medium">
                      <span>Savings Rate ({savingsRate}%)</span>
                      <span>{Math.round(savingsScore)}/25</span>
                    </div>
                    <Progress value={(savingsScore / 25) * 100} className="h-1.5" />
                  </div>

                  <div className="space-y-1.5 p-3 bg-background/80 border rounded-xl">
                    <div className="flex justify-between font-medium">
                      <span>Expense Control</span>
                      <span>{Math.round(expenseScore)}/20</span>
                    </div>
                    <Progress value={(expenseScore / 20) * 100} className="h-1.5" />
                  </div>

                  <div className="space-y-1.5 p-3 bg-background/80 border rounded-xl">
                    <div className="flex justify-between font-medium">
                      <span>Emergency Fund Liquidity</span>
                      <span>{Math.round(emergencyScore)}/20</span>
                    </div>
                    <Progress value={(emergencyScore / 20) * 100} className="h-1.5" />
                  </div>

                  <div className="space-y-1.5 p-3 bg-background/80 border rounded-xl">
                    <div className="flex justify-between font-medium">
                      <span>Recurring Obligation Control</span>
                      <span>{Math.round(recurringScore)}/20</span>
                    </div>
                    <Progress value={(recurringScore / 20) * 100} className="h-1.5" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Forecasting Section */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Cash Flow Forecast Projections
              </CardTitle>
              <CardDescription>Estimated inflows and outflows based on recurring payments and historical trends</CardDescription>
            </div>

            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={timeframe === "7days" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe("7days")}
                className="text-xs"
              >
                7 Days
              </Button>
              <Button
                variant={timeframe === "30days" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe("30days")}
                className="text-xs"
              >
                30 Days
              </Button>
              <Button
                variant={timeframe === "90days" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe("90days")}
                className="text-xs"
              >
                90 Days
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" /> Projected Inflows
                </span>
                <p className="text-2xl font-extrabold text-emerald-600">{formatCurrency(projectedIncome)}</p>
              </div>

              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                  <ArrowDownRight className="w-4 h-4 text-rose-600" /> Projected Outflows
                </span>
                <p className="text-2xl font-extrabold text-rose-600">{formatCurrency(projectedExpense)}</p>
              </div>

              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                  <Target className="w-4 h-4 text-indigo-600" /> Projected Net Balance
                </span>
                <p className="text-2xl font-extrabold text-indigo-600">{formatCurrency(projectedNetBalance)}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              *Note: Cash flow projections are estimated based on active recurring schedules and past 30-day averages. Actual amounts may vary.
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Recurring Payments */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Upcoming Recurring Obligations
            </CardTitle>
            <CardDescription>Scheduled recurring income and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {recurringData?.transations && recurringData.transations.length > 0 ? (
              <div className="space-y-3">
                {recurringData.transations.map((tx) => (
                  <div key={tx._id} className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                    <div>
                      <h4 className="font-semibold text-sm">{tx.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        Category: {tx.category} • Frequency: <span className="uppercase font-medium text-emerald-600">{tx.recurringInterval}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-sm ${tx.type === "INCOME" ? "text-emerald-600" : "text-foreground"}`}>
                        {tx.type === "INCOME" ? "+" : "-"} {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-xl space-y-2">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                <h4 className="text-sm font-medium">No Recurring Payments Scheduled</h4>
                <p className="text-xs text-muted-foreground">
                  Mark transaction as "Recurring" when adding expenses to auto-track subscriptions and EMIs.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
