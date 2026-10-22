import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import FooterStrip from "./FooterStrip";

interface AppShellProps {
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex relative overflow-x-hidden">
      {/* Subtle modern ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute -top-40 -right-40 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/10 blur-3xl animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute top-1/3 -left-32 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-sky-400/20 to-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-[30rem] h-[30rem] rounded-full bg-gradient-to-tl from-indigo-600/20 to-teal-400/10 blur-3xl" />
      </div>

      {/* Left Sidebar - Navy in both modes */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all relative z-10">
        {/* Sticky TopBar */}
        <TopBar onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Dynamic page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-200">
          {children || <Outlet />}
        </main>

        {/* Global Footer Disclaimer */}
        <FooterStrip />
      </div>
    </div>
  );
};

export default AppShell;
