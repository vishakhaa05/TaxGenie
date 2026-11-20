import { describe, it, expect } from "vitest";
import {
  rupeesToPaise,
  paiseToRupees,
  formatRupeesINR,
  amountInWords,
  calculateLocalGst,
} from "../utils/money";

describe("GST Money & Calculation Utilities", () => {
  describe("rupeesToPaise & paiseToRupees", () => {
    it("converts whole rupees into integer paise", () => {
      expect(rupeesToPaise(50000)).toBe(5000000);
      expect(rupeesToPaise(0)).toBe(0);
      expect(rupeesToPaise(1)).toBe(100);
    });

    it("converts fractional rupees with 2 decimals safely without float drift", () => {
      expect(rupeesToPaise(999.99)).toBe(99999);
      expect(rupeesToPaise(0.5)).toBe(50);
      expect(rupeesToPaise(0.01)).toBe(1);
    });

    it("converts integer paise back to rupees", () => {
      expect(paiseToRupees(5000000)).toBe(50000);
      expect(paiseToRupees(99999)).toBe(999.99);
      expect(paiseToRupees(50)).toBe(0.5);
    });
  });

  describe("formatRupeesINR", () => {
    it("formats Indian currency digit grouping with paise", () => {
      expect(formatRupeesINR(50000)).toBe("₹50,000.00");
      expect(formatRupeesINR(999.99)).toBe("₹999.99");
      expect(formatRupeesINR(1234567.89)).toBe("₹12,34,567.89");
      expect(formatRupeesINR(10000000)).toBe("₹1,00,00,000.00");
    });

    it("handles zero and negative amounts", () => {
      expect(formatRupeesINR(0)).toBe("₹0.00");
      expect(formatRupeesINR(null)).toBe("₹0.00");
    });

    it("supports suppressing the rupee prefix symbol", () => {
      expect(formatRupeesINR(50000, { prefixSymbol: false })).toBe("50,000.00");
    });
  });

  describe("amountInWords", () => {
    it("converts standard amounts into Indian words", () => {
      expect(amountInWords(50000)).toBe("Fifty Thousand Rupees Only");
      expect(amountInWords(59000)).toBe("Fifty-Nine Thousand Rupees Only");
      expect(amountInWords(100000)).toBe("One Lakh Rupees Only");
      expect(amountInWords(10000000)).toBe("One Crore Rupees Only");
    });

    it("converts fractional amounts with paise", () => {
      expect(amountInWords(999.99)).toBe(
        "Nine Hundred Ninety-Nine Rupees and Ninety-Nine Paise Only"
      );
      expect(amountInWords(1179.99)).toBe(
        "One Thousand One Hundred Seventy-Nine Rupees and Ninety-Nine Paise Only"
      );
      expect(amountInWords(0.5)).toBe("Fifty Paise Only");
    });

    it("converts 0", () => {
      expect(amountInWords(0)).toBe("Zero Rupees Only");
    });
  });

  describe("calculateLocalGst", () => {
    it("Rs 50,000 at 18%, Add GST, same state -> base 50,000, CGST 4,500, SGST 4,500, GST 9,000, total 59,000", () => {
      const res = calculateLocalGst({
        amount: 50000,
        rate: 18,
        mode: "add",
        sellerState: "27",
        buyerState: "27",
      });
      expect(res.base).toBe(50000);
      expect(res.cgst).toBe(4500);
      expect(res.sgst).toBe(4500);
      expect(res.igst).toBe(0);
      expect(res.gstAmount).toBe(9000);
      expect(res.total).toBe(59000);
      expect(res.supplyType).toBe("intra");
    });

    it("Rs 59,000 at 18%, Remove GST -> base 50,000, GST 9,000", () => {
      const res = calculateLocalGst({
        amount: 59000,
        rate: 18,
        mode: "remove",
        sellerState: "27",
        buyerState: "27",
      });
      expect(res.base).toBe(50000);
      expect(res.gstAmount).toBe(9000);
      expect(res.total).toBe(59000);
      expect(res.cgst).toBe(4500);
      expect(res.sgst).toBe(4500);
    });

    it("Different state -> IGST 9,000 and no CGST/SGST", () => {
      const res = calculateLocalGst({
        amount: 50000,
        rate: 18,
        mode: "add",
        sellerState: "27",
        buyerState: "07",
      });
      expect(res.supplyType).toBe("inter");
      expect(res.cgst).toBe(0);
      expect(res.sgst).toBe(0);
      expect(res.igst).toBe(9000);
      expect(res.gstAmount).toBe(9000);
    });

    it("Rs 999.99 at 18%, Add GST -> GST 180.00, total 1,179.99; Remove GST from 1,179.99 -> base 999.99, GST 180.00", () => {
      const addRes = calculateLocalGst({
        amount: 999.99,
        rate: 18,
        mode: "add",
        sellerState: "27",
        buyerState: "27",
      });
      expect(addRes.base).toBe(999.99);
      expect(addRes.gstAmount).toBe(180);
      expect(addRes.total).toBe(1179.99);

      const remRes = calculateLocalGst({
        amount: 1179.99,
        rate: 18,
        mode: "remove",
        sellerState: "27",
        buyerState: "27",
      });
      expect(remRes.base).toBe(999.99);
      expect(remRes.gstAmount).toBe(180);
      expect(remRes.total).toBe(1179.99);
    });

    it("Rates 0%, 5%, 40% work", () => {
      const res0 = calculateLocalGst({
        amount: 10000,
        rate: 0,
        mode: "add",
        sellerState: "27",
        buyerState: "27",
      });
      expect(res0.gstAmount).toBe(0);
      expect(res0.total).toBe(10000);

      const res5 = calculateLocalGst({
        amount: 10000,
        rate: 5,
        mode: "add",
        sellerState: "27",
        buyerState: "27",
      });
      expect(res5.gstAmount).toBe(500);
      expect(res5.total).toBe(10500);

      const res40 = calculateLocalGst({
        amount: 10000,
        rate: 40,
        mode: "add",
        sellerState: "27",
        buyerState: "27",
      });
      expect(res40.gstAmount).toBe(4000);
      expect(res40.total).toBe(14000);
    });
  });
});
