import PageLayout from "@/components/page-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet, History } from "lucide-react";
import ScheduleReportDrawer from "./_component/schedule-report-drawer";
import ReportTable from "./_component/report-table";
import CsvStatementAnalyzer from "./_component/csv-statement-analyzer";

export default function Reports() {
  return (
    <PageLayout
      title="Financial Reports & Statement Analyzer"
      subtitle="Analyze bank CSV statements, extract tax deductions, generate instant audit reports, or schedule monthly deliveries."
      addMarginTop
      rightAction={<ScheduleReportDrawer />}
    >
      <Tabs defaultValue="analyzer" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-1 rounded-xl">
          <TabsTrigger
            value="analyzer"
            className="rounded-lg text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV Statement Analyzer & Instant Report
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 gap-2"
          >
            <History className="w-4 h-4" />
            Scheduled Email Reports & History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyzer" className="m-0 focus-visible:outline-none">
          <CsvStatementAnalyzer />
        </TabsContent>

        <TabsContent value="history" className="m-0 focus-visible:outline-none">
          <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/90 shadow-sm">
            <CardContent className="pt-6">
              <ReportTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
