import React, { useId } from "react";
import { Link } from "react-router-dom";

export interface LogoProps {
  url?: string;
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  theme?: "dark" | "light" | "auto";
  asLink?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  url = "/",
  className = "",
  showText = true,
  size = "md",
  theme = "auto",
  asLink = true,
}) => {
  const uniqueId = useId().replace(/:/g, "");
  const orbGradientId = `orbGrad-${uniqueId}`;
  const orbGlowId = `orbGlow-${uniqueId}`;
  const bottomShadowId = `bottomShadow-${uniqueId}`;

  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const getTextColor = () => {
    if (theme === "dark") return "text-white";
    if (theme === "light") return "text-[#0B3B2C]";
    return "text-[#0B3B2C] dark:text-white";
  };

  const getSubtitleColor = () => {
    if (theme === "dark") return "text-slate-400";
    if (theme === "light") return "text-slate-500";
    return "text-slate-500 dark:text-slate-400";
  };

  const getBadgeStyle = () => {
    if (theme === "dark") {
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    }
    if (theme === "light") {
      return "bg-[#E6F5EE] text-[#064E3B] border-[#A7F3D0]";
    }
    return "bg-[#E6F5EE] dark:bg-emerald-500/20 text-[#064E3B] dark:text-emerald-300 border-[#A7F3D0] dark:border-emerald-500/30";
  };

  const content = (
    <>
      {/* 3D Luminous Sphere / Orb with Forest Green & Emerald Gradients matching Mockup */}
      <div
        className={`${iconSizes[size]} rounded-full relative p-0.5 shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-md shadow-emerald-500/20`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          <defs>
            {/* Outer Orb Gradient: Emerald to Forest Green */}
            <linearGradient id={orbGradientId} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="45%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#0B3B2C" />
            </linearGradient>

            {/* Inner Crescent Glow for 3D depth */}
            <radialGradient id={orbGlowId} cx="14" cy="14" r="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#A7F3D0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0B3B2C" stopOpacity="0" />
            </radialGradient>

            {/* Bottom shadow curve */}
            <linearGradient id={bottomShadowId} x1="20" y1="20" x2="20" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0B3B2C" stopOpacity="0" />
              <stop offset="100%" stopColor="#051E16" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Base Orb */}
          <circle cx="20" cy="20" r="18" fill={`url(#${orbGradientId})`} />

          {/* Bottom shadow overlay for sphere depth */}
          <circle cx="20" cy="20" r="18" fill={`url(#${bottomShadowId})`} />

          {/* Top-left specular crescent highlight */}
          <circle cx="16" cy="16" r="14" fill={`url(#${orbGlowId})`} opacity="0.65" />

          {/* Central Genie Sparkle / 4-point Star */}
          <path
            d="M20 10 C20 15 15 20 10 20 C15 20 20 25 20 30 C20 25 25 20 30 20 C25 20 20 15 20 10 Z"
            fill="#FFFFFF"
            opacity="0.95"
          />
          <circle cx="20" cy="20" r="2" fill="#10B981" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`${textSizes[size]} font-black tracking-tight ${getTextColor()}`}
            >
              TaxGenie
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border uppercase tracking-wide ${getBadgeStyle()}`}>
              IN
            </span>
          </div>
          <span className={`text-[10px] font-medium tracking-tight ${getSubtitleColor()}`}>
            FY 2026-27 Edition
          </span>
        </div>
      )}
    </>
  );

  const containerClasses = `flex items-center gap-2.5 group select-none ${className}`;

  if (asLink && url) {
    return (
      <Link to={url} className={containerClasses}>
        {content}
      </Link>
    );
  }

  return <div className={containerClasses}>{content}</div>;
};

export default Logo;
