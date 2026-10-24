/**
 * Indian currency digit grouping formatter (e.g., 12,34,567).
 * Adheres strictly to the Indian numbering system:
 * Rightmost 3 digits grouped together, followed by pairs of 2 digits.
 */
export function formatINR(
  val: number | string | null | undefined,
  options?: { includePaise?: boolean; prefixSymbol?: boolean }
): string {
  if (val === null || val === undefined) return options?.prefixSymbol ? "₹0" : "0";
  const num = typeof val === "string" ? Number(val) : val;
  if (typeof num !== "number" || Number.isNaN(num) || !Number.isFinite(num)) {
    return options?.prefixSymbol ? "₹0" : "0";
  }

  const sign = num < 0 ? "-" : "";
  const absNum = Math.abs(num);

  const rawString = absNum.toString();
  const parts = rawString.split(".");
  let integerPart = parts[0] ?? "0";
  const decimalPart = parts[1];

  if (integerPart.length > 3) {
    const lastThree = integerPart.slice(-3);
    const otherDigits = integerPart.slice(0, -3);
    const formattedOthers = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    integerPart = `${formattedOthers},${lastThree}`;
  }

  let formatted = "";
  if (options?.includePaise) {
    const paise = decimalPart ? decimalPart.padEnd(2, "0").slice(0, 2) : "00";
    formatted = `${sign}${integerPart}.${paise}`;
  } else {
    formatted = `${sign}${integerPart}`;
  }

  return options?.prefixSymbol ? `₹${formatted}` : formatted;
}
