import { describe, it, expect } from "vitest";
import { roundHalfUp, roundToNearestTen } from "../shared/rounding";
import { formatINR } from "../shared/formatINR";
import { EngineValidationError } from "../shared/errors";

describe("Shared Utilities - Rounding and Formatting", () => {
  describe("roundHalfUp", () => {
    it("correctly rounds half up for positive numbers", () => {
      expect(roundHalfUp(2.5)).toBe(3);
      expect(roundHalfUp(2.49)).toBe(2);
      expect(roundHalfUp(2.51)).toBe(3);
      expect(roundHalfUp(0.5)).toBe(1);
      expect(roundHalfUp(0.49)).toBe(0);
      expect(roundHalfUp(17999.82)).toBe(18000);
      expect(roundHalfUp(18000.32)).toBe(18000);
    });

    it("throws error on NaN or non-finite values", () => {
      expect(() => roundHalfUp(NaN)).toThrow(EngineValidationError);
      expect(() => roundHalfUp(Infinity)).toThrow(EngineValidationError);
    });
  });

  describe("roundToNearestTen", () => {
    it("rounds to nearest multiple of 10", () => {
      expect(roundToNearestTen(5104)).toBe(5100);
      expect(roundToNearestTen(5105)).toBe(5110);
      expect(roundToNearestTen(5109)).toBe(5110);
      expect(roundToNearestTen(5110)).toBe(5110);
      expect(roundToNearestTen(0)).toBe(0);
      expect(roundToNearestTen(1225004)).toBe(1225000);
      expect(roundToNearestTen(1225005)).toBe(1225010);
    });

    it("throws on invalid input", () => {
      expect(() => roundToNearestTen(NaN)).toThrow(EngineValidationError);
    });
  });

  describe("formatINR", () => {
    it("formats Indian numbers with standard digit grouping (3 digits then 2 digits)", () => {
      expect(formatINR(0)).toBe("0");
      expect(formatINR(500)).toBe("500");
      expect(formatINR(1000)).toBe("1,000");
      expect(formatINR(100000)).toBe("1,00,000");
      expect(formatINR(1234567)).toBe("12,34,567");
      expect(formatINR(10000000)).toBe("1,00,00,000");
      expect(formatINR(-1234567)).toBe("-12,34,567");
    });

    it("supports optional paise formatting", () => {
      expect(formatINR(1234567.89, { includePaise: true })).toBe("12,34,567.89");
      expect(formatINR(500, { includePaise: true })).toBe("500.00");
      expect(formatINR(1234567.5, { includePaise: true })).toBe("12,34,567.50");
    });
  });
});
