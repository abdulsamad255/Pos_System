// components/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import type { User, LoginResponse } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to fetch current user if we have a token
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("authToken")
        : null;

    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch<User>("/api/users/me")
      .then((u) => {
        setUser(u);
      })
      .catch(() => {
        // token invalid, clear it
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("authToken");
        }
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (typeof window !== "undefined") {
      window.localStorage.setItem("authToken", data.token);
    }
    setUser(data.user);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("authToken");
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
