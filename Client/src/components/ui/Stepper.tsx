import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: number;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className = "",
}) => {
  return (
    <nav aria-label="Calculator Progress" className={cn("w-full", className)}>
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isFuture = step.id > currentStep;
          const isClickable = Boolean(onStepClick && step.id <= currentStep);

          return (
            <li
              key={step.id}
              className={cn(
                "flex-1 flex items-center relative",
                idx !== steps.length - 1 && "after:content-[''] after:w-full after:h-0.5 after:mx-2 sm:after:mx-4 after:transition-all after:duration-300",
                idx !== steps.length - 1 &&
                  (isCompleted
                    ? "after:bg-indigo-600 dark:after:bg-indigo-500"
                    : "after:bg-slate-200 dark:after:bg-slate-800")
              )}
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.id)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 group transition-all shrink-0 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1",
                  !isClickable && "cursor-default"
                )}
              >
                {/* Circle badge */}
                <span
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                    isCompleted &&
                      "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20",
                    isCurrent &&
                      "bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-md shadow-indigo-500/30 scale-105",
                    isFuture &&
                      "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    step.id
                  )}
                </span>

                {/* Step text */}
                <div className="hidden sm:block">
                  <span
                    className={cn(
                      "block text-xs font-semibold tracking-wide transition-colors",
                      isCurrent && "text-indigo-600 dark:text-indigo-400 font-bold",
                      isCompleted && "text-slate-900 dark:text-slate-100",
                      isFuture && "text-slate-400 dark:text-slate-500"
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500">
                      {step.description}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;
