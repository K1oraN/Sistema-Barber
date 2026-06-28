export type UserRole = "CLIENT" | "PROFESSIONAL" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  points: number;
  level: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};
