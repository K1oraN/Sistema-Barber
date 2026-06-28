import bcrypt from "bcrypt";
import { Role } from "../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/appError.js";
import { signToken } from "../utils/jwt.js";
import { publicUser } from "../utils/publicUser.js";
import type {
  LoginData,
  RegisterData,
} from "../validations/authValidation.js";

const invalidLoginMessage =
  "Não foi possível entrar. Confira seu email e senha.";

export const authService = {
  async register(data: RegisterData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError("Este e-mail ja esta cadastrado.", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: Role.CLIENT,
      },
    });

    const token = signToken({ sub: user.id, role: user.role });

    return {
      token,
      user: publicUser(user),
    };
  },

  async login(data: LoginData) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError(invalidLoginMessage, 401);
    }

    if (!user.active) {
      throw new AppError("Usuario inativo. Fale com a administracao.", 403);
    }

    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(invalidLoginMessage, 401);
    }

    const token = signToken({ sub: user.id, role: user.role });

    return {
      token,
      user: publicUser(user),
    };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        professional: true,
      },
    });

    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return safeUser;
  },
};
