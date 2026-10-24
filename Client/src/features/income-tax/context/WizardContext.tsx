import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AgeGroup,
  ComparisonResult,
  IncomeTaxFormData,
  TaxInput,
  TaxYearRules,
} from "../types";
import { fetchRulesDirect, calculateTaxDirect } from "../api";

const STORAGE_KEY = "taxgenie_income_tax_wizard";
const RESULT_STORAGE_KEY = "taxgenie_income_tax_result";

const DEFAULT_FORM_DATA: IncomeTaxFormData = {
  ageGroup: "below60",
  taxYear: "2026-27",
  salaryPeriod: "yearly",
  salaryAmount: 0,
  otherIncome: 0,
  sec80C: 0,
  sec80CCD1B: 0,
  sec80D_selfFamily: 0,
  sec80D_parents: 0,
  parentsAreSenior: false,
  homeLoanInterest: 0,
  hasHra: false,
  hraBasicSalary: 0,
  hraReceived: 0,
  hraRentPaid: 0,
  hraIsMetro: false,
};

interface WizardContextType {
  currentStep: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  formData: IncomeTaxFormData;
  updateFormData: (updates: Partial<IncomeTaxFormData>) => void;
  resetWizard: () => void;
  activeRules: TaxYearRules | null;
  isLoadingRules: boolean;
  rulesError: string | null;
  retryFetchRules: () => Promise<void>;
  result: ComparisonResult | null;
  isCalculating: boolean;
  calcError: string | null;
  calcErrorDetails: Record<string, string[] | string> | null;
  calculate: (overrideData?: Partial<IncomeTaxFormData>) => Promise<void>;
  skipDeductionsAndCalculate: () => Promise<void>;
  effectiveAnnualSalary: number;
}

