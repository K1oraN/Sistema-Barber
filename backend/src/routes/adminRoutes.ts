import { Router } from "express";
import { getAdminDashboard, getAdminReport } from "../controllers/adminController.js";
import { ensureAuthenticated } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/roleMiddleware.js";

export const adminRoutes = Router();

adminRoutes.use(ensureAuthenticated, adminOnly);

adminRoutes.get("/dashboard", getAdminDashboard);
adminRoutes.get("/reports/:kind", getAdminReport);
