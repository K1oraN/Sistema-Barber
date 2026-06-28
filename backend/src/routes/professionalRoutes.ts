import { Router } from "express";
import {
  createOwnProfessionalTimeBlock,
  createProfessional,
  deleteProfessional,
  getProfessional,
  getOwnProfessional,
  listOwnProfessionalTimeBlocks,
  listProfessionals,
  updateOwnProfessionalStatus,
  updateProfessional,
} from "../controllers/professionalController.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { adminOnly, allowRoles } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { Role } from "../generated/prisma/client.js";
import {
  idParamSchema,
  optionalActiveQuerySchema,
} from "../validations/commonValidation.js";
import {
  createProfessionalTimeBlockSchema,
  createProfessionalSchema,
  updateProfessionalStatusSchema,
  updateProfessionalSchema,
} from "../validations/professionalValidation.js";

export const professionalRoutes = Router();

professionalRoutes.use(ensureAuthenticated);

professionalRoutes.get(
  "/",
  validateRequest({ query: optionalActiveQuerySchema }),
  listProfessionals,
);
professionalRoutes.get("/me", allowRoles(Role.PROFESSIONAL), getOwnProfessional);
professionalRoutes.patch(
  "/me/status",
  allowRoles(Role.PROFESSIONAL),
  validateRequest({ body: updateProfessionalStatusSchema }),
  updateOwnProfessionalStatus,
);
professionalRoutes.get(
  "/me/blocks",
  allowRoles(Role.PROFESSIONAL),
  listOwnProfessionalTimeBlocks,
);
professionalRoutes.post(
  "/me/blocks",
  allowRoles(Role.PROFESSIONAL),
  validateRequest({ body: createProfessionalTimeBlockSchema }),
  createOwnProfessionalTimeBlock,
);
professionalRoutes.get("/:id", validateRequest({ params: idParamSchema }), getProfessional);
professionalRoutes.post(
  "/",
  adminOnly,
  validateRequest(createProfessionalSchema),
  createProfessional,
);
professionalRoutes.put(
  "/:id",
  adminOnly,
  validateRequest({ params: idParamSchema, body: updateProfessionalSchema }),
  updateProfessional,
);
professionalRoutes.delete(
  "/:id",
  adminOnly,
  validateRequest({ params: idParamSchema }),
  deleteProfessional,
);
