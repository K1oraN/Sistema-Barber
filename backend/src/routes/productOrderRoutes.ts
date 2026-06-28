import { Router } from "express";
import {
  cancelProductOrder,
  getProductOrder,
  listProductOrders,
  preOrderProduct,
  reserveProduct,
  updateProductOrder,
  updateProductOrderPaymentLink,
  uploadProductOrderReceipt,
} from "../controllers/productOrderController.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { receiptUpload } from "../middlewares/uploadMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { idParamSchema } from "../validations/commonValidation.js";
import {
  createProductOrderSchema,
  productOrderPaymentLinkSchema,
  productOrderQuerySchema,
  updateProductOrderSchema,
} from "../validations/productOrderValidation.js";

export const productOrderRoutes = Router();

productOrderRoutes.use(ensureAuthenticated);

productOrderRoutes.get(
  "/",
  validateRequest({ query: productOrderQuerySchema }),
  listProductOrders,
);
productOrderRoutes.post(
  "/reserve",
  validateRequest(createProductOrderSchema),
  reserveProduct,
);
productOrderRoutes.post(
  "/pre-order",
  validateRequest(createProductOrderSchema),
  preOrderProduct,
);
productOrderRoutes.get(
  "/:id",
  validateRequest({ params: idParamSchema }),
  getProductOrder,
);
productOrderRoutes.post(
  "/:id/receipt",
  validateRequest({ params: idParamSchema }),
  receiptUpload.single("receipt"),
  uploadProductOrderReceipt,
);
productOrderRoutes.put(
  "/:id/payment-link",
  validateRequest({ params: idParamSchema, body: productOrderPaymentLinkSchema }),
  updateProductOrderPaymentLink,
);
productOrderRoutes.put(
  "/:id",
  validateRequest({ params: idParamSchema, body: updateProductOrderSchema }),
  updateProductOrder,
);
productOrderRoutes.post(
  "/:id/cancel",
  validateRequest({ params: idParamSchema }),
  cancelProductOrder,
);
