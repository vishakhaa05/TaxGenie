export interface SubscriptionData {
  _id: string;
  userId: string;
  plan: "FREE" | "PRO" | "BUSINESS";
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  trialEndsAt: string;
  currentPeriodEnd: string;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  razorpayPaymentId?: string;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  subscription: SubscriptionData;
  isActive: boolean;
  daysRemaining: number;
}

export interface UpgradePlanInput {
  plan: "PRO" | "BUSINESS";
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
}
