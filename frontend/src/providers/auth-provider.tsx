"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type AuthUser,
  clearToken,
  fetchMeApi,
  getStoredUser,
  getToken,
  loginApi,
  registerAuthApi,
  setStoredUser,
  setToken,
} from "@/lib/auth";
import { useProgress } from "@/store/use-progress";
import type { ServerProfile } from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const applyServer = useProgress((s) => s.applyServer);

  // Restore session on mount
  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser(stored);
      // Refresh profile from server
      void fetchMeApi().then((data) => {
        if (data?.user) {
          setUser(data.user);
          setStoredUser(data.user);
          if (data.profile) {
            applyServer(data.user.tg_id, data.profile as unknown as ServerProfile);
          }
        }
      });
    }
    setIsLoading(false);
  }, [applyServer]);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const result = await loginApi(username, password);
      if (!result) return false;
      setToken(result.token);
      setStoredUser(result.user);
      setUser(result.user);
      if (result.profile) {
        applyServer(result.user.tg_id, result.profile as unknown as ServerProfile);
      }
      return true;
    },
    [applyServer],
  );

  const register = useCallback(
    async (username: string, password: string, displayName: string): Promise<boolean> => {
      const result = await registerAuthApi(username, password, displayName);
      if (!result) return false;
      setToken(result.token);
      setStoredUser(result.user);
      setUser(result.user);
      if (result.profile) {
        applyServer(result.user.tg_id, result.profile as unknown as ServerProfile);
      }
      return true;
    },
    [applyServer],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
