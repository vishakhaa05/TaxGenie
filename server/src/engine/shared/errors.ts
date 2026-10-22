/**
 * Custom typed error classes for TaxGenie pure engines.
 * Pure functions throw these typed domain errors on invalid input or calculation errors.
 */

export class EngineValidationError extends Error {
  public readonly code: string;
  public readonly field?: string | undefined;

  constructor(message: string, code = "INVALID_ENGINE_INPUT", field?: string | undefined) {
    super(message);
    this.name = "EngineValidationError";
    this.code = code;
    this.field = field;
    Object.setPrototypeOf(this, EngineValidationError.prototype);
  }
}

export class TaxCalculationError extends Error {
  public readonly code: string;

  constructor(message: string, code = "TAX_CALCULATION_ERROR") {
    super(message);
    this.name = "TaxCalculationError";
    this.code = code;
    Object.setPrototypeOf(this, TaxCalculationError.prototype);
  }
}

export class GstCalculationError extends Error {
  public readonly code: string;
  public readonly rate?: number | undefined;

  constructor(message: string, code = "GST_CALCULATION_ERROR", rate?: number | undefined) {
    super(message);
    this.name = "GstCalculationError";
    this.code = code;
    this.rate = rate;
    Object.setPrototypeOf(this, GstCalculationError.prototype);
  }
}
