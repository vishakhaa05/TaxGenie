import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Check, 
  Crown, 
  Sparkles, 
  Clock, 
  Zap, 
  Building2, 
  ShieldCheck, 
  RefreshCw 
} from "lucide-react";
import {
  useGetSubscriptionStatusQuery,
  useUpgradeSubscriptionPlanMutation,
} from "@/features/subscription/subscriptionAPI";

export default function Billing() {
  const { data: subData, isLoading, refetch } = useGetSubscriptionStatusQuery();
  const [upgradePlan, { isLoading: isUpgrading }] = useUpgradeSubscriptionPlanMutation();

  const currentPlan = subData?.subscription?.plan || "FREE";
  const status = subData?.subscription?.status || "TRIALING";
  const daysRemaining = subData?.daysRemaining ?? 7;
  const isActive = subData?.isActive ?? true;

  const handleUpgrade = async (plan: "PRO" | "BUSINESS") => {
    try {
      const res = await upgradePlan({ plan }).unwrap();
      if (res.success) {
        toast.success(res.message || `Successfully upgraded to ${plan} plan!`);
        refetch();
      }
    } catch (err: any) {
      toast.error(err?.data?.message || `Failed to upgrade to ${plan} plan`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Billing & Subscriptions</h3>
        <p className="text-sm text-muted-foreground">
          Manage your TaxGenie 7-day free trial, active plan, and premium features.
        </p>
      </div>
      <Separator />

      {/* Trial Status Banner */}
      <Card className="border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent shadow-sm">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Subscription Overview
              </span>
              <Badge 
                variant="outline" 
                className={
                  status === "ACTIVE" 
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }
              >
                {status === "TRIALING" ? "7-DAY FREE TRIAL ACTIVE" : status}
              </Badge>
            </div>
            <h4 className="text-xl font-bold text-foreground">
              Current Plan: <span className="text-emerald-600 uppercase">{currentPlan}</span>
            </h4>
            <p className="text-sm text-muted-foreground">
              {status === "TRIALING" ? (
                <>Your 7-day free trial has <strong>{daysRemaining} days remaining</strong>. Upgrade anytime to maintain unlimited access to AI Tax Optimizer and Advisor.</>
              ) : (
                <>Your plan is active and renews automatically.</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 cursor-pointer">
              <RefreshCw className="w-4 h-4" /> Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Free / Trial Plan */}
        <Card className={`border ${currentPlan === "FREE" ? "border-emerald-500 ring-1 ring-emerald-500" : ""}`}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold">Free Trial</CardTitle>
              {currentPlan === "FREE" && <Badge>Current Plan</Badge>}
            </div>
            <CardDescription>7 days full access to core finance tracking</CardDescription>
            <div className="pt-2">
              <span className="text-3xl font-extrabold">₹0</span>
              <span className="text-sm text-muted-foreground"> / 7 days</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Income & Expense Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>CSV Transaction Import</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>AI Receipt Scanner (5/mo)</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 opacity-50" />
              <span>7-Day Trial Duration</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              {currentPlan === "FREE" ? "Active Plan" : "Free Plan"}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className={`border-2 relative ${currentPlan === "PRO" ? "border-emerald-500 ring-2 ring-emerald-500" : "border-emerald-500/50 shadow-md"}`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
            Most Popular
          </div>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold flex items-center gap-1.5">
                <Crown className="w-5 h-5 text-amber-500" /> Pro Plan
              </CardTitle>
              {currentPlan === "PRO" && <Badge className="bg-emerald-600">Current Plan</Badge>}
            </div>
            <CardDescription>Full AI Tax Optimizer & Financial Advisor</CardDescription>
            <div className="pt-2">
              <span className="text-3xl font-extrabold">₹499</span>
              <span className="text-sm text-muted-foreground"> / month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Everything in Free +</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>AI Old vs New Tax Optimizer</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>TaxGenie AI Assistant Chatbot</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Spending Anomaly Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Automated Monthly Email Reports</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleUpgrade("PRO")} 
              disabled={isUpgrading || currentPlan === "PRO"}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {currentPlan === "PRO" ? "Current Plan" : "Upgrade to Pro"}
            </Button>
          </CardFooter>
        </Card>

        {/* Business Plan */}
        <Card className={`border ${currentPlan === "BUSINESS" ? "border-purple-500 ring-1 ring-purple-500" : ""}`}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold flex items-center gap-1.5">
                <Building2 className="w-5 h-5 text-purple-600" /> Business Plan
              </CardTitle>
              {currentPlan === "BUSINESS" && <Badge className="bg-purple-600">Current Plan</Badge>}
            </div>
            <CardDescription>Designed for Freelancers & Small Businesses</CardDescription>
            <div className="pt-2">
              <span className="text-3xl font-extrabold">₹1,499</span>
              <span className="text-sm text-muted-foreground"> / month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-purple-600" />
              <span>Everything in Pro +</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-600" />
              <span>Business Finance Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-600" />
              <span>Client / Vendor Expenses</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-600" />
              <span>GST Input Credit Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-purple-600" />
              <span>Priority Support & API Access</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleUpgrade("BUSINESS")} 
              disabled={isUpgrading || currentPlan === "BUSINESS"}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
            >
              {currentPlan === "BUSINESS" ? "Current Plan" : "Upgrade to Business"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
