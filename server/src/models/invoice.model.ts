import mongoose, { Schema, Document, Types } from "mongoose";

export type InvoiceDocumentType = "tax_invoice" | "bill_of_supply";
export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled";

export interface InvoiceItemDocument {
  description: string;
  hsnSac?: string | undefined;
  quantity: number;
  unit: string;
  unitPricePaise: number;
  discountType: "percent" | "amount";
  discountValue: number;
  gstRate: number;
}

export interface InvoiceSellerSnapshot {
  legalName: string;
  tradeName?: string | undefined;
  gstin?: string | undefined;
  pan?: string | undefined;
  address: string;
  state: string;
  pincode: string;
  phone?: string | undefined;
  email?: string | undefined;
  signatureLabel?: string | undefined;
}

export interface InvoiceBuyerSnapshot {
  name: string;
  gstin?: string | undefined;
  address: string;
  state: string;
  email?: string | undefined;
  phone?: string | undefined;
}

export interface InvoiceDocument extends Document {
  userId: Types.ObjectId;
  documentType: InvoiceDocumentType;
  status: InvoiceStatus;
  invoiceNumber?: string | undefined;
  invoiceDate: string;
  dueDate: string;
  financialYear: string;
  seller: InvoiceSellerSnapshot;
  buyer: InvoiceBuyerSnapshot;
  items: InvoiceItemDocument[];
  priceIncludesGst: boolean;
  engineResult: Record<string, any>;
  notes?: string | undefined;
  terms?: string | undefined;
  paymentDetailsText?: string | undefined;
  paidAt?: Date | undefined;
  cancelledAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 200 },
    hsnSac: { type: String, trim: true, default: undefined },
    quantity: { type: Number, required: true, min: 0.001 },
    unit: { type: String, default: "NOS", trim: true },
    unitPricePaise: { type: Number, required: true, min: 0 },
    discountType: { type: String, enum: ["percent", "amount"], default: "amount" },
    discountValue: { type: Number, default: 0, min: 0 },
    gstRate: { type: Number, required: true, default: 18 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<InvoiceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ["tax_invoice", "bill_of_supply"],
      required: true,
      default: "tax_invoice",
    },
    status: {
      type: String,
      enum: ["draft", "issued", "paid", "cancelled"],
      required: true,
      default: "draft",
      index: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
      maxlength: 16,
      default: undefined,
    },
    invoiceDate: {
      type: String,
      required: true,
    },
    dueDate: {
      type: String,
      required: true,
    },
    financialYear: {
      type: String,
      required: true,
      trim: true,
    },
    seller: {
      type: Schema.Types.Mixed,
      required: true,
    },
    buyer: {
      type: Schema.Types.Mixed,
      required: true,
    },
    items: {
      type: [InvoiceItemSchema],
      required: true,
      validate: [
        (arr: any[]) => arr.length > 0 && arr.length <= 50,
        "Invoice must have between 1 and 50 items",
      ],
    },
    priceIncludesGst: {
      type: Boolean,
      default: false,
    },
    engineResult: {
      type: Schema.Types.Mixed,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: undefined,
    },
    terms: {
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
    paidAt: {
      type: Date,
      default: undefined,
    },
    cancelledAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

InvoiceSchema.index({ userId: 1, status: 1, invoiceDate: -1 });
InvoiceSchema.index({ userId: 1, createdAt: -1 });
InvoiceSchema.index(
  { userId: 1, invoiceNumber: 1 },
  { unique: true, sparse: true }
);

export const InvoiceModel = mongoose.model<InvoiceDocument>(
  "Invoice",
  InvoiceSchema
);

export default InvoiceModel;
