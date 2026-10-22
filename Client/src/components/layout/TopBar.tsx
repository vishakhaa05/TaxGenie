import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  User as UserIcon,
  LogOut,
  Settings,
  Calendar,
  ExternalLink,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitch from "./LanguageSwitch";
import Logo from "../logo/logo";
import { useTypedSelector } from "@/app/hook";
import { useDispatch } from "react-redux";
import { logout } from "@/features/auth/authSlice";

interface TopBarProps {
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useTypedSelector((state) => state.auth);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setShowUserDropdown(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 w-full bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 transition-colors">
        <div className="h-full flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Left section: Hamburger button (mobile) + Global Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Logo */}
            <div className="lg:hidden shrink-0">
              <Logo url="/" size="sm" theme="auto" />
            </div>

            {/* Search Box */}
            <div className="relative w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t("common.searchPlaceholder")}
                className="w-full h-9.5 pl-9 pr-9 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 rounded border border-slate-300/60 dark:border-slate-600">
                /
              </kbd>
            </div>
          </div>

          {/* Right section: Notifications, Help, Theme, Language, User profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Notification Bell with red indicator */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowHelpModal(false);
                  setShowUserDropdown(false);
                }}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Notifications"
                title="Upcoming tax deadlines"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0F172A]" />
              </button>

              {/* Deadlines Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      {t("deadlines.title")}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full">
                      {t("deadlines.badge")}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {t("deadlines.itrSalaried")}
                      </p>
                      <p className="text-[11px] text-slate-500">File Form 16 / ITR-1 without penalty.</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {t("deadlines.gstr3b")}
                      </p>
                      <p className="text-[11px] text-slate-500">Monthly summary return with tax payment.</p>
                    </div>
                  </div>
                  <Link
                    to="/deadlines"
                    onClick={() => setShowNotifications(false)}
                    className="block text-center mt-2.5 pt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline border-t border-slate-100 dark:border-slate-800"
                  >
                    View Complete Tax Calendar →
                  </Link>
                </div>
              )}
            </div>

            {/* Help / Guide Icon */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowHelpModal(!showHelpModal);
                  setShowNotifications(false);
                  setShowUserDropdown(false);
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Help & Guidance"
                title="Beginner Guide"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Help popover */}
              {showHelpModal && (
                <div className="absolute right-0 mt-2 w-72 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                    How TaxGenie Helps You
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed mb-2">
                    TaxGenie answers how much income tax or GST you owe under FY 2026-27 rules, completely in plain Hindi and English without CA jargon.
                  </p>
                  <ul className="space-y-1 text-[11px] text-slate-500 list-disc pl-4 mb-2">
                    <li>Calculators are free and work without login.</li>
                    <li>Login to save calculations or issue GST invoices.</li>
                  </ul>
                  <Link
                    to="/learn"
                    onClick={() => setShowHelpModal(false)}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    Tax Terms Glossary <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Theme Toggle (Sun/Moon) */}
            <ThemeToggle />

            {/* Language Switch (EN / HI) */}
            <LanguageSwitch />

            {/* User Avatar & Dropdown OR Guest Login Button */}
            {user ? (
              <div className="relative ml-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown);
                    setShowNotifications(false);
                    setShowHelpModal(false);
                  }}
                  className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-400 text-white font-bold text-xs flex items-center justify-center ring-2 ring-indigo-500/20">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="hidden md:inline text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {user.name?.split(" ")[0] || "Account"}
                  </span>
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 p-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t("common.profile")}</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t("common.settings")}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t("common.logout")}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link
                  to="/sign-in"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 transition-all hover:shadow-md cursor-pointer"
                >
                  {t("common.login")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default TopBar;
