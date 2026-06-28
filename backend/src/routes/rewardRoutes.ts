import { Router } from "express";
import {
  createReward,
  deleteReward,
  getReward,
  listRewards,
  updateReward,
} from "../controllers/rewardController.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  idParamSchema,
  optionalActiveQuerySchema,
} from "../validations/commonValidation.js";
import {
  createRewardSchema,
  updateRewardSchema,
} from "../validations/rewardValidation.js";

export const rewardRoutes = Router();

rewardRoutes.use(ensureAuthenticated);

rewardRoutes.get("/", validateRequest({ query: optionalActiveQuerySchema }), listRewards);
rewardRoutes.get("/:id", validateRequest({ params: idParamSchema }), getReward);
rewardRoutes.post("/", adminOnly, validateRequest(createRewardSchema), createReward);
rewardRoutes.put(
  "/:id",
  adminOnly,
  validateRequest({ params: idParamSchema, body: updateRewardSchema }),
  updateReward,
);
rewardRoutes.delete(
  "/:id",
  adminOnly,
  validateRequest({ params: idParamSchema }),
  deleteReward,
);

