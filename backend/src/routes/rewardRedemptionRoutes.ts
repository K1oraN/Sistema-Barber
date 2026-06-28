import { Router } from "express";
import { Role } from "../generated/prisma/client.js";
import {
  createRewardRedemption,
  deleteRewardRedemption,
  getRewardRedemption,
  listRewardRedemptions,
  updateRewardRedemption,
} from "../controllers/rewardRedemptionController.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { allowRoles } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { idParamSchema } from "../validations/commonValidation.js";
import {
  createRewardRedemptionSchema,
  updateRewardRedemptionSchema,
} from "../validations/rewardRedemptionValidation.js";

export const rewardRedemptionRoutes = Router();

rewardRedemptionRoutes.use(ensureAuthenticated);
rewardRedemptionRoutes.use(allowRoles(Role.CLIENT, Role.ADMIN));

rewardRedemptionRoutes.get("/", listRewardRedemptions);
rewardRedemptionRoutes.get(
  "/:id",
  validateRequest({ params: idParamSchema }),
  getRewardRedemption,
);
rewardRedemptionRoutes.post(
  "/",
  validateRequest(createRewardRedemptionSchema),
  createRewardRedemption,
);
rewardRedemptionRoutes.put(
  "/:id",
  validateRequest({ params: idParamSchema, body: updateRewardRedemptionSchema }),
  updateRewardRedemption,
);
rewardRedemptionRoutes.delete(
  "/:id",
  validateRequest({ params: idParamSchema }),
  deleteRewardRedemption,
);

