import { Router } from "express";
import {
  getCurrentUserController,
  updateProfileController,
  changePasswordController,
  deleteAccountController,
} from "../controllers/user.controller";
import { requireAuth, requireCsrf, sanitizeNoSql } from "../middlewares/security.middleware";

const userRoutes = Router();

userRoutes.use(sanitizeNoSql);
userRoutes.use(requireAuth);

userRoutes.get("/me", getCurrentUserController);
userRoutes.get("/current-user", getCurrentUserController); // backwards compatibility
userRoutes.patch("/me", requireCsrf, updateProfileController);
userRoutes.put("/me", requireCsrf, updateProfileController);
userRoutes.post("/me/change-password", requireCsrf, changePasswordController);
userRoutes.delete("/me", requireCsrf, deleteAccountController);

export default userRoutes;
