import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Calculator,
  Receipt,
  Sparkles,
  Calendar,
  BookOpen,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Flame,
  X,
  ArrowLeftRight,
  Briefcase,
  TrendingUp,
  FolderLock,
  FileSpreadsheet,
} from "lucide-react";
import Logo from "../logo/logo";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  subItems?: { label: string; href: string }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dashboard: true,
    incomeTax: true,
    gst: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const pagesItems: NavItem[] = [
    {
      key: "dashboard",
      label: t("nav.dashboard", "Dashboard"),
      href: "/overview",
      icon: LayoutDashboard,
      subItems: [
        { label: t("nav.overview", "Overview"), href: "/overview" },
        { label: "Product Landing", href: "/landing" },
        { label: t("nav.taxSummary", "Tax Summary"), href: "/tax-summary" },
        { label: t("nav.gstSummary", "GST Summary"), href: "/gst-summary" },
      ],
    },
    {
      key: "incomeTax",
      label: t("nav.incomeTax", "Income Tax"),
      href: "/income-tax",
      icon: Calculator,
      subItems: [
        { label: t("nav.calculator", "Calculator"), href: "/income-tax" },
        { label: t("nav.compareRegimes", "Compare Regimes"), href: "/income-tax/result" },
        { label: t("nav.history", "Saved Calculations"), href: "/income-tax/history" },
      ],
    },
    {
      key: "gst",
      label: t("nav.gstAndInvoices", "GST & Invoices"),
      href: "/gst",
      icon: Receipt,
      subItems: [
        { label: t("nav.gstCalculator", "GST Calculator"), href: "/gst" },
        { label: t("nav.invoices", "Invoices"), href: "/invoices" },
        { label: t("nav.customers", "Customers"), href: "/invoices/customers" },
        { label: t("nav.businessProfile", "Business Profile"), href: "/invoices/settings" },
      ],
    },
    {
      key: "aiAssistant",
      label: t("nav.aiAssistant", "AI Tax Assistant"),
      href: "/ai-advisor",
      icon: Sparkles,
      badge: "Gemini",
    },
    {
      key: "deadlines",
      label: t("nav.deadlines", "Tax Deadlines"),
      href: "/deadlines",
      icon: Calendar,
    },
    {
      key: "learn",
      label: t("nav.learn", "Tax Glossary (Learn)"),
      href: "/learn",
      icon: BookOpen,
    },
    {
      key: "transactions",
      label: "Transactions",
      href: "/transactions",
      icon: ArrowLeftRight,
    },
    {
      key: "business",
      label: "Business Finance",
      href: "/business",
      icon: Briefcase,
    },
    {
      key: "forecasting",
      label: "Cash Flow & Health",
      href: "/forecasting",
      icon: TrendingUp,
    },
    {
      key: "vault",
      label: "Tax Vault",
      href: "/tax-documents",
      icon: FolderLock,
    },
  ];

  const renderNavGroup = (items: NavItem[]) => {
    return (
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isItemActive =
            location.pathname === item.href ||
            (item.subItems && item.subItems.some((sub) => location.pathname === sub.href));
          const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
          const isExpanded = expandedSections[item.key];

          return (
            <li key={item.key} className="relative">
              <div
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                  isItemActive
                    ? "bg-[#0B3B2C] dark:bg-[#0D3B2E] text-white shadow-sm font-bold border border-[#10B981]/40"
                    : "text-slate-400 hover:bg-[#132620] hover:text-slate-200"
                }`}
              >
                <NavLink
                  to={item.href}
                  onClick={() => {
                    if (!hasSubItems && window.innerWidth < 1024) onClose();
                  }}
                  className="flex items-center gap-3 flex-1 overflow-hidden"
                >
                  <Icon
                    className={`w-4 h-4 transition-colors shrink-0 ${
                      isItemActive ? "text-[#10B981] dark:text-[#34D399]" : "text-slate-400 group-hover:text-[#10B981]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </NavLink>

                {item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                    {item.badge}
                  </span>
                )}

                {hasSubItems && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSection(item.key);
                    }}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    aria-label={`Toggle ${item.label} sub-items`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Sub items dropdown list */}
              {hasSubItems && isExpanded && (
                <ul className="mt-1 pl-9 pr-2 space-y-1">
                  {item.subItems!.map((sub) => {
                    const isSubActive = location.pathname === sub.href;
                    return (
                      <li key={sub.href}>
                        <NavLink
                          to={sub.href}
                          onClick={() => {
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={`block py-1.5 px-2.5 rounded-lg text-xs transition-colors ${
                            isSubActive
                              ? "text-[#34D399] font-bold bg-[#10B981]/15"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                          }`}
                        >
                          {sub.label}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      {/* Sidebar container - Dark Forest Green-Black in BOTH modes */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#07130F] text-slate-300 border-r border-[#132620] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#132620]">
          <Logo url="/landing" theme="dark" />

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable navigation body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              TAX & FINANCE MODULES
            </span>
            {renderNavGroup(pagesItems)}
          </div>
        </div>

        {/* Bottom Profile / Quick Info Footer */}
        <div className="p-3.5 border-t border-[#132620] bg-[#05100C]">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              FY 2026-27 Active
            </span>
            <Link to="/income-tax" className="text-[#34D399] font-bold hover:underline">
              Calculate
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
