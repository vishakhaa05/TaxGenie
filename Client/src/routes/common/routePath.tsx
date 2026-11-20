export const isAuthRoute = (pathname: string): boolean => {
  return Object.values(AUTH_ROUTES).includes(pathname);
};

export const AUTH_ROUTES = {
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
};

export const APP_ROUTES = {
  DASHBOARD: "/",
  OVERVIEW: "/overview",
  INCOME_TAX: "/income-tax",
  INCOME_TAX_RESULT: "/income-tax/result",
  INCOME_TAX_HISTORY: "/income-tax/history",
  TAX_CALCULATOR: "/tax-calculator",
  TAX_OPTIMIZER: "/tax-optimizer",
  TAX_SUMMARY: "/tax-summary",
  GST_SUMMARY: "/gst-summary",
  TAX_HISTORY: "/tax-history",
  HISTORY: "/history",
  GST: "/gst",
  GST_CALCULATOR: "/gst",
  INVOICES: "/invoices",
  INVOICES_NEW: "/invoices/new",
  INVOICES_VIEW: "/invoices/:id",
  INVOICES_EDIT: "/invoices/:id/edit",
  INVOICES_CUSTOMERS: "/invoices/customers",
  INVOICES_SETTINGS: "/invoices/settings",
  AI_ADVISOR: "/ai-advisor",
  DEADLINES: "/deadlines",
  LEARN: "/learn",
  PROFILE: "/account/profile",
  SETTINGS: "/settings",
  SETTINGS_APPEARANCE: "/settings/appearance",
  SETTINGS_BILLING: "/settings/billing",
  ADMIN: "/admin",
  BUSINESS: "/business",
  TRANSACTIONS: "/transactions",
  FORECASTING: "/forecasting",
  TAX_DOCUMENTS: "/tax-documents",
  REPORTS: "/reports",
};

export const PROTECTED_ROUTES = APP_ROUTES;

