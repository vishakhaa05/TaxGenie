import { lazy, Suspense } from "react";
import { AUTH_ROUTES, APP_ROUTES } from "./routePath";
import RouteLoader from "@/components/ui/route-loader";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const VerifyEmailPage = lazy(() => import("@/pages/auth/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));

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
const ProfilePage = lazy(() => import("@/pages/account/ProfilePage"));

const IncomeTaxPage = lazy(() => import("@/pages/income-tax/IncomeTaxPage"));
const ResultPage = lazy(() => import("@/pages/income-tax/ResultPage"));
const HistoryPage = lazy(() => import("@/pages/history/HistoryPage"));
const GstCalculatorPage = lazy(() => import("@/pages/gst/GstCalculatorPage"));
const InvoiceListPage = lazy(() => import("@/pages/invoices/InvoiceListPage"));
const InvoiceBuilderPage = lazy(() => import("@/pages/invoices/InvoiceBuilderPage"));
const InvoiceViewPage = lazy(() => import("@/pages/invoices/InvoiceViewPage"));
const CustomersPage = lazy(() => import("@/pages/invoices/CustomersPage"));
const BusinessProfilePage = lazy(() => import("@/pages/invoices/BusinessProfilePage"));
const InvoicesComingSoonPage = lazy(() => import("@/pages/gst/InvoicesComingSoonPage"));

const withSuspense = (component: React.ReactNode) => (
  <Suspense fallback={<RouteLoader />}>{component}</Suspense>
);

export const authenticationRoutePaths = [
  { path: AUTH_ROUTES.SIGN_IN, element: withSuspense(<LoginPage />) },
  { path: AUTH_ROUTES.LOGIN, element: withSuspense(<LoginPage />) },
  { path: AUTH_ROUTES.SIGN_UP, element: withSuspense(<RegisterPage />) },
  { path: AUTH_ROUTES.REGISTER, element: withSuspense(<RegisterPage />) },
  { path: AUTH_ROUTES.VERIFY_EMAIL, element: withSuspense(<VerifyEmailPage />) },
  { path: AUTH_ROUTES.FORGOT_PASSWORD, element: withSuspense(<ForgotPasswordPage />) },
  { path: AUTH_ROUTES.RESET_PASSWORD, element: withSuspense(<ResetPasswordPage />) },
];

// Publicly accessible inside AppShell (calculators, invoices builder and dashboard work without login)
export const publicAppRoutePaths = [
  { path: APP_ROUTES.DASHBOARD, element: withSuspense(<Dashboard />) },
  { path: APP_ROUTES.OVERVIEW, element: withSuspense(<Dashboard />) },
  { path: APP_ROUTES.INCOME_TAX, element: withSuspense(<IncomeTaxPage />) },
  { path: APP_ROUTES.INCOME_TAX_RESULT, element: withSuspense(<ResultPage />) },
  { path: APP_ROUTES.INCOME_TAX_HISTORY, element: withSuspense(<HistoryPage />) },
  { path: APP_ROUTES.HISTORY, element: withSuspense(<HistoryPage />) },
  { path: APP_ROUTES.TAX_CALCULATOR, element: withSuspense(<IncomeTaxPage />) },
  { path: APP_ROUTES.TAX_OPTIMIZER, element: withSuspense(<ResultPage />) },
  { path: APP_ROUTES.TAX_HISTORY, element: withSuspense(<HistoryPage />) },
  { path: APP_ROUTES.TAX_SUMMARY, element: withSuspense(<Dashboard />) },
  { path: APP_ROUTES.GST_SUMMARY, element: withSuspense(<Dashboard />) },
  { path: "/gst", element: withSuspense(<GstCalculatorPage />) },
  { path: "/gst-calculator", element: withSuspense(<GstCalculatorPage />) },
  { path: APP_ROUTES.INVOICES, element: withSuspense(<InvoiceListPage />) },
  { path: APP_ROUTES.INVOICES_NEW, element: withSuspense(<InvoiceBuilderPage />) },
  { path: APP_ROUTES.INVOICES_VIEW, element: withSuspense(<InvoiceViewPage />) },
  { path: APP_ROUTES.INVOICES_EDIT, element: withSuspense(<InvoiceBuilderPage />) },
  { path: APP_ROUTES.INVOICES_CUSTOMERS, element: withSuspense(<CustomersPage />) },
  { path: APP_ROUTES.INVOICES_SETTINGS, element: withSuspense(<BusinessProfilePage />) },
  { path: APP_ROUTES.AI_ADVISOR, element: withSuspense(<AiAdvisor />) },
  { path: APP_ROUTES.DEADLINES, element: withSuspense(<Dashboard />) },
  { path: APP_ROUTES.LEARN, element: withSuspense(<Dashboard />) },
];

// Protected routes (require user login)
export const protectedRoutePaths = [
  { path: APP_ROUTES.PROFILE, element: withSuspense(<ProfilePage />) },
  { path: APP_ROUTES.SETTINGS, element: withSuspense(<ProfilePage />) },
  { path: APP_ROUTES.TRANSACTIONS, element: withSuspense(<Transactions />) },
  { path: APP_ROUTES.BUSINESS, element: withSuspense(<BusinessFinance />) },
  { path: APP_ROUTES.ADMIN, element: withSuspense(<AdminPanel />) },
  { path: APP_ROUTES.FORECASTING, element: withSuspense(<ForecastingAndHealth />) },
  { path: APP_ROUTES.TAX_DOCUMENTS, element: withSuspense(<TaxDocuments />) },
  { path: APP_ROUTES.REPORTS, element: withSuspense(<Reports />) },
];

