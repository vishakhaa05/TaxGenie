import mongoose, { Schema, Document, Types } from "mongoose";

export interface CustomerDocument extends Document {
  userId: Types.ObjectId;
  name: string;
  gstin?: string | undefined;
  address: string;
  state: string;
  email?: string | undefined;
  phone?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<CustomerDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 15,
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
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100,
      default: undefined,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

CustomerSchema.index({ userId: 1, name: 1 });

export const CustomerModel = mongoose.model<CustomerDocument>(
  "Customer",
  CustomerSchema
);

export default CustomerModel;
