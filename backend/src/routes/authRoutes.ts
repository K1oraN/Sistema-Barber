import { Router } from "express";
import { login, me, register } from "../controllers/authController.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { loginSchema, registerSchema } from "../validations/authValidation.js";

export const authRoutes = Router();

authRoutes.post("/register", validateRequest(registerSchema), register);
authRoutes.post("/login", validateRequest(loginSchema), login);
authRoutes.get("/me", ensureAuthenticated, me);
