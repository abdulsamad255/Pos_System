// components/ProtectedPage.tsx
"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";

type Props = {
  children: ReactNode;
};

export function ProtectedPage({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    return null; // redirect in progress
  }

  return <>{children}</>;
}
