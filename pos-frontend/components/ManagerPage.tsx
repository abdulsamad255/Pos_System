// components/ManagerPage.tsx
"use client";

import { ReactNode } from "react";
import { ProtectedPage } from "./ProtectedPage";
import { useAuth } from "./AuthContext";

type ManagerPageProps = {
  children: ReactNode;
};

export function ManagerPage({ children }: ManagerPageProps) {
  const { user } = useAuth();

  return (
    <ProtectedPage>
      {user && user.role === "manager" ? (
        children
      ) : (
        <div className="p-4">
          <h1 className="mb-2 text-xl font-bold">Access denied</h1>
          <p className="text-sm text-gray-700">
            You must be a manager to view this page.
          </p>
        </div>
      )}
    </ProtectedPage>
  );
}
