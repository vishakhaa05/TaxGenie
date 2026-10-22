import { describe, it, expect } from "vitest";
import { calculateGst } from "../gst/calculate";
import { calculateInvoice } from "../gst/invoice";
import { amountInWords } from "../gst/amountInWords";
import {
  validateGstin,
  generateTestGstin,
  calculateGstinChecksum,
} from "../gst/gstin";
import { GstRulesConfig } from "../gst/types";
import { GstCalculationError } from "../shared/errors";

const testGstRules: GstRulesConfig = {
  supportedRates: [0, 5, 18, 40],
  defaultRate: 18,
};

describe("GST Engine - Statutory Specifications", () => {
  describe("calculateGst", () => {
    it("50,000 at 18%, add -> GST 9,000, total 59,000", () => {
      const res = calculateGst(
        {
          amount: 50000,
          rate: 18,
          mode: "add",
          sellerState: "27", // Maharashtra
          buyerState: "27", // Maharashtra
        },
        testGstRules
      );

      expect(res.base).toBe(50000);
      expect(res.gstAmount).toBe(9000);
      expect(res.total).toBe(59000);
      expect(res.supplyType).toBe("intra");
      expect(res.cgst).toBe(4500);
      expect(res.sgst).toBe(4500);
      expect(res.igst).toBe(0);
    });

    it("59,000 inclusive at 18%, remove -> base 50,000, GST 9,000", () => {
      const res = calculateGst(
        {
          amount: 59000,
          rate: 18,
          mode: "remove",
          sellerState: "Delhi",
          buyerState: "Delhi",
        },
        testGstRules
      );

      expect(res.base).toBe(50000);
      expect(res.gstAmount).toBe(9000);
      expect(res.total).toBe(59000);
      expect(res.cgst).toBe(4500);
      expect(res.sgst).toBe(4500);
    });

    it("Different state -> IGST 9,000", () => {
      const res = calculateGst(
        {
          amount: 50000,
          rate: 18,
          mode: "add",
          sellerState: "27", // Maharashtra
          buyerState: "07", // Delhi
        },
        testGstRules
      );

      expect(res.supplyType).toBe("inter");
      expect(res.cgst).toBe(0);
      expect(res.sgst).toBe(0);
      expect(res.igst).toBe(9000);
    });

    it("Rates 0, 5, 40 work; rate 12 or 28 is rejected", () => {
      expect(() =>
        calculateGst(
          { amount: 1000, rate: 0, mode: "add", sellerState: "27", buyerState: "27" },
          testGstRules
        )
      ).not.toThrow();

      expect(() =>
        calculateGst(
          { amount: 1000, rate: 5, mode: "add", sellerState: "27", buyerState: "27" },
          testGstRules
        )
      ).not.toThrow();

      expect(() =>
        calculateGst(
          { amount: 1000, rate: 40, mode: "add", sellerState: "27", buyerState: "27" },
          testGstRules
        )
      ).not.toThrow();

      expect(() =>
        calculateGst(
          { amount: 1000, rate: 12, mode: "add", sellerState: "27", buyerState: "27" },
          testGstRules
        )
      ).toThrow(GstCalculationError);

      expect(() =>
        calculateGst(
          { amount: 1000, rate: 28, mode: "add", sellerState: "27", buyerState: "27" },
          testGstRules
        )
      ).toThrow(GstCalculationError);
    });

    it("999.99 at 18%, add -> GST 180.00, total 1,179.99; removing GST from 1,179.99 gives back base 999.99 and GST 180.00 (round trip)", () => {
      const addRes = calculateGst(
        {
          amount: 999.99,
          rate: 18,
          mode: "add",
          sellerState: "27",
          buyerState: "27",
        },
        testGstRules
      );

      expect(addRes.base).toBe(999.99);
      expect(addRes.gstAmount).toBe(180.0);
      expect(addRes.total).toBe(1179.99);

      const removeRes = calculateGst(
        {
          amount: 1179.99,
          rate: 18,
          mode: "remove",
          sellerState: "27",
          buyerState: "27",
        },
        testGstRules
      );

      expect(removeRes.base).toBe(999.99);
      expect(removeRes.gstAmount).toBe(180.0);
      expect(removeRes.total).toBe(1179.99);
    });

    it("Odd paise split: CGST + SGST always equals total GST exactly", () => {
      // 84.75 at 18% -> GST is 15.255 => 15.26 rupees = 1526 paise (even)
      // Test an amount that produces odd paise: e.g. 50.05 @ 5% => 2.5025 => 250 paise
      // 15.25 GST paise = 1525 paise (odd)
      // Let's create an input that yields odd paise
      // 100.27 * 5 / 100 = 5.0135 => 501 paise (odd)
      const res = calculateGst(
        {
          amount: 100.27,
          rate: 5,
          mode: "add",
          sellerState: "27",
          buyerState: "27",
        },
        testGstRules
      );

      expect(res.gstPaise % 2).toBe(1); // odd paise
      expect(res.cgstPaise + res.sgstPaise).toBe(res.gstPaise);
      expect(res.cgst + res.sgst).toBe(res.gstAmount);
    });
  });

  describe("calculateInvoice", () => {
    it("2 x Rs 1,000 at 18% plus 1 x Rs 500 at 5%, same state -> base 2,500, GST 385 (CGST 192.50 + SGST 192.50), total 2,885, round-off 0", () => {
      const invoice = calculateInvoice(
        {
          items: [
            {
              name: "Product A",
              quantity: 2,
              unitPrice: 1000,
              rate: 18,
            },
            {
              name: "Product B",
              quantity: 1,
              unitPrice: 500,
              rate: 5,
            },
          ],
          sellerState: "Maharashtra",
          buyerState: "Maharashtra",
          priceIncludesGst: false,
        },
        testGstRules
      );

      expect(invoice.subtotal).toBe(2500);
      expect(invoice.totalGst).toBe(385);
      expect(invoice.totalCgst).toBe(192.5);
      expect(invoice.totalSgst).toBe(192.5);
      expect(invoice.totalIgst).toBe(0);
      expect(invoice.roundOff).toBe(0);
      expect(invoice.grandTotal).toBe(2885);
      expect(invoice.amountInWords).toBe(
        "Two Thousand Eight Hundred Eighty Five Rupees Only"
      );
    });
  });

  describe("amountInWords", () => {
    it("amountInWords(2885) -> 'Two Thousand Eight Hundred Eighty Five Rupees Only'", () => {
      expect(amountInWords(2885)).toBe(
        "Two Thousand Eight Hundred Eighty Five Rupees Only"
      );
    });

    it("amountInWords(123456) -> 'One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees Only'", () => {
      expect(amountInWords(123456)).toBe(
        "One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees Only"
      );
    });

    it("handles zero and paise", () => {
      expect(amountInWords(0)).toBe("Zero Rupees Only");
      expect(amountInWords(50.25)).toBe(
        "Fifty Rupees and Twenty Five Paise Only"
      );
    });
  });

  describe("GSTIN Validation & Checksum", () => {
    it("generates and verifies valid GSTIN correctly", () => {
      const validGstin = generateTestGstin("27", "ABCDE1234F", "1");
      const validation = validateGstin(validGstin);

      expect(validation.valid).toBe(true);
      expect(validation.details?.stateCode).toBe("27");
      expect(validation.details?.pan).toBe("ABCDE1234F");
      expect(validation.details?.checksum).toBe(
        calculateGstinChecksum(validGstin.slice(0, 14))
      );
    });

    it("rejects wrong length with INVALID_LENGTH", () => {
      const res = validateGstin("27ABCDE1234F1Z");
      expect(res.valid).toBe(false);
      expect(res.reason).toBe("INVALID_LENGTH");
    });

    it("rejects bad pattern with INVALID_FORMAT", () => {
      const res = validateGstin("27123451234F1Z5");
      expect(res.valid).toBe(false);
      expect(res.reason).toBe("INVALID_FORMAT");
    });

    it("rejects invalid state code with INVALID_STATE_CODE", () => {
      // 99 is invalid, 00 is invalid
      const prefix = "00ABCDE1234F1Z";
      const chk = calculateGstinChecksum(prefix);
      const res = validateGstin(`${prefix}${chk}`);
      expect(res.valid).toBe(false);
      expect(res.reason).toBe("INVALID_STATE_CODE");
    });

    it("rejects bad checksum with INVALID_CHECKSUM", () => {
      const validGstin = generateTestGstin("27", "ABCDE1234F", "1");
      // Change the last check character to something different
      const badChar = validGstin[14] === "A" ? "B" : "A";
      const tamperedGstin = `${validGstin.slice(0, 14)}${badChar}`;

      const res = validateGstin(tamperedGstin);
      expect(res.valid).toBe(false);
      expect(res.reason).toBe("INVALID_CHECKSUM");
    });
  });
});
