import { Router } from "express";
import { requireAuth, requireCsrf } from "../middlewares/security.middleware";
import { CustomerController } from "../controllers/customer.controller";

const router = Router();

router.get("/", requireAuth, CustomerController.listCustomers);
router.post("/", requireAuth, requireCsrf, CustomerController.createCustomer);
router.get("/:id", requireAuth, CustomerController.getCustomer);
router.patch("/:id", requireAuth, requireCsrf, CustomerController.updateCustomer);
router.delete("/:id", requireAuth, requireCsrf, CustomerController.deleteCustomer);

export default router;
