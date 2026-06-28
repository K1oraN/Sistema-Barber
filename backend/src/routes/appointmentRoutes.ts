import { Router } from "express";
import {
  createAppointment,
  deleteAppointment,
  finishAppointment,
  getAvailability,
  getAppointment,
  listAppointments,
  updateAppointment,
} from "../controllers/appointmentController.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { idParamSchema } from "../validations/commonValidation.js";
import {
  availabilityQuerySchema,
  createAppointmentSchema,
  updateAppointmentSchema,
} from "../validations/appointmentValidation.js";

export const appointmentRoutes = Router();

appointmentRoutes.use(ensureAuthenticated);

appointmentRoutes.get("/", listAppointments);
appointmentRoutes.get(
  "/availability",
  validateRequest({ query: availabilityQuerySchema }),
  getAvailability,
);
appointmentRoutes.get("/:id", validateRequest({ params: idParamSchema }), getAppointment);
appointmentRoutes.post(
  "/:id/finish",
  validateRequest({ params: idParamSchema }),
  finishAppointment,
);
appointmentRoutes.post("/", validateRequest(createAppointmentSchema), createAppointment);
appointmentRoutes.put(
  "/:id",
  validateRequest({ params: idParamSchema, body: updateAppointmentSchema }),
  updateAppointment,
);
appointmentRoutes.delete(
  "/:id",
  validateRequest({ params: idParamSchema }),
  deleteAppointment,
);
