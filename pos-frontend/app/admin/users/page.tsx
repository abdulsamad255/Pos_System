// app/admin/users/page.tsx
"use client";

import { useState } from "react";
import { ManagerPage } from "@/components/ManagerPage";
import { apiFetch } from "@/lib/api";

type NewUserPayload = {
  name: string;
  email: string;
  password: string;
  role: "manager" | "cashier";
};

export default function UserManagementPage() {
  const [form, setForm] = useState<NewUserPayload>({
    name: "",
    email: "",
    password: "",
    role: "cashier",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (
    field: keyof NewUserPayload,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]:
        field === "role" ? (value as "cashier" | "manager") : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Name, email and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      });

      setSuccess(
        `User "${form.name}" created successfully with role "${form.role}".`
      );
      setForm({
        name: "",
        email: "",
        password: "",
        role: "cashier",
      });
    } catch (err: any) {
      setError(err?.message ?? "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ManagerPage>
      <div className="max-w-md space-y-4">
        <h1 className="text-xl font-bold">User Management</h1>
        <p className="text-sm text-gray-700">
          Create new users (cashiers or managers). Only managers can access
          this page.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded border bg-white p-4 text-sm"
        >
          <div>
            <label className="mb-1 block font-medium">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="Password"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">Role</label>
            <select
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className="w-full rounded border px-3 py-2"
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Cashiers can use POS. Managers can see reports and user
              management.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && (
            <p className="text-sm text-green-600">{success}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Creating user..." : "Create user"}
          </button>
        </form>
      </div>
    </ManagerPage>
  );
}
