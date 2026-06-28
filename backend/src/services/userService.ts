import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { Role } from "../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/appError.js";
import { dateOnly } from "../utils/date.js";
import { publicUser, publicUsers } from "../utils/publicUser.js";
import type {
  CreateQuickClientData,
  CreateUserData,
  UpdateUserData,
} from "../validations/userValidation.js";

type Actor = {
  id: string;
  role: Role;
};

function assertAdmin(actor: Actor) {
  if (actor.role !== Role.ADMIN) {
    throw new AppError("Voce nao tem permissao para gerenciar usuarios.", 403);
  }
}

function assertTeam(actor: Actor) {
  if (actor.role !== Role.ADMIN && actor.role !== Role.PROFESSIONAL) {
    throw new AppError("Voce nao tem permissao para gerenciar clientes.", 403);
  }
}

function ensureOwnUserOrAdmin(actor: Actor, userId: string) {
  if (actor.role !== Role.ADMIN && actor.id !== userId) {
    throw new AppError("Voce so pode acessar seus proprios dados.", 403);
  }
}

export const userService = {
  async listClients(actor: Actor) {
    assertTeam(actor);

    const users = await prisma.user.findMany({
      where: {
        active: true,
        role: Role.CLIENT,
      },
      orderBy: { name: "asc" },
    });

    return publicUsers(users);
  },

  async list(actor: Actor) {
    assertAdmin(actor);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { professional: true },
    });

    return users.map(({ passwordHash: _passwordHash, ...user }) => user);
  },

  async getById(actor: Actor, id: string) {
    ensureOwnUserOrAdmin(actor, id);

    const user = await prisma.user.findUnique({
      where: { id },
      include: { professional: true },
    });

    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;

    return safeUser;
  },

  async create(actor: Actor, data: CreateUserData) {
    assertAdmin(actor);

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
        birthDate: data.birthDate ? dateOnly(data.birthDate) : null,
        passwordHash,
        role: data.role,
        avatarUrl: data.avatarUrl,
        points: data.points ?? 0,
        level: data.level ?? 1,
        active: data.active ?? true,
      },
    });

    return publicUser(user);
  },

  async createQuickClient(actor: Actor, data: CreateQuickClientData) {
    assertTeam(actor);

    const email = data.email?.trim() || `cliente-${randomUUID()}@clubdorafa.local`;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("Este e-mail ja esta cadastrado.", 409);
    }

    const passwordHash = await bcrypt.hash(randomUUID(), 10);

    const user = await prisma.user.create({
      data: {
        active: true,
        email,
        name: data.name,
        passwordHash,
        phone: data.phone,
        role: Role.CLIENT,
      },
    });

    return publicUser(user);
  },

  async update(actor: Actor, id: string, data: UpdateUserData) {
    ensureOwnUserOrAdmin(actor, id);

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    if (actor.role !== Role.ADMIN) {
      const forbiddenFields = ["email", "role", "points", "level", "active"];
      const hasForbiddenField = forbiddenFields.some((field) => field in data);

      if (hasForbiddenField) {
        throw new AppError("Voce nao pode alterar dados administrativos.", 403);
      }
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new AppError("Este e-mail ja esta cadastrado.", 409);
      }
    }

    if (data.password && actor.role !== Role.ADMIN) {
      if (!data.currentPassword) {
        throw new AppError("Informe a senha atual para alterar sua senha.");
      }

      const currentPasswordMatches = await bcrypt.compare(
        data.currentPassword,
        user.passwordHash,
      );

      if (!currentPasswordMatches) {
        throw new AppError("Senha atual incorreta.", 401);
      }
    }

    const passwordHash = data.password
      ? await bcrypt.hash(data.password, 10)
      : undefined;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        birthDate:
          data.birthDate === undefined
            ? undefined
            : data.birthDate
              ? dateOnly(data.birthDate)
              : null,
        role: data.role,
        avatarUrl: data.avatarUrl,
        points: data.points,
        level: data.level,
        active: data.active,
        passwordHash,
      },
    });

    return publicUser(updatedUser);
  },

  async remove(actor: Actor, id: string) {
    assertAdmin(actor);

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { active: false },
    });

    return publicUser(updatedUser);
  },
};
