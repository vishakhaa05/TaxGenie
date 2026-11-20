import { CalculateGstInput, GstResult, SupplyType } from "../types";

/**
 * Convert Rupees into integer Paise safely.
 * Operates on whole integer cents/paise to guarantee zero floating-point drift.
 */
export function rupeesToPaise(rupees: number): number {
  if (typeof rupees !== "number" || Number.isNaN(rupees) || !Number.isFinite(rupees)) {
    return 0;
  }
  return Math.round(rupees * 100);
}

/**
 * Convert integer Paise back into Rupees.
 */
export function paiseToRupees(paise: number): number {
  if (typeof paise !== "number" || Number.isNaN(paise) || !Number.isFinite(paise)) {
    return 0;
  }
  return Math.round(paise) / 100;
}

/**
 * Indian currency digit grouping formatter.
 * Groups last 3 digits, then pairs of 2 digits.
 * Always renders exact 2 decimal places when includePaise is true.
 */
export function formatRupeesINR(
  val: number | null | undefined,
  options?: { prefixSymbol?: boolean; includePaise?: boolean }
): string {
  const prefix = options?.prefixSymbol !== false ? "₹" : "";
  if (val === null || val === undefined || Number.isNaN(val)) {
    return `${prefix}0.00`;
  }

  const paise = rupeesToPaise(val);
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);

  const rupeesInt = Math.floor(absPaise / 100);
  const paiseRem = absPaise % 100;

  const intString = rupeesInt.toString();
  let formattedInt = intString;

  if (intString.length > 3) {
    const lastThree = intString.slice(-3);
    const otherDigits = intString.slice(0, -3);
    const formattedOthers = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    formattedInt = `${formattedOthers},${lastThree}`;
  }

  const sign = isNegative ? "-" : "";
  const includePaise = options?.includePaise !== false;

  if (includePaise) {
    const formattedPaise = paiseRem.toString().padStart(2, "0");
    return `${sign}${prefix}${formattedInt}.${formattedPaise}`;
  }

  return `${sign}${prefix}${formattedInt}`;
}

const ONES: readonly string[] = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS: readonly string[] = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertTwoDigits(num: number): string {
  if (num < 20) {
    return ONES[num] ?? "";
  }
  const t = Math.floor(num / 10);
  const o = num % 10;
  const tenWord = TENS[t] ?? "";
  const oneWord = ONES[o] ?? "";
  return o ? `${tenWord}-${oneWord}` : tenWord;
}

function convertThreeDigits(num: number): string {
  const h = Math.floor(num / 100);
  const rest = num % 100;
  let res = "";
  if (h > 0) {
    const hundredWord = ONES[h] ?? "";
    res += `${hundredWord} Hundred`;
  }
  if (rest > 0) {
    res += (res ? " " : "") + convertTwoDigits(rest);
  }
  return res;
}

/**
 * Pure converter from numeric Rupees (and paise) to standard Indian words.
 * Standard format: "Fifty Thousand Rupees Only" or
 * "Nine Hundred Ninety-Nine Rupees and Ninety-Nine Paise Only".
 */
export function amountInWords(amount: number): string {
  if (typeof amount !== "number" || Number.isNaN(amount) || !Number.isFinite(amount) || amount < 0) {
    return "";
  }

  const totalPaise = Math.round(amount * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;

  if (rupees === 0 && paise === 0) {
    return "Zero Rupees Only";
  }

  let words = "";

  if (rupees === 0) {
    words = "";
  } else {
    let rem = rupees;
    const parts: string[] = [];

    // Crore (1,00,00,000)
    const crore = Math.floor(rem / 10000000);
    rem = rem % 10000000;
    if (crore > 0) {
      const croreStr = crore >= 100 ? convertThreeDigits(crore) : convertTwoDigits(crore);
      parts.push(`${croreStr} Crore`);
    }

    // Lakh (1,00,000)
    const lakh = Math.floor(rem / 100000);
    rem = rem % 100000;
    if (lakh > 0) {
      parts.push(`${convertTwoDigits(lakh)} Lakh`);
    }

    // Thousand (1,000)
    const thousand = Math.floor(rem / 1000);
    rem = rem % 1000;
    if (thousand > 0) {
      parts.push(`${convertTwoDigits(thousand)} Thousand`);
    }

    // Hundreds and remaining
    if (rem > 0) {
      parts.push(convertThreeDigits(rem));
    }

    words = `${parts.join(" ")} Rupees`;
  }

  if (paise > 0) {
    const paiseWords = `${convertTwoDigits(paise)} Paise`;
    if (!words) {
      words = paiseWords;
    } else {
      words += ` and ${paiseWords}`;
    }
  }

  return `${words} Only`.trim();
}

/**
 * Pure, integer-paise based GST calculator matching the server engine calculation.
 */
export function calculateLocalGst(input: CalculateGstInput): GstResult {
  const { amount, rate, mode, sellerState, buyerState } = input;
  const amountPaise = rupeesToPaise(amount);

  let basePaise: number;
  let gstPaise: number;
  let totalPaise: number;

  if (mode === "add") {
    basePaise = amountPaise;
    gstPaise = Math.round((basePaise * rate) / 100);
    totalPaise = basePaise + gstPaise;
  } else {
    // mode === "remove"
    totalPaise = amountPaise;
    basePaise = Math.round((totalPaise * 100) / (100 + rate));
    gstPaise = totalPaise - basePaise;
  }

  const isIntra = sellerState.trim().toLowerCase() === buyerState.trim().toLowerCase();
  const supplyType: SupplyType = isIntra ? "intra" : "inter";

  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  if (isIntra) {
    cgstPaise = Math.floor(gstPaise / 2);
    sgstPaise = gstPaise - cgstPaise;
  } else {
    igstPaise = gstPaise;
  }

  const total = paiseToRupees(totalPaise);

  return {
    base: paiseToRupees(basePaise),
    gstAmount: paiseToRupees(gstPaise),
    cgst: paiseToRupees(cgstPaise),
    sgst: paiseToRupees(sgstPaise),
    igst: paiseToRupees(igstPaise),
    total,
    supplyType,
    rate,
    basePaise,
    gstPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalPaise,
    amountInWords: amountInWords(total),
  };
}
