import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../generated/prisma/client.js";
import { AppError } from "../utils/appError.js";
import { env } from "../utils/env.js";

export function ensureAuthenticated(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token nao informado.", 401);
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    throw new AppError("Formato do token invalido.", 401);
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      role: Role;
    };

    if (!Object.values(Role).includes(payload.role)) {
      throw new AppError("Token invalido.", 401);
    }

    request.user = {
      id: payload.sub,
      role: payload.role,
    };

    return next();
  } catch {
    throw new AppError("Token invalido.", 401);
  }
}

export function getAuthenticatedUser(request: Request) {
  if (!request.user) {
    throw new AppError("Usuario nao autenticado.", 401);
  }

  return request.user;
}
