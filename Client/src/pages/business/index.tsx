import { useState } from "react";
import PageLayout from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Briefcase, 
  FileSpreadsheet, 
  Users,
  IndianRupee,
  ShieldCheck
} from "lucide-react";
import TransactionTable from "@/components/transaction/transaction-table";
import AddTransactionDrawer from "@/components/transaction/add-transaction-drawer";
import { useGetAllTransactionsQuery } from "@/features/transaction/transactionAPI";

export default function BusinessFinance() {
  const { data: businessData, isLoading } = useGetAllTransactionsQuery({
    mode: "BUSINESS",
    pageSize: 100,
  });

  const transactions = businessData?.transations || [];

  let totalRevenue = 0;
  let totalBusinessExpenses = 0;
  let totalTaxDeductible = 0;
  let estimatedGstInputCredit = 0;
  const clientsOrVendors = new Set<string>();

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.clientOrVendor) clientsOrVendors.add(tx.clientOrVendor);
    if (tx.type === "INCOME") {
      totalRevenue += amt;
    } else {
      totalBusinessExpenses += amt;
      if (tx.isTaxDeductible) {
        totalTaxDeductible += amt;
      }
      if (tx.gstRate) {
        estimatedGstInputCredit += (amt * tx.gstRate) / 100;
      }
    }
  });

  const netProfit = totalRevenue - totalBusinessExpenses;

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <PageLayout
      title="Business Finance Command Center"
      subtitle="Track freelancer, startup, and SMB business revenue, vendor expenses, GST credits, and profit margins."
      addMarginTop
      rightAction={
        <AddTransactionDrawer />
      }
    >
      <div className="space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-sm bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total client payments received</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-gradient-to-br from-rose-500/5 to-transparent">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business Expenses</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-extrabold text-rose-600">{formatCurrency(totalBusinessExpenses)}</div>
              <p className="text-xs text-muted-foreground mt-1">Operational & vendor costs</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-gradient-to-br from-indigo-500/5 to-transparent">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimated Net Profit</span>
              <Briefcase className="w-4 h-4 text-indigo-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={`text-2xl font-extrabold ${netProfit >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
                {formatCurrency(netProfit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pre-tax cash flow profit</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GST Input Credit</span>
              <Receipt className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-extrabold text-purple-600">{formatCurrency(estimatedGstInputCredit)}</div>
              <p className="text-xs text-muted-foreground mt-1">Claimable GST input tax credit</p>
            </CardContent>
          </Card>
        </div>

        {/* Business Highlights & Deductibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Tax-Deductible Business Expenses
              </CardTitle>
              <CardDescription>Qualifying operational expenses eligible to reduce business tax liability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/30 border rounded-lg">
                <span className="text-sm font-medium">Total Tax-Deductible Spend</span>
                <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalTaxDeductible)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Includes office software subscriptions, equipment depreciation, legal fees, travel, and consulting fees recorded in Business Mode.
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Active Clients & Vendors
              </CardTitle>
              <CardDescription>Distinct clients and vendors associated with business transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/30 border rounded-lg">
                <span className="text-sm font-medium">Logged Client/Vendor Entities</span>
                <span className="text-lg font-bold text-blue-600">{clientsOrVendors.size} Entities</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Array.from(clientsOrVendors).slice(0, 10).map((name, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Transactions Table */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Business Transactions Ledger</CardTitle>
            <CardDescription>Showing transactions recorded in Business Mode</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionTable pageSize={20} />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
