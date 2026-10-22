import { Request, Response, NextFunction } from "express";
import { SubscriptionService } from "../services/subscription.service";

export const requireSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { isActive, daysRemaining, subscription } =
      await SubscriptionService.getOrCreateSubscription(userId);

    if (!isActive) {
      return res.status(403).json({
        message:
          "Your 7-day free trial has expired. Please upgrade your subscription to access premium AI advice, tax tools, and business features.",
        trialExpired: true,
        daysRemaining: 0,
        plan: subscription.plan,
        status: subscription.status,
      });
    }

    req.subscriptionInfo = { isActive, daysRemaining, subscription: subscription as any };
    next();
  } catch (error) {
    next(error);
  }
};
