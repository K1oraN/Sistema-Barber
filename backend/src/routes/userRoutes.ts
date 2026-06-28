import { Router } from "express";
import {
  createQuickClient,
  createUser,
  deleteUser,
  getUser,
  listClients,
  listUsers,
  updateUser,
} from "../controllers/userController.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { idParamSchema } from "../validations/commonValidation.js";
import {
  createQuickClientSchema,
  createUserSchema,
  updateUserSchema,
} from "../validations/userValidation.js";

export const userRoutes = Router();

userRoutes.use(ensureAuthenticated);

userRoutes.get("/clients", listClients);
userRoutes.post(
  "/clients",
  validateRequest({ body: createQuickClientSchema }),
  createQuickClient,
);
userRoutes.get("/", adminOnly, listUsers);
userRoutes.post("/", adminOnly, validateRequest(createUserSchema), createUser);
userRoutes.get("/:id", validateRequest({ params: idParamSchema }), getUser);
userRoutes.put(
  "/:id",
  validateRequest({ params: idParamSchema, body: updateUserSchema }),
  updateUser,
);
userRoutes.delete(
  "/:id",
  adminOnly,
  validateRequest({ params: idParamSchema }),
  deleteUser,
);
