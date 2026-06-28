import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { Role } from "../generated/prisma/client.js";
import { env } from "./env.js";

type TokenPayload = {
  sub: string;
  role: Role;
};

export function signToken(payload: TokenPayload) {
  const expiresIn = env.JWT_EXPIRES_IN as SignOptions["expiresIn"];

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn,
  });
}
