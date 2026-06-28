import type { User } from "../generated/prisma/client.js";

export function publicUser(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user;

  return safeUser;
}

export function publicUsers(users: User[]) {
  return users.map(publicUser);
}
