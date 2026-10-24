export interface HraCalcInput {
  basicSalary: number;
  hraReceived: number;
  rentPaid: number;
  isMetro: boolean;
}

export interface HraRulesConfig {
  metroPercent: number;
  nonMetroPercent: number;
  rentMinusBasicPercent: number;
}

const DEFAULT_HRA_RULES: HraRulesConfig = {
  metroPercent: 50,
  nonMetroPercent: 40,
  rentMinusBasicPercent: 10,
};

/**
 * Pure statutory HRA (House Rent Allowance) exemption calculator under Section 10(13A).
 * All inputs and outputs are in whole rupees.
 */
export function calculateHraExemption(
  input: HraCalcInput,
  rules: HraRulesConfig = DEFAULT_HRA_RULES
): number {
  const { basicSalary, hraReceived, rentPaid, isMetro } = input;

  if (
    !basicSalary ||
    !hraReceived ||
    !rentPaid ||
    basicSalary <= 0 ||
    hraReceived <= 0 ||
    rentPaid <= 0
  ) {
    return 0;
  }

  const basicThreshold = Math.round(
    (basicSalary * (rules.rentMinusBasicPercent || 10)) / 100
  );
  const excessRent = Math.max(0, rentPaid - basicThreshold);

  const salaryPercentage = isMetro
    ? rules.metroPercent || 50
    : rules.nonMetroPercent || 40;
  const salaryCap = Math.round((basicSalary * salaryPercentage) / 100);

  const exemption = Math.min(hraReceived, excessRent, salaryCap);
  return Math.max(0, exemption);
}
