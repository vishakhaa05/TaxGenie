import { describe, it, expect } from "vitest";
import { formatINR } from "../utils/formatINR";
import { amountInWords } from "../utils/amountInWords";
import { calculateHraExemption } from "../utils/calculateHraExemption";

describe("Income Tax Utility Functions", () => {
  describe("formatINR", () => {
    it("formats 1234567 as 12,34,567", () => {
      expect(formatINR(1234567)).toBe("12,34,567");
    });

    it("formats with prefixSymbol: ₹15,00,000", () => {
      expect(formatINR(1500000, { prefixSymbol: true })).toBe("₹15,00,000");
    });

    it("handles 0, null, and undefined safely", () => {
      expect(formatINR(0)).toBe("0");
      expect(formatINR(null)).toBe("0");
      expect(formatINR(undefined, { prefixSymbol: true })).toBe("₹0");
    });
  });

  describe("amountInWords", () => {
    it("converts 1200000 to Twelve Lakh Rupees Only", () => {
      expect(amountInWords(1200000)).toBe("Twelve Lakh Rupees Only");
    });

    it("converts 1500000 to Fifteen Lakh Rupees Only", () => {
      expect(amountInWords(1500000)).toBe("Fifteen Lakh Rupees Only");
    });

    it("converts 0 to Zero Rupees Only", () => {
      expect(amountInWords(0)).toBe("Zero Rupees Only");
    });
  });

  describe("calculateHraExemption", () => {
    const rules = {
      metroPercent: 50,
      nonMetroPercent: 40,
      rentMinusBasicPercent: 10,
    };

    it("metro: Basic 6,00,000, HRA 2,40,000, rent 2,16,000 -> 1,56,000", () => {
      const res = calculateHraExemption(
        {
          basicSalary: 600000,
          hraReceived: 240000,
          rentPaid: 216000,
          isMetro: true,
        },
        rules
      );
      expect(res).toBe(156000);
    });

    it("non-metro: Basic 6,00,000, HRA 2,40,000, rent 1,20,000 -> 60,000", () => {
      const res = calculateHraExemption(
        {
          basicSalary: 600000,
          hraReceived: 240000,
          rentPaid: 120000,
          isMetro: false,
        },
        rules
      );
      expect(res).toBe(60000);
    });

    it("rent < 10% basic -> 0 exemption", () => {
      const res = calculateHraExemption(
        {
          basicSalary: 600000,
          hraReceived: 240000,
          rentPaid: 40000,
          isMetro: true,
        },
        rules
      );
      expect(res).toBe(0);
    });
  });
});
