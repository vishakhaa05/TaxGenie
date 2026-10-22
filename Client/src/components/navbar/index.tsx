import { useState } from "react";
import { Menu, ChevronDown, Sparkles, FileText, Shield, TrendingUp, FolderArchive, BarChart3, Settings as SettingsIcon } from "lucide-react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { PROTECTED_ROUTES } from "@/routes/common/routePath";
import { cn } from "@/lib/utils";
import Logo from "../logo/logo";
import { Button } from "../ui/button";
import { Sheet, SheetContent } from "../ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { UserNav } from "./user-nav";
import LogoutDialog from "./logout-dialog";
import { useTypedSelector } from "@/app/hook";

const Navbar = () => {
  const { pathname } = useLocation();
  const { user } = useTypedSelector((state) => state.auth);

  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const primaryRoutes = [
    { href: PROTECTED_ROUTES.OVERVIEW, label: "Overview" },
    { href: PROTECTED_ROUTES.TRANSACTIONS, label: "Transactions" },
    { href: PROTECTED_ROUTES.TAX_OPTIMIZER, label: "Tax Optimizer" },
    { href: PROTECTED_ROUTES.AI_ADVISOR, label: "AI Advisor" },
    { href: PROTECTED_ROUTES.BUSINESS, label: "Business" },
  ];

  const secondaryRoutes = [
    { href: PROTECTED_ROUTES.INVOICES, label: "Invoices", icon: FileText },
    { href: PROTECTED_ROUTES.ADMIN, label: "Admin Panel", icon: Shield },
    { href: PROTECTED_ROUTES.FORECASTING, label: "Health & Forecast", icon: TrendingUp },
    { href: PROTECTED_ROUTES.TAX_DOCUMENTS, label: "Tax Vault", icon: FolderArchive },
    { href: PROTECTED_ROUTES.REPORTS, label: "Reports", icon: BarChart3 },
    { href: PROTECTED_ROUTES.SETTINGS, label: "Settings", icon: SettingsIcon },
  ];

  const allRoutes = [...primaryRoutes, ...secondaryRoutes];

  const isMoreActive = secondaryRoutes.some((r) => pathname === r.href);

  return (
    <>
      <header className="w-full px-4 py-2 bg-[var(--secondary-dark-color)] text-white shadow-sm border-b border-white/10 sticky top-0 z-40">
        <div className="w-full flex h-12 max-w-[var(--max-width)] items-center justify-between mx-auto">
          {/* Left side - Logo & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="inline-flex md:hidden !cursor-pointer !bg-white/10 !text-white hover:bg-white/20 h-8 w-8"
              onClick={() => setIsOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Logo />
          </div>

          {/* Desktop Navigation - Compact & Centered */}
          <nav className="hidden md:flex items-center gap-x-1">
            {primaryRoutes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <Button
                  key={route.href}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "font-medium h-9 px-3 text-sm transition-all rounded-lg border-none hover:bg-white/10 hover:text-white",
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30"
                      : "text-white/70"
                  )}
                  asChild
                >
                  <NavLink to={route.href}>{route.label}</NavLink>
                </Button>
              );
            })}

            {/* "More Tools" Compact Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "font-medium h-9 px-3 text-sm transition-all rounded-lg gap-1 border-none hover:bg-white/10 hover:text-white cursor-pointer",
                    isMoreActive
                      ? "bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30"
                      : "text-white/70"
                  )}
                >
                  More <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-100 p-1 shadow-xl">
                {secondaryRoutes.map((route) => {
                  const Icon = route.icon;
                  const isActive = pathname === route.href;
                  return (
                    <DropdownMenuItem key={route.href} asChild className="focus:bg-slate-800 cursor-pointer rounded-md my-0.5">
                      <Link
                        to={route.href}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-2 text-xs font-medium w-full",
                          isActive ? "text-amber-400 font-bold" : "text-slate-200"
                        )}
                      >
                        <Icon className="w-4 h-4 text-emerald-400" />
                        {route.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Mobile Navigation Drawer */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent side="left" className="bg-slate-900 text-white border-slate-800 w-72 p-4">
              <div className="mb-6 pt-2">
                <Logo />
              </div>
              <nav className="flex flex-col gap-y-1">
                {allRoutes.map((route) => {
                  const isActive = pathname === route.href;
                  return (
                    <Button
                      key={route.href}
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "w-full justify-start font-medium text-sm h-10 px-3 transition-colors rounded-lg",
                        isActive
                          ? "bg-emerald-500/20 text-emerald-300 font-bold"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <NavLink to={route.href}>{route.label}</NavLink>
                    </Button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Right side - User actions */}
          <div className="flex items-center space-x-3">
            <UserNav
              userName={user?.name || ""}
              profilePicture={user?.profilePicture || ""}
              onLogout={() => setIsLogoutDialogOpen(true)}
            />
          </div>
        </div>
      </header>

      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        setIsOpen={setIsLogoutDialogOpen}
      />
    </>
  );
};

export default Navbar;
