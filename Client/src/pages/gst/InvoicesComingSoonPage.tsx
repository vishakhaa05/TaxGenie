import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileCheck2,
  Receipt,
  Sparkles,
  ArrowLeft,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import PageLayout from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function InvoicesComingSoonPage() {
  const { t } = useTranslation();

  const upcomingFeatures = [
    {
      title: t("invoices.feature1Title", "CGST Rule 46 Compliant"),
      desc: t(
        "invoices.feature1Desc",
        "Generates statutory B2B and B2C tax invoices complete with supplier and recipient GSTINs."
      ),
      icon: ShieldCheck,
    },
    {
      title: t("invoices.feature2Title", "Automated HSN & State Splitting"),
      desc: t(
        "invoices.feature2Desc",
        "Automatic intra-state (CGST + SGST) vs inter-state (IGST) split based on buyer place of supply."
      ),
      icon: Receipt,
    },
    {
      title: t("invoices.feature3Title", "Downloadable PDF & Thermal Print"),
      desc: t(
        "invoices.feature3Desc",
        "Clean, professional PDF invoice downloads and print-ready formats for small business billing."
      ),
      icon: Printer,
    },
    {
      title: t("invoices.feature4Title", "Direct Prefill from Calculator"),
      desc: t(
        "invoices.feature4Desc",
        "Instantly convert any calculation from the GST Calculator into an issued client tax invoice."
      ),
      icon: Sparkles,
    },
  ];

  return (
    <PageLayout
      title={t("invoices.pageTitle", "GST Invoice Generator")}
      subtitle={t(
        "invoices.pageSubtitle",
        "Generate, download, and track professional GST-compliant tax invoices for your clients."
      )}
      rightAction={
        <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/10">
          {t("invoices.comingSoonBadge", "Coming in Phase 6")}
        </span>
      }
    >
      <div className="max-w-4xl mx-auto space-y-8 py-4 sm:py-8">
        {/* Hero Card */}
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-linear-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <CardContent className="p-6 sm:p-10 text-center space-y-6 relative">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider shadow-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{t("invoices.phaseNotice", "Phase 6 Preview")}</span>
            </div>

            <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
              <FileCheck2 className="w-8 h-8" />
            </div>

            <div className="space-y-3 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                {t("invoices.heroTitle", "Professional Invoicing is on the way")}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                {t(
                  "invoices.heroDesc",
                  "We are crafting a comprehensive GST invoice engine for freelancers, traders, and shop owners. In the meantime, use the GST Calculator to compute tax breakdowns instantly."
                )}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/gst"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
              >
                <Receipt className="w-4 h-4" />
                <span>{t("invoices.goToCalculator", "Use GST Calculator")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("invoices.backToDashboard", "Back to Dashboard")}</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Feature Preview Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            {t("invoices.whatToExpect", "What to expect in the invoice generator")}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-start gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {feat.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
