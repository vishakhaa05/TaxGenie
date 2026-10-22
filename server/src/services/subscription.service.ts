import mongoose from "mongoose";
import SubscriptionModel, {
  SubscriptionPlanEnum,
  SubscriptionStatusEnum,
} from "../models/subscription.model";

export class SubscriptionService {
  public static async getOrCreateSubscription(userId: string) {
    if (mongoose.connection.readyState !== 1) {
      const now = new Date();
      const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return {
        subscription: {
          userId,
          plan: SubscriptionPlanEnum.PRO,
          status: SubscriptionStatusEnum.ACTIVE,
          trialEndsAt: defaultEnd,
          currentPeriodEnd: defaultEnd,
        },
        isActive: true,
        daysRemaining: 30,
      };
    }
    let subscription = await SubscriptionModel.findOne({ userId });

    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day trial

    if (!subscription) {
      subscription = await SubscriptionModel.create({
        userId,
        plan: SubscriptionPlanEnum.FREE,
        status: SubscriptionStatusEnum.TRIALING,
        trialEndsAt: defaultEnd,
        currentPeriodEnd: defaultEnd,
      });
    }

    if (!subscription.trialEndsAt) {
      subscription.trialEndsAt = defaultEnd;
    }
    if (!subscription.currentPeriodEnd) {
      subscription.currentPeriodEnd = subscription.trialEndsAt;
    }

    // Check trial expiration
    if (
      subscription.status === SubscriptionStatusEnum.TRIALING &&
      now > subscription.trialEndsAt
    ) {
      subscription.status = SubscriptionStatusEnum.CANCELED;
      await subscription.save();
    }

    const trialTime = subscription.trialEndsAt ? subscription.trialEndsAt.getTime() : now.getTime();
    const daysRemaining = Math.max(
      0,
      Math.ceil((trialTime - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const isActive =
      subscription.status === SubscriptionStatusEnum.ACTIVE ||
      (subscription.status === SubscriptionStatusEnum.TRIALING &&
        now <= subscription.trialEndsAt);

    return {
      subscription,
      isActive,
      daysRemaining,
    };
  }

  public static async updateSubscriptionPlan(
    userId: string,
    plan: keyof typeof SubscriptionPlanEnum,
    paymentDetails?: { subscriptionId?: string; paymentId?: string }
  ) {
    let subscription = await SubscriptionModel.findOne({ userId });
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days active

    if (!subscription) {
      subscription = new SubscriptionModel({
        userId,
        trialEndsAt: now,
        currentPeriodEnd: periodEnd,
      });
    }

    subscription.plan = plan;
    subscription.status = SubscriptionStatusEnum.ACTIVE;
    subscription.currentPeriodEnd = periodEnd;
    if (paymentDetails?.subscriptionId) {
      subscription.razorpaySubscriptionId = paymentDetails.subscriptionId;
    }
    if (paymentDetails?.paymentId) {
      subscription.razorpayPaymentId = paymentDetails.paymentId;
    }

    await subscription.save();
    return subscription;
  }
}
