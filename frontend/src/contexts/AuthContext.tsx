import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import { api } from "../services/api";
import type { AuthResponse, User } from "../types/auth";
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  persistAuth,
} from "../utils/authStorage";

type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterData = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  loading: boolean;
  token: string | null;
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
  register: (data: RegisterData) => Promise<User>;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const applyAuth = useCallback((nextToken: string, nextUser: User) => {
    persistAuth(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      logout();
      return;
    }

    const { data } = await api.get<User>("/auth/me");
    persistAuth(storedToken, data);
    setToken(storedToken);
    setUser(data);
  }, [logout]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const { data } = await api.post<AuthResponse>("/auth/login", credentials);
      applyAuth(data.token, data.user);
      return data.user;
    },
    [applyAuth],
  );

  const register = useCallback(
    async (payload: RegisterData) => {
      const { data } = await api.post<AuthResponse>("/auth/register", payload);
      applyAuth(data.token, data.user);
      return data.user;
    },
    [applyAuth],
  );

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        if (getStoredToken()) {
          await refreshUser();
        }
      } catch {
        logout();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, [logout, refreshUser]);

  useEffect(() => {
    function handleUnauthorized() {
      logout();
      toast.error("Sua sessao expirou. Entre novamente.");
    }

    window.addEventListener("club-do-rafa:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("club-do-rafa:unauthorized", handleUnauthorized);
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token && user),
      loading,
      token,
      user,
      login,
      logout,
      register,
      refreshUser,
    }),
    [loading, login, logout, refreshUser, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

