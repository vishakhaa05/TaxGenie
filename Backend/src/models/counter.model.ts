import mongoose, { Schema, Document, Types } from "mongoose";

export interface CounterDocument extends Document {
  userId: Types.ObjectId;
  key: string;
  nextNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const CounterSchema = new Schema<CounterDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    nextNumber: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

CounterSchema.index({ userId: 1, key: 1 }, { unique: true });

export const CounterModel = mongoose.model<CounterDocument>(
  "Counter",
  CounterSchema
);

export default CounterModel;
