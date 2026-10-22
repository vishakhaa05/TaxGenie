export interface AiChatMetrics {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  transactionCount: number;
}

export interface AiChatResponse {
  success: boolean;
  answer: string;
  metrics: AiChatMetrics;
}

export interface SavingsAdviceInput {
  monthlyIncome: number;
  fixedExpenses: number;
  existingSavings: number;
  riskAppetite?: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
  goal?: string;
}

export interface SavingsAdviceResult {
  monthlyIncome: number;
  fixedExpenses: number;
  disposableIncome: number;
  recommendedMonthlySavings: number;
  emergencyFund: {
    target6Months: number;
    currentSavings: number;
    deficit: number;
    monthsCovered: string;
  };
  suggestedAssetAllocation: {
    riskProfile: string;
    breakdownPercent: {
      emergencyOrFd: number;
      debtOrGovt: number;
      equity: number;
      goldOrLiquid: number;
    };
    monthlyAllocationAmount: {
      emergencyOrFd: number;
      debtOrGovt: number;
      equity: number;
      goldOrLiquid: number;
    };
  };
  disclaimer: string;
}

export interface SpendingAnomaly {
  title: string;
  category: string;
  amount: number;
  reason: string;
}

export interface SpendingAnomaliesResult {
  success: boolean;
  anomalyCount: number;
  anomalies: SpendingAnomaly[];
}
