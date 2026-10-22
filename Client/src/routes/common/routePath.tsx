export const isAuthRoute = (pathname: string): boolean => {
  return Object.values(AUTH_ROUTES).includes(pathname);
};

export const AUTH_ROUTES = {
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  FORGOT_PASSWORD: "/forgot-password",
};

export const APP_ROUTES = {
  DASHBOARD: "/",
  OVERVIEW: "/overview",
  TAX_CALCULATOR: "/tax-calculator",
  TAX_OPTIMIZER: "/tax-optimizer",
  TAX_SUMMARY: "/tax-summary",
  GST_SUMMARY: "/gst-summary",
  TAX_HISTORY: "/tax-history",
  GST_CALCULATOR: "/gst-calculator",
  INVOICES: "/invoices",
  AI_ADVISOR: "/ai-advisor",
  DEADLINES: "/deadlines",
  LEARN: "/learn",
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
