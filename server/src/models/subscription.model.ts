import mongoose, { Document, Schema } from "mongoose";

export enum SubscriptionPlanEnum {
  FREE = "FREE",
  PRO = "PRO",
  BUSINESS = "BUSINESS",
}

export enum SubscriptionStatusEnum {
  TRIALING = "TRIALING",
  ACTIVE = "ACTIVE",
  PAST_DUE = "PAST_DUE",
  CANCELED = "CANCELED",
}

export interface SubscriptionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  plan: keyof typeof SubscriptionPlanEnum;
  status: keyof typeof SubscriptionStatusEnum;
  trialEndsAt: Date;
  currentPeriodEnd: Date;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  razorpayPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<SubscriptionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
    },
    plan: {
      type: String,
      enum: Object.values(SubscriptionPlanEnum),
      default: SubscriptionPlanEnum.FREE,
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatusEnum),
      default: SubscriptionStatusEnum.TRIALING,
    },
    trialEndsAt: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    razorpaySubscriptionId: { type: String, default: null },
    razorpayCustomerId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
  },
  { timestamps: true }
);

const SubscriptionModel = mongoose.model<SubscriptionDocument>(
  "Subscription",
  subscriptionSchema
);

export default SubscriptionModel;
