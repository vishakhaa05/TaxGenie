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

  // Keep track of which accordion sub-menus are expanded
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
      label: t("nav.dashboard"),
      href: "/",
      icon: LayoutDashboard,
      subItems: [
        { label: t("nav.overview"), href: "/" },
        { label: t("nav.taxSummary"), href: "/tax-summary" },
        { label: t("nav.gstSummary"), href: "/gst-summary" },
      ],
    },
    {
      key: "incomeTax",
      label: t("nav.incomeTax"),
      href: "/income-tax",
      icon: Calculator,
      subItems: [
        { label: t("nav.calculator"), href: "/income-tax" },
        { label: t("nav.compareRegimes"), href: "/income-tax/result" },
        { label: t("nav.history"), href: "/income-tax/history" },
      ],
    },
    {
      key: "gst",
      label: t("nav.gst"),
      href: "/gst-calculator",
      icon: Receipt,
      subItems: [
        { label: t("nav.gstCalculator"), href: "/gst-calculator" },
        { label: t("nav.invoices"), href: "/invoices" },
      ],
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
    {
      key: "reports",
      label: "Reports & Statement",
      href: "/reports",
      icon: FileSpreadsheet,
    },
    {
      key: "aiAssistant",
      label: t("nav.aiAssistant"),
      href: "/ai-advisor",
      icon: Sparkles,
      badge: "3",
    },
    {
      key: "deadlines",
      label: t("nav.deadlines"),
      href: "/deadlines",
      icon: Calendar,
    },
    {
      key: "learn",
      label: t("nav.learn"),
      href: "/learn",
      icon: BookOpen,
    },
  ];

  const moreItems: NavItem[] = [
    {
      key: "account",
      label: t("nav.account"),
      href: "/settings",
      icon: User,
    },
    {
      key: "admin",
      label: t("nav.admin"),
      href: "/admin",
      icon: ShieldCheck,
      badge: "Phase 2",
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
                    ? "bg-[#1E293B] text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:bg-[#1E293B]/60 hover:text-slate-200"
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
                      isItemActive ? "text-indigo-400" : "text-slate-400 group-hover:text-indigo-300"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </NavLink>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      item.badge === "Phase 2"
                        ? "bg-slate-800 text-slate-400 border border-slate-700"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    }`}
                  >
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
                              ? "text-indigo-300 font-semibold bg-indigo-500/10"
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

      {/* Sidebar container - Navy in BOTH modes */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B1120] text-slate-300 border-r border-[#1E293B] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#1E293B]">
          <Logo url="/" theme="dark" />

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation scrollable content */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* Section: PAGES */}
          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {t("nav.pages")}
            </p>
            {renderNavGroup(pagesItems)}
          </div>

          {/* Section: MORE */}
          <div>
            <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {t("nav.more")}
            </p>
            {renderNavGroup(moreItems)}
          </div>
        </div>

        {/* Bottom card: CA assistance notice */}
        <div className="p-3.5 border-t border-[#1E293B]">
          <div className="p-3 rounded-xl bg-gradient-to-b from-[#1E293B]/80 to-[#131E30] border border-[#334155]/60 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Need CA Verification?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              TaxGenie generates accurate estimates. Consult our network CAs for audit & filing.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