export const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const WizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Current Step (1, 2, 3)
  const initialStep = Math.max(1, Math.min(3, parseInt(searchParams.get("step") || "1", 10)));
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  useEffect(() => {
    const param = searchParams.get("step");
    if (param) {
      const parsed = parseInt(param, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 3) {
        setCurrentStep(parsed);
      }
    }
  }, [searchParams]);

  // Form Data state restored from sessionStorage if present
  const [formData, setFormData] = useState<IncomeTaxFormData>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_FORM_DATA, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_FORM_DATA;
  });

  // Result state restored from sessionStorage if present
  const [result, setResult] = useState<ComparisonResult | null>(() => {
    try {
      const storedResult = sessionStorage.getItem(RESULT_STORAGE_KEY);
      if (storedResult) {
        return JSON.parse(storedResult);
      }
    } catch {
      // Fallback
    }
    return null;
  });

  const [activeRules, setActiveRules] = useState<TaxYearRules | null>(null);
  const [isLoadingRules, setIsLoadingRules] = useState<boolean>(true);
  const [rulesError, setRulesError] = useState<string | null>(null);

  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [calcErrorDetails, setCalcErrorDetails] = useState<Record<string, string[] | string> | null>(null);

  // Sync formData to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // Ignore quota errors
    }
  }, [formData]);

  // Sync result to sessionStorage
  useEffect(() => {
    try {
      if (result) {
        sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
      } else {
        sessionStorage.removeItem(RESULT_STORAGE_KEY);
      }
    } catch {
      // Ignore quota errors
    }
  }, [result]);

  // Load statutory tax rules whenever taxYear changes
  const loadRules = useCallback(async (year: string) => {
    setIsLoadingRules(true);
    setRulesError(null);
    try {
      const rules = await fetchRulesDirect(year);
      setActiveRules(rules);
    } catch (err: any) {
      setRulesError(err.message || "Failed to load tax rules");
    } finally {
      setIsLoadingRules(false);
    }
  }, []);

  useEffect(() => {
    loadRules(formData.taxYear);
  }, [formData.taxYear, loadRules]);

  const retryFetchRules = async () => {
    await loadRules(formData.taxYear);
  };

  const updateFormData = useCallback((updates: Partial<IncomeTaxFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      const targetStep = Math.max(1, Math.min(3, step));
      setCurrentStep(targetStep);
      setSearchParams({ step: targetStep.toString() }, { replace: true });
    },
    [setSearchParams]
  );

  const nextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const resetWizard = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setResult(null);
    setCurrentStep(1);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(RESULT_STORAGE_KEY);
    } catch {
      // Ignore
    }
    navigate("/income-tax?step=1", { replace: true });
  }, [navigate]);

  // Compute effective annual salary
  const effectiveAnnualSalary =
    formData.salaryPeriod === "monthly"
      ? (formData.salaryAmount || 0) * 12
      : formData.salaryAmount || 0;

  // Prepare TaxInput payload for engine
  const buildPayload = useCallback(
    (dataToUse: IncomeTaxFormData): TaxInput => {
      const annualSalary =
        dataToUse.salaryPeriod === "monthly"
          ? (dataToUse.salaryAmount || 0) * 12
          : dataToUse.salaryAmount || 0;

      const payload: TaxInput = {
        ageGroup: dataToUse.ageGroup,
        salaryIncome: Math.round(annualSalary),
        otherIncome: Math.round(dataToUse.otherIncome || 0),
        taxYear: dataToUse.taxYear,
        deductions: {
          sec80C: Math.round(dataToUse.sec80C || 0),
          sec80CCD1B: Math.round(dataToUse.sec80CCD1B || 0),
          sec80D_selfFamily: Math.round(dataToUse.sec80D_selfFamily || 0),
          sec80D_parents: Math.round(dataToUse.sec80D_parents || 0),
          parentsAreSenior: Boolean(dataToUse.parentsAreSenior),
          homeLoanInterest: Math.round(dataToUse.homeLoanInterest || 0),
        },
      };

      if (dataToUse.hasHra) {
        payload.deductions!.hra = {
          basicSalary: Math.round(dataToUse.hraBasicSalary || 0),
          hraReceived: Math.round(dataToUse.hraReceived || 0),
          rentPaid: Math.round(dataToUse.hraRentPaid || 0),
          isMetro: Boolean(dataToUse.hraIsMetro),
        };
      }

      return payload;
    },
    []
  );

  const calculate = useCallback(
    async (overrideData?: Partial<IncomeTaxFormData>) => {
      const targetData = { ...formData, ...overrideData };
      setIsCalculating(true);
      setCalcError(null);
      setCalcErrorDetails(null);

      try {
        const payload = buildPayload(targetData);
        const comp = await calculateTaxDirect(payload);
        setResult(comp);
        navigate("/income-tax/result");
      } catch (err: any) {
        setCalcError(err.message || "Failed to calculate tax comparison");
        setCalcErrorDetails(err.details || null);
      } finally {
        setIsCalculating(false);
      }
    },
    [formData, buildPayload, navigate]
  );

  const skipDeductionsAndCalculate = useCallback(async () => {
    const zeroDeductionsData: IncomeTaxFormData = {
      ...formData,
      sec80C: 0,
      sec80CCD1B: 0,
      sec80D_selfFamily: 0,
      sec80D_parents: 0,
      parentsAreSenior: false,
      homeLoanInterest: 0,
      hasHra: false,
      hraBasicSalary: 0,
      hraReceived: 0,
      hraRentPaid: 0,
      hraIsMetro: false,
    };
    updateFormData(zeroDeductionsData);
    await calculate(zeroDeductionsData);
  }, [formData, updateFormData, calculate]);

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        goToStep,
        nextStep,
        prevStep,
        formData,
        updateFormData,
        resetWizard,
        activeRules,
        isLoadingRules,
        rulesError,
        retryFetchRules,
        result,
        isCalculating,
        calcError,
        calcErrorDetails,
        calculate,
        skipDeductionsAndCalculate,
        effectiveAnnualSalary,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
};
