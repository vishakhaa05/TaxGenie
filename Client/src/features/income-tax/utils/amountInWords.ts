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
  return o ? `${tenWord} ${oneWord}` : tenWord;
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
 * Pure converter from numeric Rupees to words in the Indian numbering system
 * (Crore, Lakh, Thousand, Hundred) ending with "Rupees Only".
 */
export function amountInWords(amount: number): string {
  if (
    typeof amount !== "number" ||
    Number.isNaN(amount) ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return "Zero Rupees Only";
  }

  const rupees = Math.round(amount);
  if (rupees === 0) {
    return "Zero Rupees Only";
  }

  let rem = rupees;
  const parts: string[] = [];

  // Crore (1,00,00,000)
  const crore = Math.floor(rem / 10000000);
  rem = rem % 10000000;
  if (crore > 0) {
    const croreStr =
      crore >= 100 ? convertThreeDigits(crore) : convertTwoDigits(crore);
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

  // Hundreds and remaining tens/ones
  if (rem > 0) {
    parts.push(convertThreeDigits(rem));
  }

  return `${parts.join(" ")} Rupees Only`;
}
