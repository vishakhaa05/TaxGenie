import { useState, useEffect } from "react";
import PageLayout from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Calculator, 
  Sparkles, 
  ArrowRight, 
  TrendingDown, 
  ShieldCheck, 
  CheckCircle2, 
  Info, 
  RefreshCw,
  HelpCircle,
  IndianRupee,
  FileText
} from "lucide-react";
import {
  useGetTaxConfigQuery,
  useLazyAutoPullDeductionsQuery,
  useCalculateTaxComparisonMutation,
} from "@/features/tax/taxAPI";
import { TaxComparisonResult } from "@/features/tax/taxType";

export default function TaxOptimizer() {
  const [financialYear, setFinancialYear] = useState("2026-2027");
  const [grossIncome, setGrossIncome] = useState<number>(1200000);
  const [isSalaried, setIsSalaried] = useState(true);
  
  // Deductions
  const [sec80C, setSec80C] = useState<number>(150000);
  const [sec80D, setSec80D] = useState<number>(25000);
  const [hraExemption, setHraExemption] = useState<number>(120000);
  const [homeLoanInterest, setHomeLoanInterest] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);

  const [comparison, setComparison] = useState<TaxComparisonResult | null>(null);

  const { data: configData, isLoading: isConfigLoading } = useGetTaxConfigQuery(financialYear);
  const [triggerAutoPull, { isFetching: isPulling }] = useLazyAutoPullDeductionsQuery();
  const [calculateTax, { isLoading: isCalculating }] = useCalculateTaxComparisonMutation();

  const handleCalculate = async () => {
    try {
      const res = await calculateTax({
        financialYear,
        grossIncome,
        isSalaried,
        sec80C,
        sec80D,
        hraExemption,
        homeLoanInterest,
        otherDeductions,
      }).unwrap();

      if (res.success) {
        setComparison(res.comparison);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to calculate tax comparison");
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleCalculate();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [grossIncome, isSalaried, sec80C, sec80D, hraExemption, homeLoanInterest, otherDeductions, financialYear]);

  const handleAutoPull = async () => {
    try {
      const res = await triggerAutoPull(financialYear).unwrap();
      if (res.success && res.deductions) {
        const { sec80C: pulled80C, sec80D: pulled80D, hraExemption: pulledHra, homeLoanInterest: pulledHome, otherDeductions: pulledOther, totalPulledCount } = res.deductions;
        setSec80C(pulled80C);
        setSec80D(pulled80D);
        setHraExemption(pulledHra);
        setHomeLoanInterest(pulledHome);
        setOtherDeductions(pulledOther);
        
        toast.success(`Successfully pulled ${totalPulledCount} tax-deductible transactions from database!`);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to auto-pull deductions");
    }
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <PageLayout
      title="Tax Optimizer"
      subtitle="Compare Old vs. New Regime, auto-pull deductible expenses, and optimize your tax savings."
      addMarginTop
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-lg shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                Income Tax Regime Calculator 
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                  FY {configData?.config?.financialYear || "2026-2027"} (AY {configData?.config?.assessmentYear || "2027-2028"})
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                TaxGenie AI auto-analyzes your tax deductions and calculates tax liabilities under both Old and New Tax Regimes in real-time.
              </p>
            </div>
          </div>
          <Button 
            onClick={handleAutoPull} 
            disabled={isPulling}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isPulling ? "animate-spin" : ""}`} />
            {isPulling ? "Pulling Transactions..." : "Auto-Pull Deductions"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Inputs & Tax Profile */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Tax Profile & Income
                </CardTitle>
                <CardDescription>Enter your income details and employment status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grossIncome" className="font-medium">Gross Annual Income (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="grossIncome"
                      type="number"
                      value={grossIncome || ""}
                      onChange={(e) => setGrossIncome(Number(e.target.value))}
                      className="pl-9 text-base font-semibold"
                      placeholder="1200000"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div>
                    <Label htmlFor="isSalaried" className="font-medium cursor-pointer">Salaried Individual</Label>
                    <p className="text-xs text-muted-foreground">Eligible for Standard Deduction (₹75k New / ₹50k Old)</p>
                  </div>
                  <Switch
                    id="isSalaried"
                    checked={isSalaried}
                    onCheckedChange={setIsSalaried}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Deductions Card */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Tax Deductions (Old Regime)
                  </CardTitle>
                  <CardDescription>Deductions only apply under the Old Tax Regime.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <Label htmlFor="sec80C">Section 80C (PPF, ELSS, EPF, LIC)</Label>
                    <span className="text-xs text-muted-foreground">Max ₹1,50,000</span>
                  </div>
                  <Input
                    id="sec80C"
                    type="number"
                    value={sec80C || 0}
                    onChange={(e) => setSec80C(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <Label htmlFor="sec80D">Section 80D (Health Insurance)</Label>
                    <span className="text-xs text-muted-foreground">Max ₹25,000</span>
                  </div>
                  <Input
                    id="sec80D"
                    type="number"
                    value={sec80D || 0}
                    onChange={(e) => setSec80D(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hraExemption" className="text-sm">HRA Exemption</Label>
                  <Input
                    id="hraExemption"
                    type="number"
                    value={hraExemption || 0}
                    onChange={(e) => setHraExemption(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="homeLoanInterest" className="text-sm">Home Loan Interest (Sec 24b)</Label>
                  <Input
                    id="homeLoanInterest"
                    type="number"
                    value={homeLoanInterest || 0}
                    onChange={(e) => setHomeLoanInterest(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherDeductions" className="text-sm">Other Deductions (80E, 80G, NPS 80CCD)</Label>
                  <Input
                    id="otherDeductions"
                    type="number"
                    value={otherDeductions || 0}
                    onChange={(e) => setOtherDeductions(Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Side-by-Side Comparison */}
          <div className="lg:col-span-7 space-y-6">
            {/* Recommendation Summary Banner */}
            {comparison && (
              <Card className={`border-2 shadow-sm ${comparison.recommendedRegime === "NEW_REGIME" ? "border-emerald-500 bg-emerald-500/5" : "border-blue-500 bg-blue-500/5"}`}>
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recommended Regime</span>
                      <Badge className={comparison.recommendedRegime === "NEW_REGIME" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}>
                        {comparison.recommendedRegime === "NEW_REGIME" ? "NEW TAX REGIME" : "OLD TAX REGIME"}
                      </Badge>
                    </div>
                    <p className="text-base font-medium text-foreground pt-1">
                      {comparison.summary}
                    </p>
                  </div>
                  <div className="bg-background border rounded-xl p-3 px-4 text-center shrink-0 shadow-sm">
                    <span className="text-xs text-muted-foreground uppercase font-medium">Potential Tax Savings</span>
                    <p className="text-xl font-extrabold text-emerald-600">
                      {formatCurrency(comparison.taxSavings)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comparison Table / Cards */}
            {comparison && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old Regime Card */}
                <Card className={`border ${comparison.recommendedRegime === "OLD_REGIME" ? "border-blue-500 shadow-md ring-1 ring-blue-500" : ""}`}>
                  <CardHeader className="bg-muted/30 pb-3 border-b">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-semibold">Old Tax Regime</CardTitle>
                      {comparison.recommendedRegime === "OLD_REGIME" && (
                        <Badge variant="default" className="bg-blue-600">Optimal Choice</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Annual Income:</span>
                      <span className="font-medium">{formatCurrency(comparison.grossIncome)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Standard Deduction:</span>
                      <span>- {formatCurrency(comparison.oldRegime.standardDeduction)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Sec 80C Deductions:</span>
                      <span>- {formatCurrency(comparison.oldRegime.deductions80C)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Sec 80D Deductions:</span>
                      <span>- {formatCurrency(comparison.oldRegime.deductions80D)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>HRA / Home Loan / Other:</span>
                      <span>- {formatCurrency((comparison.oldRegime.hraExemption || 0) + (comparison.oldRegime.homeLoanInterest || 0) + (comparison.oldRegime.otherDeductions || 0))}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Taxable Income:</span>
                      <span>{formatCurrency(comparison.oldRegime.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax Before Rebate:</span>
                      <span>{formatCurrency(comparison.oldRegime.taxBeforeRebate)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Rebate (Sec 87A):</span>
                      <span>- {formatCurrency(comparison.oldRegime.rebate87A)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cess (4%):</span>
                      <span>+ {formatCurrency(comparison.oldRegime.cess)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-extrabold pt-1">
                      <span>Total Tax Liability:</span>
                      <span className={comparison.recommendedRegime === "OLD_REGIME" ? "text-blue-600" : "text-foreground"}>
                        {formatCurrency(comparison.oldRegime.totalTaxLiability)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* New Regime Card */}
                <Card className={`border ${comparison.recommendedRegime === "NEW_REGIME" ? "border-emerald-500 shadow-md ring-1 ring-emerald-500" : ""}`}>
                  <CardHeader className="bg-muted/30 pb-3 border-b">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-semibold">New Tax Regime</CardTitle>
                      {comparison.recommendedRegime === "NEW_REGIME" && (
                        <Badge variant="default" className="bg-emerald-600">Optimal Choice</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Annual Income:</span>
                      <span className="font-medium">{formatCurrency(comparison.grossIncome)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Standard Deduction:</span>
                      <span>- {formatCurrency(comparison.newRegime.standardDeduction)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-xs italic">
                      <span>Other Deductions (80C, 80D, HRA):</span>
                      <span>Not Applicable</span>
                    </div>
                    <div className="py-[18px]"></div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Taxable Income:</span>
                      <span>{formatCurrency(comparison.newRegime.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax Before Rebate:</span>
                      <span>{formatCurrency(comparison.newRegime.taxBeforeRebate)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Rebate (Sec 87A up to ₹12L):</span>
                      <span>- {formatCurrency(comparison.newRegime.rebate87A)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cess (4%):</span>
                      <span>+ {formatCurrency(comparison.newRegime.cess)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-extrabold pt-1">
                      <span>Total Tax Liability:</span>
                      <span className={comparison.recommendedRegime === "NEW_REGIME" ? "text-emerald-600" : "text-foreground"}>
                        {formatCurrency(comparison.newRegime.totalTaxLiability)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Tax Explanations & Knowledge Base */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-500" />
                  Tax Genie Knowledge Assistant
                </CardTitle>
                <CardDescription>Understanding Indian Income Tax Rules & Sections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="difference" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="difference">Old vs New</TabsTrigger>
                    <TabsTrigger value="sec80c">Section 80C</TabsTrigger>
                    <TabsTrigger value="hra">HRA & 87A</TabsTrigger>
                  </TabsList>
                  <TabsContent value="difference" className="pt-3 text-sm space-y-2">
                    <p className="text-muted-foreground">
                      <strong>New Tax Regime</strong> offers lower tax slab rates but removes most deductions (80C, 80D, HRA). It includes a full tax rebate u/s 87A for taxable income up to ₹12 Lakhs (effective zero tax for income up to ₹12.75L for salaried individuals with Standard Deduction).
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Old Tax Regime</strong> allows you to claim all traditional deductions (80C up to ₹1.5L, 80D up to ₹25k-₹50k, HRA exemption, and Home Loan interest). Choose Old Regime if your total deductions exceed ₹3.75 Lakhs.
                    </p>
                  </TabsContent>
                  <TabsContent value="sec80c" className="pt-3 text-sm space-y-2">
                    <p className="text-muted-foreground">
                      <strong>Section 80C</strong> allows a maximum tax deduction of ₹1,50,000 per financial year. Eligible investments include Provident Fund (EPF/PPF), Equity Linked Savings Schemes (ELSS), Life Insurance Premiums, National Savings Certificates (NSC), and Principal repayment on Home Loans.
                    </p>
                  </TabsContent>
                  <TabsContent value="hra" className="pt-3 text-sm space-y-2">
                    <p className="text-muted-foreground">
                      <strong>House Rent Allowance (HRA)</strong> is exempt under Section 10(13A) of the Old Regime for salaried employees paying rent.
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Section 87A Rebate</strong> provides full relief if your taxable income stays below the specified threshold, reducing tax liability to zero.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="p-4 bg-muted/40 border rounded-xl flex items-start gap-3 text-xs text-muted-foreground">
              <Info className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
              <p>
                <strong>TaxGenie Disclaimer:</strong> TaxGenie provides estimated tax calculations for informational purposes. Tax rules may change based on Government of India finance budget announcements. Verify applicable rules for the relevant financial year or consult a qualified chartered accountant / tax professional before filing or making tax decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
