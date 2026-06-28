import type { Request, Response } from "express";
import { adminDashboardService } from "../services/adminDashboardService.js";

export async function getAdminDashboard(request: Request, response: Response) {
  const result = await adminDashboardService.dashboard(request.query);

  return response.json(result);
}

export async function getAdminReport(request: Request, response: Response) {
  const kind = request.params.kind as
    | "appointments"
    | "financial"
    | "clients"
    | "products"
    | "plans";
  const result = await adminDashboardService.report(kind, request.query);

  return response.json(result);
}
