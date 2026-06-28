import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middlewares/authMiddleware.js";
import { userService } from "../services/userService.js";

export async function listUsers(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await userService.list(actor);

  return response.json(result);
}

export async function listClients(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await userService.listClients(actor);

  return response.json(result);
}

export async function getUser(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await userService.getById(actor, request.params.id as string);

  return response.json(result);
}

export async function createUser(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await userService.create(actor, request.body);

  return response.status(201).json(result);
}

export async function createQuickClient(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await userService.createQuickClient(actor, request.body);

  return response.status(201).json(result);
}

export async function updateUser(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await userService.update(
    actor,
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function deleteUser(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await userService.remove(actor, request.params.id as string);

  return response.json(result);
}
