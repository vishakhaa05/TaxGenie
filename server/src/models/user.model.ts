import mongoose, { Document, Schema } from "mongoose";
import { comparePassword, hashPassword } from "../utils/password";

export enum AccountModeEnum {
  PERSONAL = "PERSONAL",
  BUSINESS = "BUSINESS",
}

export enum RiskAppetiteEnum {
  CONSERVATIVE = "CONSERVATIVE",
  MODERATE = "MODERATE",
  AGGRESSIVE = "AGGRESSIVE",
}

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  language: "en" | "hi";
  theme: "light" | "dark" | "system";
  defaultState?: string;
  ageGroup: "general" | "senior" | "superSenior";
  failedLoginCount: number;
  lockUntil: Date | null;
  profilePicture: string | null;
  mode: keyof typeof AccountModeEnum;
  riskAppetite: keyof typeof RiskAppetiteEnum;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
  omitPassword: () => Omit<UserDocument, "password">;
}

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      select: true,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    language: {
      type: String,
      enum: ["en", "hi"],
      default: "en",
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    defaultState: {
      type: String,
      default: "27", // Maharashtra default
    },
    ageGroup: {
      type: String,
      enum: ["general", "senior", "superSenior"],
      default: "general",
    },
    failedLoginCount: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    mode: {
      type: String,
      enum: Object.values(AccountModeEnum),
      default: AccountModeEnum.PERSONAL,
    },
    riskAppetite: {
      type: String,
      enum: Object.values(RiskAppetiteEnum),
      default: RiskAppetiteEnum.MODERATE,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    if (this.password) {
      this.password = await hashPassword(this.password);
    }
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return comparePassword(candidatePassword, this.password);
};

userSchema.methods.omitPassword = function (): any {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const UserModel = mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);

export default UserModel;
