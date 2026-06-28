import { Router } from "express";
import {
  createPayment,
  deletePayment,
  getPayment,
  listPayments,
  updatePaymentLink,
  updatePayment,
  uploadPaymentReceipt,
} from "../controllers/paymentController.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { receiptUpload } from "../middlewares/uploadMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { idParamSchema } from "../validations/commonValidation.js";
import {
  createPaymentSchema,
  paymentLinkSchema,
  updatePaymentSchema,
} from "../validations/paymentValidation.js";

export const paymentRoutes = Router();

paymentRoutes.use(ensureAuthenticated);

paymentRoutes.get("/", listPayments);
paymentRoutes.get("/:id", validateRequest({ params: idParamSchema }), getPayment);
paymentRoutes.post("/", validateRequest(createPaymentSchema), createPayment);
paymentRoutes.post(
  "/:id/receipt",
  validateRequest({ params: idParamSchema }),
  receiptUpload.single("receipt"),
  uploadPaymentReceipt,
);
paymentRoutes.put(
  "/:id/payment-link",
  validateRequest({ params: idParamSchema, body: paymentLinkSchema }),
  updatePaymentLink,
);
paymentRoutes.put(
  "/:id",
  validateRequest({ params: idParamSchema, body: updatePaymentSchema }),
  updatePayment,
);
paymentRoutes.delete(
  "/:id",
  validateRequest({ params: idParamSchema }),
  deletePayment,
);
