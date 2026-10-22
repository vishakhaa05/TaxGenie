import { useState } from "react";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  className?: string;
  size?: number;
}

export const InfoTooltip = ({ content, className = "", size = 14 }: InfoTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        className={`text-slate-400 hover:text-indigo-500 transition-colors focus:outline-none cursor-pointer p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More information"
      >
        <Info size={size} />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 text-xs font-normal text-white bg-slate-900 dark:bg-slate-800 rounded-lg shadow-xl border border-slate-700/60 leading-relaxed pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
