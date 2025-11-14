// app/profile/page.tsx
"use client";

import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/components/AuthContext";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  // ProtectedPage already ensures user is logged in,
  // but we still handle loading and null user safely.
  return (
    <ProtectedPage>
      <div className="max-w-md space-y-4">
        <h1 className="text-xl font-bold">My Profile</h1>
        <p className="text-sm text-gray-700">
          View your account details for this POS system.
        </p>

        {loading && (
          <p className="text-sm text-gray-600">Loading user information...</p>
        )}

        {!loading && !user && (
          <p className="text-sm text-red-600">
            Could not load user details. Please try logging out and in again.
          </p>
        )}

        {!loading && user && (
          <div className="space-y-3 rounded border bg-white p-4 text-sm">
            <div>
              <span className="block text-xs font-semibold text-gray-500">
                Name
              </span>
              <span className="text-gray-800">{user.name}</span>
            </div>

            <div>
              <span className="block text-xs font-semibold text-gray-500">
                Email
              </span>
              <span className="text-gray-800">{user.email}</span>
            </div>

            <div>
              <span className="block text-xs font-semibold text-gray-500">
                Role
              </span>
              <span className="capitalize text-gray-800">
                {user.role}
              </span>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
