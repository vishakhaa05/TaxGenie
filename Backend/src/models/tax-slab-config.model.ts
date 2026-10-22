import mongoose, { Document, Schema } from "mongoose";

export interface TaxSlab {
  minIncome: number;
  maxIncome: number | null; // null represents above
  rate: number; // percentage e.g. 5, 10, 15, 20, 25, 30
}

export interface TaxSlabConfigDocument extends Document {
  financialYear: string; // e.g. "2026-2027"
  assessmentYear: string; // e.g. "2027-2028"
  newRegime: {
    standardDeduction: number;
    rebateMaxIncome: number; // u/s 87A rebate limit (e.g. 1200000)
    rebateAmount: number; // max rebate (e.g. 60000)
    slabs: TaxSlab[];
  };
  oldRegime: {
    standardDeduction: number;
    max80C: number; // 150000
    slabs: TaxSlab[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const taxSlabConfigSchema = new Schema<TaxSlabConfigDocument>(
  {
    financialYear: { type: String, required: true, unique: true },
    assessmentYear: { type: String, required: true },
    newRegime: {
      standardDeduction: { type: Number, default: 75000 },
      rebateMaxIncome: { type: Number, default: 1200000 },
      rebateAmount: { type: Number, default: 60000 },
      slabs: [
        {
          minIncome: Number,
          maxIncome: Schema.Types.Mixed,
          rate: Number,
        },
      ],
    },
    oldRegime: {
      standardDeduction: { type: Number, default: 50000 },
      max80C: { type: Number, default: 150000 },
      slabs: [
        {
          minIncome: Number,
          maxIncome: Schema.Types.Mixed,
          rate: Number,
        },
      ],
    },
  },
  { timestamps: true }
);

const TaxSlabConfigModel = mongoose.model<TaxSlabConfigDocument>(
  "TaxSlabConfig",
  taxSlabConfigSchema
);

export default TaxSlabConfigModel;
