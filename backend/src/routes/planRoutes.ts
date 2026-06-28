import { Router } from "express";
import {
  approvePlanSubscription,
  cancelPlanSubscription,
  createPlan,
  deletePlan,
  getPlan,
  getMyPlanSubscription,
  listPlans,
  listPlanSubscriptions,
  renewPlanSubscription,
  subscribePlan,
  updatePlan,
  updatePlanSubscriptionPaymentLink,
  uploadPlanSubscriptionReceipt,
} from "../controllers/planController.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/roleMiddleware.js";
import { receiptUpload } from "../middlewares/uploadMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  idParamSchema,
  optionalActiveQuerySchema,
} from "../validations/commonValidation.js";
import {
  createPlanSchema,
  planPaymentLinkSchema,
  subscribePlanSchema,
  updatePlanSchema,
} from "../validations/planValidation.js";

export const planRoutes = Router();

planRoutes.use(ensureAuthenticated);

planRoutes.get("/", validateRequest({ query: optionalActiveQuerySchema }), listPlans);
planRoutes.get("/subscriptions", listPlanSubscriptions);
planRoutes.get("/subscriptions/me", getMyPlanSubscription);
planRoutes.post(
  "/subscriptions/:id/receipt",
  validateRequest({ params: idParamSchema }),
  receiptUpload.single("receipt"),
  uploadPlanSubscriptionReceipt,
);
planRoutes.put(
  "/subscriptions/:id/payment-link",
  adminOnly,
  validateRequest({ params: idParamSchema, body: planPaymentLinkSchema }),
  updatePlanSubscriptionPaymentLink,
);
planRoutes.post(
  "/subscriptions/:id/approve",
  adminOnly,
  validateRequest({ params: idParamSchema }),
  approvePlanSubscription,
);
planRoutes.post(
  "/subscriptions/:id/cancel",
  adminOnly,
  validateRequest({ params: idParamSchema }),
  cancelPlanSubscription,
);
planRoutes.post(
  "/subscriptions/:id/renew",
  adminOnly,
  validateRequest({ params: idParamSchema }),
  renewPlanSubscription,
);
planRoutes.post(
  "/:id/subscribe",
  validateRequest({ params: idParamSchema, body: subscribePlanSchema }),
  subscribePlan,
);
planRoutes.get("/:id", validateRequest({ params: idParamSchema }), getPlan);
planRoutes.post("/", adminOnly, validateRequest(createPlanSchema), createPlan);
planRoutes.put(
  "/:id",
  adminOnly,
  validateRequest({ params: idParamSchema, body: updatePlanSchema }),
  updatePlan,
);
planRoutes.delete(
  "/:id",
  adminOnly,
  validateRequest({ params: idParamSchema }),
  deletePlan,
);
