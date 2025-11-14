// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useAuth } from "./AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between border-b px-4 py-2 bg-white print:hidden">
      <div className="flex items-center gap-4">
        <span className="font-bold text-lg">POS System</span>

        <Link href="/" className="text-sm text-blue-600 hover:underline">
          Dashboard
        </Link>

        <Link
          href="/products"
          className="text-sm text-blue-600 hover:underline"
        >
          Products
        </Link>

        <Link href="/pos" className="text-sm text-blue-600 hover:underline">
          POS
        </Link>

        <Link href="/sales" className="text-sm text-blue-600 hover:underline">
          Sales
        </Link>

        <Link
          href="/reports"
          className="text-sm text-blue-600 hover:underline"
        >
          Reports
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-gray-700">
              {user.name} ({user.role})
            </span>
            <button
              onClick={logout}
              className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
