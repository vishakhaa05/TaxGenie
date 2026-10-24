import { lazy, Suspense } from "react";
import { AUTH_ROUTES, APP_ROUTES } from "./routePath";
import RouteLoader from "@/components/ui/route-loader";

const SignIn = lazy(() => import("@/pages/auth/sign-in"));
const SignUp = lazy(() => import("@/pages/auth/sign-up"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Transactions = lazy(() => import("@/pages/transactions"));
const TaxOptimizer = lazy(() => import("@/pages/tax-optimizer"));
const AiAdvisor = lazy(() => import("@/pages/ai-advisor"));
const BusinessFinance = lazy(() => import("@/pages/business"));
const InvoiceGenerator = lazy(() => import("@/pages/invoices"));
const AdminPanel = lazy(() => import("@/pages/admin"));
const ForecastingAndHealth = lazy(() => import("@/pages/forecasting"));
const TaxDocuments = lazy(() => import("@/pages/tax-documents"));
const Reports = lazy(() => import("@/pages/reports"));
const Settings = lazy(() => import("@/pages/settings"));
const Account = lazy(() => import("@/pages/settings/account"));
const Appearance = lazy(() => import("@/pages/settings/appearance"));
const Billing = lazy(() => import("@/pages/settings/billing"));

const IncomeTaxPage = lazy(() => import("@/pages/income-tax/IncomeTaxPage"));
const ResultPage = lazy(() => import("@/pages/income-tax/ResultPage"));
const HistoryPage = lazy(() => import("@/pages/income-tax/HistoryPage"));

const withSuspense = (component: React.ReactNode) => (
  <Suspense fallback={<RouteLoader />}>{component}</Suspense>
);

export const authenticationRoutePaths = [
  { path: AUTH_ROUTES.SIGN_IN, element: withSuspense(<SignIn />) },
  { path: AUTH_ROUTES.SIGN_UP, element: withSuspense(<SignUp />) },
];

// Publicly accessible inside AppShell (calculators and dashboard work without login)
export const publicAppRoutePaths = [
  { path: APP_ROUTES.DASHBOARD, element: withSuspense(<Dashboard />) },
  { path: APP_ROUTES.OVERVIEW, element: withSuspense(<Dashboard />) },
  { path: APP_ROUTES.INCOME_TAX, element: withSuspense(<IncomeTaxPage />) },
  { path: APP_ROUTES.INCOME_TAX_RESULT, element: withSuspense(<ResultPage />) },
  { path: APP_ROUTES.INCOME_TAX_HISTORY, element: withSuspense(<HistoryPage />) },
  { path: APP_ROUTES.TAX_CALCULATOR, element: withSuspense(<IncomeTaxPage />) },
  { path: APP_ROUTES.TAX_OPTIMIZER, element: withSuspense(<ResultPage />) },
  { path: APP_ROUTES.TAX_HISTORY, element: withSuspense(<HistoryPage />) },
  { path: APP_ROUTES.TAX_SUMMARY, element: withSuspense(<Dashboard />) },
  { path: APP_ROUTES.GST_SUMMARY, element: withSuspense(<Dashboard />) },
  { path: APP_ROUTES.GST_CALCULATOR, element: withSuspense(<InvoiceGenerator />) },
  { path: APP_ROUTES.INVOICES, element: withSuspense(<InvoiceGenerator />) },
  { path: APP_ROUTES.AI_ADVISOR, element: withSuspense(<AiAdvisor />) },
  { path: APP_ROUTES.DEADLINES, element: withSuspense(<Dashboard />) },
  { path: APP_ROUTES.LEARN, element: withSuspense(<Dashboard />) },
];

// Protected routes (require user login)
export const protectedRoutePaths = [
  { path: APP_ROUTES.TRANSACTIONS, element: withSuspense(<Transactions />) },
  { path: APP_ROUTES.BUSINESS, element: withSuspense(<BusinessFinance />) },
  { path: APP_ROUTES.TAX_HISTORY, element: withSuspense(<TaxOptimizer />) },
  { path: APP_ROUTES.ADMIN, element: withSuspense(<AdminPanel />) },
  { path: APP_ROUTES.FORECASTING, element: withSuspense(<ForecastingAndHealth />) },
  { path: APP_ROUTES.TAX_DOCUMENTS, element: withSuspense(<TaxDocuments />) },
  { path: APP_ROUTES.REPORTS, element: withSuspense(<Reports />) },
  {
    path: APP_ROUTES.SETTINGS,
    element: withSuspense(<Settings />),
    children: [
      { index: true, element: withSuspense(<Account />) },
      { path: APP_ROUTES.SETTINGS, element: withSuspense(<Account />) },
      { path: APP_ROUTES.SETTINGS_APPEARANCE, element: withSuspense(<Appearance />) },
      { path: APP_ROUTES.SETTINGS_BILLING, element: withSuspense(<Billing />) },
    ],
  },
];
