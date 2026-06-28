import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middlewares/authMiddleware.js";
import { rewardService } from "../services/rewardService.js";

export async function listRewards(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await rewardService.list(
    actor,
    request.validatedQuery as { active?: boolean },
  );

  return response.json(result);
}

export async function getReward(request: Request, response: Response) {
  const actor = getAuthenticatedUser(request);
  const result = await rewardService.getById(request.params.id as string, actor);

  return response.json(result);
}

export async function createReward(request: Request, response: Response) {
  const result = await rewardService.create(request.body);

  return response.status(201).json(result);
}

export async function updateReward(request: Request, response: Response) {
  const result = await rewardService.update(
    request.params.id as string,
    request.body,
  );

  return response.json(result);
}

export async function deleteReward(request: Request, response: Response) {
  const result = await rewardService.remove(request.params.id as string);

  return response.json(result);
}
