import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middlewares/authMiddleware.js";
import { serviceService } from "../services/serviceService.js";

export async function listServices(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await serviceService.list(
    actor,
    request.validatedQuery as { active?: boolean },
  );

  return response.json(result);
}

export async function getService(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await serviceService.getById(request.params.id as string, actor);

  return response.json(result);
}

export async function createService(request: Request, response: Response) {
  const result = await serviceService.create(request.body);

  return response.status(201).json(result);
}

export async function updateService(request: Request, response: Response) {
  const result = await serviceService.update(
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function deleteService(request: Request, response: Response) {
  const result = await serviceService.remove(request.params.id as string);

  return response.json(result);
}
