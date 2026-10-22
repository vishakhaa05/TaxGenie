import { Request, Response, NextFunction } from "express";
import { SubscriptionService } from "../services/subscription.service";

export class SubscriptionController {
  public static async getStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req.user as any)?._id || (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User session expired or invalid" });
      }

      const data = await SubscriptionService.getOrCreateSubscription(userId.toString());
      return res.status(200).json({ success: true, ...data });
    } catch (error) {
      console.error("Subscription getStatus Error:", error);
      next(error);
    }
  }

  public static async upgradePlan(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = (req.user as any)?._id || (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "User session expired or invalid" });
      }

      const { plan, razorpaySubscriptionId, razorpayPaymentId } = req.body;

      if (!plan || !["PRO", "BUSINESS"].includes(plan)) {
        return res
          .status(400)
          .json({ message: "Invalid plan selected. Choose PRO or BUSINESS." });
      }

      const subscription = await SubscriptionService.updateSubscriptionPlan(
        userId.toString(),
        plan,
        {
          subscriptionId: razorpaySubscriptionId,
          paymentId: razorpayPaymentId,
        }
      );

      return res.status(200).json({
        success: true,
        message: `Successfully upgraded to ${plan} plan!`,
        subscription,
      });
    } catch (error) {
      console.error("Subscription upgradePlan Error:", error);
      next(error);
    }
  }
}
