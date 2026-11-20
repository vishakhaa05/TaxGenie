import mongoose, { Schema, Document, Types } from "mongoose";

export interface BusinessProfileDocument extends Document {
  userId: Types.ObjectId;
  legalName: string;
  tradeName?: string | undefined;
  gstin?: string | undefined;
  pan?: string | undefined;
  address: string;
  state: string;
  pincode: string;
  phone?: string | undefined;
  email?: string | undefined;
  invoicePrefix: string;
  numberPadding: number;
  resetEachFinancialYear: boolean;
  defaultPaymentTermsDays: number;
  defaultNotes?: string | undefined;
  defaultTerms?: string | undefined;
  paymentDetailsText?: string | undefined;
  signatureLabel?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessProfileSchema = new Schema<BusinessProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    legalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    tradeName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: undefined,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 15,
      default: undefined,
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
      default: undefined,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 6,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: undefined,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100,
      default: undefined,
    },
    invoicePrefix: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 8,
      default: "INV",
    },
    numberPadding: {
      type: Number,
      default: 4,
      min: 1,
      max: 8,
    },
    resetEachFinancialYear: {
      type: Boolean,
      default: true,
    },
    defaultPaymentTermsDays: {
      type: Number,
      default: 15,
      min: 0,
      max: 365,
    },
    defaultNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: undefined,
    },
    defaultTerms: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: undefined,
    },
    paymentDetailsText: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },
    signatureLabel: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "Authorised Signatory",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const BusinessProfileModel = mongoose.model<BusinessProfileDocument>(
  "BusinessProfile",
  BusinessProfileSchema
);

export default BusinessProfileModel;
