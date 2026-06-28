import { Router } from "express";
import {
  createService,
  deleteService,
  getService,
  listServices,
  updateService,
} from "../controllers/serviceController.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  idParamSchema,
  optionalActiveQuerySchema,
} from "../validations/commonValidation.js";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../validations/serviceValidation.js";

export const serviceRoutes = Router();

serviceRoutes.use(ensureAuthenticated);

serviceRoutes.get("/", validateRequest({ query: optionalActiveQuerySchema }), listServices);
serviceRoutes.get("/:id", validateRequest({ params: idParamSchema }), getService);
serviceRoutes.post("/", adminOnly, validateRequest(createServiceSchema), createService);
serviceRoutes.put(
  "/:id",
  adminOnly,
  validateRequest({ params: idParamSchema, body: updateServiceSchema }),
  updateService,
);
serviceRoutes.delete(
  "/:id",
  adminOnly,
  validateRequest({ params: idParamSchema }),
  deleteService,
);

