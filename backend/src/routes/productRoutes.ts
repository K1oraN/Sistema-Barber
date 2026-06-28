import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../controllers/productController.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  idParamSchema,
  optionalActiveQuerySchema,
} from "../validations/commonValidation.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validations/productValidation.js";

export const productRoutes = Router();

productRoutes.use(ensureAuthenticated);

productRoutes.get("/", validateRequest({ query: optionalActiveQuerySchema }), listProducts);
productRoutes.get("/:id", validateRequest({ params: idParamSchema }), getProduct);
productRoutes.post("/", adminOnly, validateRequest(createProductSchema), createProduct);
productRoutes.put(
  "/:id",
  adminOnly,
  validateRequest({ params: idParamSchema, body: updateProductSchema }),
  updateProduct,
);
productRoutes.delete(
  "/:id",
  adminOnly,
  validateRequest({ params: idParamSchema }),
  deleteProduct,
);

