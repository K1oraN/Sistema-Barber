import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middlewares/authMiddleware.js";
import { professionalService } from "../services/professionalService.js";

export async function listProfessionals(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await professionalService.list(
    actor,
    request.validatedQuery as { active?: boolean },
  );

  return response.json(result);
}

export async function getProfessional(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await professionalService.getById(
    actor,
    request.params.id as string,
  );

  return response.json(result);
}

export async function getOwnProfessional(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await professionalService.getMe(actor);

  return response.json(result);
}

export async function updateOwnProfessionalStatus(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await professionalService.updateOwnStatus(actor, request.body);

  return response.json(result);
}

export async function listOwnProfessionalTimeBlocks(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await professionalService.listOwnTimeBlocks(actor);

  return response.json(result);
}

export async function createOwnProfessionalTimeBlock(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await professionalService.createOwnTimeBlock(actor, request.body);

  return response.status(201).json(result);
}

export async function createProfessional(request: Request, response: Response) {
  const result = await professionalService.create(request.body);

  return response.status(201).json(result);
}

export async function updateProfessional(request: Request, response: Response) {
  const result = await professionalService.update(
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function deleteProfessional(request: Request, response: Response) {
  const result = await professionalService.remove(request.params.id as string);

  return response.json(result);
}
