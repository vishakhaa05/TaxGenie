import mongoose, { Document, Schema } from "mongoose";

export type CalculationType = "income_tax" | "gst";

export interface IncomeTaxSummary {
  grossIncome: number;
  recommendedRegime: "new" | "old";
  bestTax: number;
  otherTax: number;
  savings: number;
}

export interface GstSummary {
  amount: number;
  rate: number;
  mode: "add" | "remove";
  gstAmount: number;
  total: number;
}

export interface CalculationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: CalculationType;
  taxYear: string;
  name: string;
  inputs: Record<string, any>;
  result: Record<string, any>;
  rulesVersion: string;
  summary: IncomeTaxSummary | GstSummary | Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const calculationSchema = new Schema<CalculationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["income_tax", "gst"],
      required: true,
      index: true,
    },
    taxYear: {
      type: String,
      required: true,
      default: "2026-27",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    inputs: {
      type: Schema.Types.Mixed,
      required: true,
    },
    result: {
      type: Schema.Types.Mixed,
      required: true,
    },
    rulesVersion: {
      type: String,
      default: "2026-27-v1",
    },
    summary: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast filtered listing and user-scoped lookups
calculationSchema.index({ userId: 1, createdAt: -1 });
calculationSchema.index({ userId: 1, type: 1, createdAt: -1 });
calculationSchema.index({ userId: 1, taxYear: 1 });

const CalculationModel =
  mongoose.models.Calculation ||
  mongoose.model<CalculationDocument>("Calculation", calculationSchema);

export default CalculationModel;
