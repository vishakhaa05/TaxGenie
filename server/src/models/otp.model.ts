import mongoose, { Document, Schema } from "mongoose";

export interface OtpDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  email: string;
  purpose: "verify_email" | "reset_password";
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  lastSentAt: Date;
  sendCountWindow: number;
  windowStartTime: Date;
  createdAt: Date;
}

const otpSchema = new Schema<OtpDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["verify_email", "reset_password"],
      default: "verify_email",
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB automatic TTL deletion
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    sendCountWindow: {
      type: Number,
      default: 1,
    },
    windowStartTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ email: 1, purpose: 1 });

const OtpModel = mongoose.models.Otp || mongoose.model<OtpDocument>("Otp", otpSchema);

export default OtpModel;
