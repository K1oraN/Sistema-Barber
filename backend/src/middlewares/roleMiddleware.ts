import type { NextFunction, Request, Response } from "express";
import { Role } from "../generated/prisma/client.js";
import { AppError } from "../utils/appError.js";

export function allowRoles(...roles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    if (!roles.includes(request.user.role)) {
      throw new AppError("Voce nao tem permissao para acessar este recurso.", 403);
    }

    return next();
  };
}

export const adminOnly = allowRoles(Role.ADMIN);

