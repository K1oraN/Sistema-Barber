import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middlewares/authMiddleware.js";
import { rewardRedemptionService } from "../services/rewardRedemptionService.js";

export async function listRewardRedemptions(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await rewardRedemptionService.list(actor);

  return response.json(result);
}

export async function getRewardRedemption(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await rewardRedemptionService.getById(
    actor,
    request.params.id as string,
  );

  return response.json(result);
}

export async function createRewardRedemption(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await rewardRedemptionService.create(actor, request.body);

  return response.status(201).json(result);
}

export async function updateRewardRedemption(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await rewardRedemptionService.update(
    actor,
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function deleteRewardRedemption(
  request: Request,
  response: Response,
) {
  const actor = getAuthenticatedUser(request);
  const result = await rewardRedemptionService.remove(
    actor,
    request.params.id as string,
  );

  return response.json(result);
}
