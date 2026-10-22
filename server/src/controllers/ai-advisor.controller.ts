import { Request, Response, NextFunction } from "express";
import { AiAdvisorService } from "../services/ai-advisor.service";

export class AiAdvisorController {
  public static async askChat(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      const { question } = req.body;

      if (!question || typeof question !== "string") {
        return res
          .status(400)
          .json({ message: "Please provide a valid question for TaxGenie AI." });
      }

      const result = await AiAdvisorService.askYourFinances(userId, question);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  public static async getSavingsAdvice(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      const {
        monthlyIncome,
        fixedExpenses,
        existingSavings,
        riskAppetite,
        goal,
      } = req.body;

      const advice = await AiAdvisorService.analyzeSavingsAndInvestments(
        userId,
        {
          monthlyIncome: Number(monthlyIncome) || 0,
          fixedExpenses: Number(fixedExpenses) || 0,
          existingSavings: Number(existingSavings) || 0,
          riskAppetite,
          goal,
        }
      );

      return res.status(200).json({ success: true, advice });
    } catch (error) {
      next(error);
    }
  }

  public static async getAnomalies(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      const result = await AiAdvisorService.detectSpendingAnomalies(userId);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}
